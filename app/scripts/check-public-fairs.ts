const base = process.env.API_URL ?? "http://127.0.0.1:8080/api";
const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);

function actor() {
  let cookie = "";
  return async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
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

const owner = actor(), stranger = actor(), guest = actor();
ok(await owner("/auth/register", { username: `public_${suffix}`, password: "testpass123" }), "register owner");
ok(await stranger("/auth/register", { username: `other_${suffix}`, password: "testpass123" }), "register stranger");
const { fair, code } = ok(await owner("/fairs/create", { name: `Directory test ${suffix}` }), "create fair");
const list = () => guest("/fairs/public", {});
let directory = ok(await list(), "initial directory").directory.fairs;
if (directory.some((row: { fair: string }) => row.fair === fair)) throw new Error("New fair was listed without opt-in");
const denied = await stranger("/fairs/listing", { fair, listed: true });
if (denied.status !== 404) throw new Error(`Nonowner changed listing: ${JSON.stringify(denied)}`);
ok(await owner("/fairs/listing", { fair, listed: true }), "list fair");
directory = ok(await list(), "public directory").directory.fairs;
if (!directory.some((row: { fair: string }) => row.fair === fair) || JSON.stringify(directory).includes(code)) {
  throw new Error("Directory should include the fair without its code");
}
const page = ok(await guest("/fairs/page", { fair }), "open listed fair").page;
if (!page.listed) throw new Error("Fair page did not show listed state");
ok(await owner("/fairs/listing", { fair, listed: false }), "unlist fair");
directory = ok(await list(), "directory after unlisting").directory.fairs;
if (directory.some((row: { fair: string }) => row.fair === fair)) throw new Error("Unlisted fair remained in directory");
if (ok(await guest("/fairs/by-code", { code }), "open by code").fair !== fair) {
  throw new Error("Unlisted fair was not accessible by code");
}
console.log("Public fair flow passed", { fair, code });
