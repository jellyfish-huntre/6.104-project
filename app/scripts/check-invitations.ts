const base = process.env.API_URL ?? "http://127.0.0.1:4000/api";
const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);

function actor() {
  let cookie = "";
  return async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const issued = response.headers.get("set-cookie");
    if (issued) cookie = issued.split(";")[0] ?? "";
    console.log(`${path}: ${response.status}`);
    return { status: response.status, body: await response.json() as Record<string, any> };
  };
}

function ok(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status !== 200 || result.body.error) throw new Error(`${label}: ${JSON.stringify(result)}`);
  return result.body;
}

function denied(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status === 200 && !result.body.error) throw new Error(`${label} unexpectedly succeeded`);
}

function forbidden(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status !== 403) throw new Error(`${label} should be forbidden: ${JSON.stringify(result)}`);
}

const organizer = actor(), rep = actor(), student = actor(), outsider = actor(), guest = actor();
const token = crypto.randomUUID();
for (const [send, username] of [[organizer, `org_${suffix}`], [rep, `rep_${suffix}`],
  [student, `student_${suffix}`], [outsider, `other_${suffix}`]] as const) {
  ok(await send("/auth/register", { username, password: "testpass123" }), `register ${username}`);
}
const { fair } = ok(await organizer("/fairs/create", { name: "Invitation integration" }), "create fair");
const { booth } = ok(await organizer("/booths/create", {
  fair, name: "Robotics", description: "Ask us about projects", meetingUrl: "",
  footprint: { x: 0, y: 1, width: 1, height: 1 },
}), "create booth");
ok(await organizer("/booths/representatives/add", { booth, representative: `rep_${suffix}` }), "assign rep");
const code = ok(await organizer("/fairs/page", { fair }), "read fair").page.code;
ok(await rep("/fairs/enter", { fair }), "rep enters");
ok(await rep("/fairs/move", { destination: { x: 0, y: 1 } }), "rep moves to booth");
ok(await student("/fairs/enter", { fair }), "student enters");
ok(await outsider("/fairs/enter", { fair }), "outsider enters");
const guestPerson = ok(await guest("/fairs/guest-enter", { fair, token }), "guest enters").person;

const { call } = ok(await rep("/calls/open-invite", { booth, joinUrl: "https://meet.example/invite-one" }), "open invite call");
const page = ok(await student("/fairs/page", { fair }), "read public page").page;
if (page.booths[0].calls[0].mode !== "INVITE_ONLY" || page.booths[0].queues.length !== 1 ||
  JSON.stringify(page).includes("invite-one")) throw new Error("The public fair page exposed the link or hid the queue");
forbidden(await outsider("/calls/mode", {
  call, mode: "OPEN_GROUP", joinUrl: "https://meet.example/outsider",
}), "outsider changes call mode");
forbidden(await outsider("/calls/close", { call }), "outsider closes call");
forbidden(await outsider("/queues/accepting", { booth, accepting: false }), "outsider closes queue");
forbidden(await outsider("/queues/invite-next", { booth }), "outsider invites a visitor");
for (const [path, input] of [
  ["/calls/mode", { call, mode: "OPEN_GROUP", joinUrl: "https://meet.example/anonymous" }],
  ["/calls/close", { call }],
  ["/queues/accepting", { booth, accepting: false }],
  ["/queues/invite-next", { booth }],
] as const) {
  const result = await guest(path, input);
  if (result.status !== 401) throw new Error(`${path} without a session should require sign-in: ${JSON.stringify(result)}`);
}
const afterDeniedControls = ok(await student("/fairs/page", { fair }), "read call after denied controls").page.booths[0];
if (afterDeniedControls.calls[0]?.call !== call || afterDeniedControls.calls[0]?.mode !== "INVITE_ONLY" ||
  afterDeniedControls.queues[0]?.accepting !== true) {
  throw new Error("A refused representative control changed the call or queue");
}
const representativeRequest = await rep("/queues/join", { booth });
if (representativeRequest.status !== 403) throw new Error("Representative requested a turn at their own booth");
ok(await student("/queues/join", { booth }), "student joins queue");
ok(await guest("/queues/guest-join", { code, booth, token }), "guest joins queue");
denied(await student("/queues/join", { booth }), "duplicate request");
denied(await student("/calls/claim-invitation", { booth }), "claim before invitation");
denied(await outsider("/queues/booth", { booth }), "outsider reads host queue");
denied(await outsider("/queues/remove", { booth, visitor: `student_${suffix}` }), "outsider removes visitor");
const hostQueue = ok(await rep("/queues/booth", { booth }), "host reads queue").queue.visitors;
if (hostQueue.length !== 2 || hostQueue[0].person !== `student_${suffix}` || hostQueue[1].person !== guestPerson) {
  throw new Error(`Wrong queue order: ${JSON.stringify(hostQueue)}`);
}
const first = ok(await rep("/queues/invite-next", { booth }), "invite student");
if (first.visitor !== `student_${suffix}`) throw new Error("First invitation skipped the student");
const afterInvite = ok(await rep("/queues/booth", { booth }), "read invited roster").queue.visitors;
if (afterInvite.length !== 2 || !afterInvite[0].invitedUntil || afterInvite[1].invitedUntil) {
  throw new Error(`Invited visitor is missing from the host roster: ${JSON.stringify(afterInvite)}`);
}
forbidden(await outsider("/calls/claim-invitation", { booth }), "outsider claims invitation");
denied(await student("/calls/join", { booth }), "student bypasses invite through group route");
const claimed = ok(await student("/calls/claim-invitation", { booth }), "student claims invitation");
if (claimed.joinUrl !== "https://meet.example/invite-one") throw new Error("Student received the wrong link");
ok(await rep("/queues/accepting", { booth, accepting: false }), "stop new requests");
denied(await outsider("/queues/join", { booth }), "new request while closed");
const second = ok(await rep("/queues/invite-next", { booth }), "invite guest while closed");
if (second.visitor !== guestPerson) throw new Error("Existing request was lost when joining closed");
ok(await rep("/queues/remove", { booth, visitor: guestPerson }), "remove invited guest");
forbidden(await guest("/calls/guest-claim-invitation", { code, booth, token }), "removed guest claims invitation");
ok(await rep("/fairs/move", { destination: { x: 0, y: 0 } }), "rep leaves booth");
const paused = ok(await student("/fairs/page", { fair }), "read paused queue").page.booths[0];
if (paused.calls.length || !paused.queues[0]?.pausedUntil) throw new Error("Host departure did not pause the queue");
ok(await rep("/fairs/move", { destination: { x: 0, y: 1 } }), "rep returns");
const resumed = ok(await student("/fairs/page", { fair }), "read resumed queue").page.booths[0];
if (resumed.queues[0]?.pausedUntil || resumed.calls[0]?.mode !== "INVITE_ONLY") {
  throw new Error("Returning to the booth did not automatically resume the call and queue");
}
const resumedLink = ok(await student("/calls/claim-invitation", { booth }), "claim after resume").joinUrl;
if (resumedLink !== "https://meet.example/invite-one") throw new Error("Resumed call lost its meeting link");
const newCall = resumed.calls[0].call;
ok(await rep("/calls/close", { call: newCall }), "close invite call and queue");
const closed = ok(await student("/fairs/page", { fair }), "read closed queue").page.booths[0];
if (closed.calls.length || closed.queues.length) throw new Error("Manual close left the queue open");
forbidden(await student("/calls/claim-invitation", { booth }), "stale invitation after call closure");
forbidden(await guest("/calls/guest-claim-invitation", { code, booth, token }), "stale guest invitation after call closure");
const group = ok(await rep("/calls/open", { booth, joinUrl: "https://meet.example/group" }), "open group call");
ok(await rep("/calls/mode", {
  call: group.call, mode: "INVITE_ONLY", joinUrl: "https://meet.example/fresh-invite",
}), "switch to invite-only");
const switched = ok(await student("/fairs/page", { fair }), "read switched mode").page.booths[0];
if (switched.calls[0]?.mode !== "INVITE_ONLY" || switched.queues.length !== 1) {
  throw new Error("Switching to invite-only did not create its queue");
}
ok(await guest("/fairs/guest-enter", { fair, token }), "guest reenters");
ok(await guest("/queues/guest-join", { code, booth, token }), "guest requests another turn");
ok(await guest("/fairs/guest-leave", { token }), "guest leaves fair");
const afterGuestLeaves = ok(await rep("/queues/booth", { booth }), "read queue after guest departure").queue.visitors;
if (afterGuestLeaves.some((visitor: { person: string }) => visitor.person === guestPerson)) {
  throw new Error("Guest departure left a stale queue request");
}
ok(await rep("/calls/mode", {
  call: group.call, mode: "OPEN_GROUP", joinUrl: "https://meet.example/new-group",
}), "switch back to open group");
const backToGroup = ok(await student("/fairs/page", { fair }), "read group mode").page.booths[0];
if (backToGroup.calls[0]?.mode !== "OPEN_GROUP" || backToGroup.queues.length) {
  throw new Error("Switching to open group did not clear the queue");
}
forbidden(await student("/calls/claim-invitation", { booth }), "stale invitation after mode switch");
console.log("Invitation HTTP flow passed", { fair, booth, call, checked: "order, access, stale invitations, guest departure, pause, resume, close, mode switch" });
