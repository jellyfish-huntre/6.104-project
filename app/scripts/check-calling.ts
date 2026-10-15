const base = process.env.API_URL ?? "http://127.0.0.1:4000/api";
const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);

function actor() {
  let cookie = "";
  return async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(base + path, {
      method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const issued = response.headers.get("set-cookie");
    if (issued) cookie = issued.split(";")[0] ?? "";
    return { status: response.status, body: await response.json() as Record<string, any> };
  };
}

function ok(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status !== 200 || result.body.error) throw new Error(`${label}: ${JSON.stringify(result)}`);
  return result.body;
}

const organizer = actor(), representative = actor(), visitor = actor(), anonymous = actor();
const org = `org_${suffix}`, rep = `rep_${suffix}`, guest = `guest_${suffix}`;
const guestToken = crypto.randomUUID();
ok(await organizer("/auth/register", { username: org, password: "testpass123" }), "register organizer");
ok(await representative("/auth/register", { username: rep, password: "testpass123" }), "register representative");
ok(await visitor("/auth/register", { username: guest, password: "testpass123" }), "register visitor");
const { fair } = ok(await organizer("/fairs/create", { name: "Calling integration" }), "create fair");
const { booth } = ok(await organizer("/booths/create", {
  fair, name: "Booth", description: "A call booth", footprint: { x: 0, y: 1, width: 1, height: 1 },
  meetingUrl: "https://meet.example/saved",
}), "create booth");
ok(await organizer("/booths/representatives/add", { booth, representative: rep }), "assign rep");
const savedPage = ok(await visitor("/fairs/page", { fair }), "fair page with saved link").page;
if (!savedPage.booths[0].representatives.some((row: { representative: string }) => row.representative === org)) {
  throw new Error("Fair organizer was not assigned to their new booth");
}
if (!savedPage.booths[0].meetingLinkSaved || JSON.stringify(savedPage).includes("meet.example")) {
  throw new Error("Fair page should show saved-link status without revealing its URL");
}
if ((await visitor("/booths/meeting-link", { booth })).status !== 404) {
  throw new Error("Visitor should not retrieve saved meeting link");
}
if (ok(await representative("/booths/meeting-link", { booth }), "rep reads saved link").joinUrl !== "https://meet.example/saved") {
  throw new Error("Representative did not receive saved meeting link");
}
ok(await representative("/fairs/enter", { fair }), "rep enters");
ok(await visitor("/fairs/enter", { fair }), "visitor enters");
const presence = ok(await visitor("/fairs/presence", { fair }), "read presence").presence;
if (presence.people.length !== 2) throw new Error("Shared fair presence is missing people");
const deniedOpen = await visitor("/calls/open", { booth, joinUrl: "https://meet.example/test" });
if (deniedOpen.status !== 403) throw new Error(`Visitor open should be forbidden: ${JSON.stringify(deniedOpen)}`);
const beforeOpen = await anonymous("/calls/guest-join", { code: savedPage.code, booth, token: guestToken });
if (beforeOpen.status === 200 && !beforeOpen.body.error) throw new Error("Guest received a link before call opened");
ok(await representative("/fairs/move", { destination: { x: 0, y: 1 } }), "rep moves in");
const { call } = ok(await representative("/calls/open", { booth, joinUrl: "https://meet.example/test" }), "open call");
const absentGuest = await anonymous("/calls/guest-join", { code: savedPage.code, booth, token: guestToken });
if (absentGuest.status !== 403) throw new Error("An absent guest should not get a call link");
const enteredGuest = ok(await anonymous("/fairs/guest-enter", { fair, token: guestToken }), "guest enters");
if (!enteredGuest.person.startsWith("guest:") || enteredGuest.person.includes(guestToken)) {
  throw new Error("Guest identity should be a public pseudonym, not its private token");
}
const guestPresence = ok(await anonymous("/fairs/presence", { fair }), "guest presence").presence;
if (!guestPresence.people.some((row: { person: string }) => row.person === enteredGuest.person) ||
    JSON.stringify(guestPresence).includes(guestToken)) throw new Error("Guest presence is not shared safely");
const outsideGuest = await anonymous("/calls/guest-join", { code: savedPage.code, booth, token: guestToken });
if (outsideGuest.status !== 403) throw new Error("Guest outside booth should not get a call link");
ok(await anonymous("/fairs/guest-move", { token: guestToken, destination: { x: 0, y: 1 } }), "guest moves in");
const guestJoin = ok(await anonymous("/calls/guest-join", { code: savedPage.code, booth, token: guestToken }), "anonymous guest joins");
if (guestJoin.joinUrl !== "https://meet.example/test") throw new Error("Guest received wrong call link");
const wrongCode = await anonymous("/calls/guest-join", { code: "00000000", booth, token: guestToken });
if (wrongCode.status === 200 && !wrongCode.body.error) throw new Error("Wrong fair code exposed call link");
const otherFair = ok(await organizer("/fairs/create", { name: "Other fair" }), "create other fair");
const otherBooth = ok(await organizer("/booths/create", {
  fair: otherFair.fair, name: "Other booth", description: "", meetingUrl: "",
  footprint: { x: 1, y: 1, width: 1, height: 1 },
}), "create other booth");
const wrongBooth = await anonymous("/calls/guest-join", { code: savedPage.code, booth: otherBooth.booth, token: guestToken });
if (wrongBooth.status === 200 && !wrongBooth.body.error) throw new Error("Booth from another fair exposed a link");
const page = ok(await visitor("/fairs/page", { fair }), "fair page").page;
if (JSON.stringify(page).includes("meet.example") || page.booths[0].calls[0].call !== call) {
  throw new Error("Fair page must show call without link");
}
const deniedJoin = await visitor("/calls/join", { booth });
if (deniedJoin.status !== 403) throw new Error(`Visitor join should be forbidden: ${JSON.stringify(deniedJoin)}`);
ok(await visitor("/fairs/move", { destination: { x: 0, y: 1 } }), "visitor moves in");
const joined = ok(await visitor("/calls/join", { booth }), "join call");
if (joined.joinUrl !== "https://meet.example/test") throw new Error("Wrong call link");
ok(await representative("/fairs/move", { destination: { x: 0, y: 0 } }), "rep leaves booth");
const afterMove = ok(await visitor("/fairs/page", { fair }), "page after host moves").page;
if (afterMove.booths[0].calls.length) throw new Error("Call remained open after host moved out");
const closedJoin = await visitor("/calls/join", { booth });
if (closedJoin.status !== 404) throw new Error("Closed call still yielded a link");
const closedGuestJoin = await anonymous("/calls/guest-join", { code: savedPage.code, booth, token: guestToken });
if (closedGuestJoin.status === 200 && !closedGuestJoin.body.error) throw new Error("Guest received a closed call link");
ok(await representative("/fairs/move", { destination: { x: 0, y: 1 } }), "rep returns");
ok(await representative("/calls/open", { booth, joinUrl: "https://meet.example/remove" }), "open again");
ok(await organizer("/booths/representatives/remove", { booth, representative: rep }), "remove representative");
const afterRemoval = ok(await visitor("/fairs/page", { fair }), "page after removal").page;
if (afterRemoval.booths[0].calls.length) throw new Error("Call remained open after representative removal");
ok(await organizer("/booths/representatives/add", { booth, representative: rep }), "reassign rep");
ok(await representative("/calls/open", { booth, joinUrl: "https://meet.example/leave" }), "open before leaving");
ok(await representative("/fairs/leave", {}), "rep leaves fair");
const afterLeave = ok(await visitor("/fairs/page", { fair }), "page after leave").page;
if (afterLeave.booths[0].calls.length) throw new Error("Call remained open after host left fair");
console.log("Calling HTTP flow passed", { fair, booth, call, deniedOpen: deniedOpen.status, deniedJoin: deniedJoin.status });
