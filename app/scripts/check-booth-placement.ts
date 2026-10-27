const base = process.env.API_URL ?? "http://127.0.0.1:8080/api";
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
    return { status: response.status, body: await response.json() as Record<string, any> };
  };
}

function ok(result: { status: number; body: Record<string, any> }, label: string) {
  if (result.status !== 200 || result.body.error) throw new Error(`${label}: ${JSON.stringify(result)}`);
  return result.body;
}

function error(result: { status: number; body: Record<string, any> }, status: number, label: string) {
  if (result.status !== status || !result.body.error) throw new Error(`${label}: ${JSON.stringify(result)}`);
}

const organizer = actor();
const outsider = actor();
ok(await organizer("/auth/register", { username: `booth_org_${suffix}`, password: "testpass123" }), "register organizer");
ok(await outsider("/auth/register", { username: `booth_other_${suffix}`, password: "testpass123" }), "register outsider");
const { fair } = ok(await organizer("/fairs/create", { name: "Booth placement smoke test" }), "create fair");
const small = ok(await organizer("/booths/create-sized", {
  fair, size: "small", name: "Small booth", description: "", meetingUrl: "",
}), "create small booth").booth;
const large = ok(await organizer("/booths/create-sized", {
  fair, size: "large", name: "Large booth", description: "", meetingUrl: "",
}), "create large booth").booth;
let page = ok(await organizer("/fairs/page", { fair }), "load placed booths").page;
const byId = (id: string) => page.booths.find((booth: { booth: string }) => booth.booth === id);
if (JSON.stringify(byId(small)?.footprint) !== JSON.stringify({ x: 7, y: 1, width: 2, height: 2 }))
  throw new Error("Small booth did not receive the expected open position and size.");
const largeFootprint = byId(large)?.footprint;
if (!largeFootprint || largeFootprint.width !== 4 || largeFootprint.height !== 3 ||
  !(largeFootprint.x + largeFootprint.width <= 6 || largeFootprint.y >= 4))
  throw new Error(`Large booth was not spaced away from the first booth: ${JSON.stringify(largeFootprint)}`);
error(await outsider("/booths/move", { booth: small, position: { x: 7, y: 7 } }), 404, "outsider move");
error(await outsider("/booths/delete", { booth: small }), 404, "outsider delete");
error(await organizer("/booths/move", { booth: small, position: largeFootprint }), 409, "overlapping move");
error(await organizer("/booths/move", { booth: large, position: { x: 8, y: 8 } }), 400, "out-of-bounds move");
ok(await organizer("/fairs/enter", { fair }), "enter fair");
for (const destination of [
  { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
  { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 1 },
]) ok(await organizer("/fairs/move", { destination }), "walk to small booth");
const openCall = ok(await organizer("/calls/open", {
  booth: small, joinUrl: "https://meet.example/booth-placement",
}), "open booth call").call;
error(await organizer("/booths/move", { booth: small, position: { x: 7, y: 7 } }), 409, "move during live call");
ok(await organizer("/calls/close", { call: openCall }), "close booth call");
ok(await organizer("/calls/open-invite", {
  booth: small, joinUrl: "https://meet.example/booth-placement-private",
}), "open invite-only call");
ok(await organizer("/fairs/move", { destination: { x: 7, y: 0 } }), "leave invite-only booth");
error(await organizer("/booths/move", { booth: small, position: { x: 7, y: 7 } }), 409, "move during paused call");
ok(await organizer("/fairs/move", { destination: { x: 7, y: 1 } }), "return to booth");
const resumedPage = ok(await organizer("/fairs/page", { fair }), "load resumed call").page;
const resumedCall = resumedPage.booths.find((entry: { booth: string }) => entry.booth === small)?.calls[0]?.call;
if (!resumedCall) throw new Error("Invite-only call did not resume after returning to the booth.");
ok(await organizer("/calls/close", { call: resumedCall }), "close resumed call");
ok(await organizer("/booths/move", { booth: small, position: { x: 7, y: 7 } }), "move small booth");
page = ok(await organizer("/fairs/page", { fair }), "load moved booth").page;
if (JSON.stringify(byId(small)?.footprint) !== JSON.stringify({ x: 7, y: 7, width: 2, height: 2 }))
  throw new Error("Moving the booth did not preserve its size.");
ok(await organizer("/booths/delete", { booth: small }), "delete booth");
error(await organizer("/booths/delete", { booth: small }), 404, "delete absent booth");
page = ok(await organizer("/fairs/page", { fair }), "load fair after deletion").page;
if (byId(small) || !byId(large)) throw new Error("Deletion did not remove only the selected booth.");
const pausedBooth = ok(await organizer("/booths/create", {
  fair, footprint: { x: 7, y: 1, width: 2, height: 2 },
  name: "Paused booth", description: "", meetingUrl: "",
}), "create booth for paused deletion").booth;
ok(await organizer("/calls/open-invite", {
  booth: pausedBooth, joinUrl: "https://meet.example/paused-deletion",
}), "open call for paused deletion");
ok(await organizer("/fairs/move", { destination: { x: 7, y: 0 } }), "pause call before deletion");
ok(await organizer("/booths/delete", { booth: pausedBooth }), "delete paused booth");
const liveBooth = ok(await organizer("/booths/create", {
  fair, footprint: { x: 7, y: 1, width: 2, height: 2 },
  name: "Live booth", description: "", meetingUrl: "",
}), "create booth for live deletion").booth;
ok(await organizer("/fairs/move", { destination: { x: 7, y: 1 } }), "enter live deletion booth");
ok(await organizer("/calls/open", {
  booth: liveBooth, joinUrl: "https://meet.example/live-deletion",
}), "open call for live deletion");
ok(await organizer("/booths/delete", { booth: liveBooth }), "delete live booth");
error(await organizer("/calls/join", { booth: liveBooth }), 404, "deleted booth call link");
page = ok(await organizer("/fairs/page", { fair }), "load fair after call cleanup").page;
if (byId(pausedBooth) || byId(liveBooth) || !byId(large))
  throw new Error("Deleting live or paused booths did not clean up the fair.");
console.log("Booth placement, movement, deletion of idle/live/paused booths, and ownership checks passed.");
