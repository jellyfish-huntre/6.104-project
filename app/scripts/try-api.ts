// Run while `bun run dev` is serving the app. A unique account keeps retries simple.
export {};

const baseUrl = process.argv[2] ?? "http://127.0.0.1:8080/api";
const username = `demo_${crypto.randomUUID().slice(0, 8)}`;

async function post(path: string, body: Record<string, unknown>, cookie?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || "error" in result) {
    throw new Error(`${path}: ${response.status} ${JSON.stringify(result)}`);
  }
  return { result, cookie: response.headers.get("set-cookie")?.split(";", 1)[0] };
}

const registration = await post("/auth/register", {
  username,
  password: "DemoPass1234!",
});
if (!registration.cookie) throw new Error("Registration did not create a session cookie.");

const createdFair = await post("/fairs/create", { name: "Demo Fair" }, registration.cookie);
const fair = createdFair.result.fair;
const code = createdFair.result.code;
if (typeof fair !== "string") throw new Error("Fair creation did not return an ID.");
if (typeof code !== "string" || !/^[A-F0-9]{8}$/.test(code)) {
  throw new Error("Fair creation did not return a shareable code.");
}
const opened = await post("/fairs/by-code", { code: code.toLowerCase() });
if (opened.result.fair !== fair) throw new Error("Fair code did not open the new fair.");

const createdBooth = await post("/booths/create", {
  fair,
  footprint: { x: 1, y: 1, width: 2, height: 2 },
  name: "Demo Booth",
  description: "A booth spanning four cells.",
  meetingUrl: "",
}, registration.cookie);

const page = await post("/fairs/page", { fair });
console.log({ account: username, fair, code, booth: createdBooth.result.booth, page: page.result.page });
