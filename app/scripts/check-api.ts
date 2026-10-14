const address =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ??
  "http://127.0.0.1:3000";
// With --wait, keep trying for 60 seconds. That gives the containers time to start.
const deadline = Date.now() + (process.argv.includes("--wait") ? 60_000 : 0);

while (true) {
  const result = await fetch(`${address}/health`).catch(() => null);
  if (result?.ok) {
    console.log(`The app at ${address} is ready.`);
    break;
  }
  if (Date.now() > deadline) {
    console.error(`The app at ${address} did not become ready.`);
    process.exit(1);
  }
  await Bun.sleep(1000);
}
