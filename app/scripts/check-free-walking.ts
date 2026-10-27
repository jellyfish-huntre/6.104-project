const base = process.env.API_URL ?? "http://127.0.0.1:8080/api";
const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);

function actor() {
  let cookie = "";
  return async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
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
function denied(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status !== 400) throw new Error(`${label}: ${JSON.stringify(result)}`);
}

const organizer = actor();
const visitor = actor();
ok(await organizer("/auth/register", { username: `walk_org_${suffix}`, password: "testpass123" }), "register organizer");
ok(await visitor("/auth/register", { username: `walk_guest_${suffix}`, password: "testpass123" }), "register visitor");
const { fair } = ok(await organizer("/fairs/create", { name: "Free walking test" }), "create fair");
const { booth } = ok(await organizer("/booths/create", {
  fair, name: "Walk-in booth", description: "", meetingUrl: "",
  footprint: { x: 1, y: 0, width: 2, height: 2 },
}), "create booth");
ok(await organizer("/fairs/enter", { fair }), "enter fair");
for (const x of [0.2, 0.4, 0.6]) {
  await Bun.sleep(105);
  ok(await organizer("/fairs/move-free", { destination: { x, y: 0 } }), `walk to ${x}`);
}
const { call } = ok(await organizer("/calls/open", {
  booth, joinUrl: "https://meet.example/walk-test",
}), "open call from fractional booth position");
await Bun.sleep(105);
ok(await organizer("/fairs/move-free", { destination: { x: 0.4, y: 0 } }), "walk out of booth");
const page = ok(await organizer("/fairs/page", { fair }), "load fair after exit").page;
if (page.booths.find((item: { booth: string }) => item.booth === booth)?.calls.length !== 0)
  throw new Error(`Walking out did not close call ${call}.`);
denied(await organizer("/fairs/move-free", { destination: { x: 2, y: 0 } }), "refuse jump");

ok(await visitor("/fairs/enter", { fair }), "visitor enters");
for (const destination of [
  { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 },
]) ok(await visitor("/fairs/move", { destination }), "legacy route to plant");
denied(await visitor("/fairs/move", { destination: { x: 3, y: 3 } }), "block legacy step through plant");
await Bun.sleep(105);
ok(await visitor("/fairs/move-free", { destination: { x: 3, y: 2.2 } }), "approach plant");
await Bun.sleep(105);
ok(await visitor("/fairs/move-free", { destination: { x: 3, y: 2.5 } }), "approach plant edge");
await Bun.sleep(105);
ok(await visitor("/fairs/move-free", { destination: { x: 3, y: 2.75 } }), "enter the leaf overhang");
await Bun.sleep(105);
denied(await visitor("/fairs/move-free", { destination: { x: 3, y: 2.9 } }), "block plant pot collider");
const guest = actor();
const token = crypto.randomUUID();
ok(await guest("/fairs/guest-enter", { fair, token }), "guest enters");
const guestMove = ok(await guest("/fairs/guest-move-free", {
  token, destination: { x: 0.2, y: 0 },
}), "guest walks freely");
if (guestMove.position.x !== 0.2) throw new Error("Guest free-move response returned an old position.");
console.log("Free walking, speed validation, obstacle collision, guest movement, and booth-call exit passed.");
