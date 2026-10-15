import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { HostingConcept, InvalidFairName, NoSuchFair, migrateLegacyFairCodes } from "./Hosting.ts";

const url = process.env.MONGODB_URL;
if (!url) {
  throw new Error("MONGODB_URL is not set. Add it to your .env file.");
}

const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`hosting_test_${crypto.randomUUID().replaceAll("-", "")}`);
const hosting = new HostingConcept(db);

beforeAll(async () => {
  await client.connect();
});

afterAll(async () => {
  await db.dropDatabase();
  await client.close();
});

test("creates and retrieves a fair", async () => {
  const { fair, code } = await hosting.create({ organizer: "maya", name: "Club Fair" });
  expect(code).toMatch(/^[A-F0-9]{8}$/);
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Club Fair", code, listed: false },
  ]);
  expect(await hosting._exists({ fair })).toEqual({ exists: true });
  expect(await hosting._byCode({ code: code.toLowerCase() })).toEqual([{ fair }]);
});

test("uses IDs rather than names to distinguish fairs", async () => {
  const first = await hosting.create({ organizer: "maya", name: "Fall Fair" });
  const second = await hosting.create({ organizer: "maya", name: "Fall Fair" });
  expect(first.fair).not.toBe(second.fair);
  expect(await hosting._get(first)).toHaveLength(1);
  expect(await hosting._get(second)).toHaveLength(1);
});

test("uses distinct codes for fairs with duplicate names", async () => {
  const first = await hosting.create({ organizer: "maya", name: "Discovery Fair" });
  const second = await hosting.create({ organizer: "adam", name: "Discovery Fair" });
  expect(first.code).not.toBe(second.code);
  expect(await hosting._byCode({ code: first.code })).toEqual([{ fair: first.fair }]);
  expect(await hosting._byCode({ code: second.code })).toEqual([{ fair: second.fair }]);
  expect(await hosting._codeExists({ code: "FFFFFFFF" })).toEqual({ exists: false });
});

test("assigns codes to fairs created before codes existed", async () => {
  const fair = crypto.randomUUID();
  await db.collection<{ _id: string; organizer: string; name: string }>("hosting.fairs")
    .insertOne({ _id: fair, organizer: "maya", name: "Old Fair" });
  await migrateLegacyFairCodes(db);
  const [row] = await hosting._get({ fair });
  expect(row?.code).toMatch(/^[A-F0-9]{8}$/);
  expect(await hosting._byCode({ code: row!.code })).toEqual([{ fair }]);
});

test("only the organizer can edit a fair", async () => {
  const { fair, code } = await hosting.create({ organizer: "maya", name: "Before" });
  expect(await hosting._owns({ organizer: "maya", fair })).toEqual({ owns: true });
  expect(await hosting._owns({ organizer: "adam", fair })).toEqual({ owns: false });
  await expect(hosting.verifyOwner({ organizer: "adam", fair }))
    .rejects.toBeInstanceOf(NoSuchFair);
  expect(await hosting.verifyOwner({ organizer: "maya", fair })).toEqual({});
  await expect(
    hosting.edit({ organizer: "adam", fair, name: "Wrong" }),
  ).rejects.toBeInstanceOf(NoSuchFair);
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Before", code, listed: false },
  ]);
  await hosting.edit({ organizer: "maya", fair, name: "After" });
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "After", code, listed: false },
  ]);
});

test("refuses missing fairs and returns no row for lookup", async () => {
  expect(await hosting._get({ fair: "missing" })).toEqual([]);
  expect(await hosting._exists({ fair: "missing" })).toEqual({ exists: false });
  await expect(
    hosting.edit({ organizer: "maya", fair: "missing", name: "New" }),
  ).rejects.toBeInstanceOf(NoSuchFair);
});

test("refuses blank names without changing state", async () => {
  await expect(
    hosting.create({ organizer: "maya", name: "   " }),
  ).rejects.toBeInstanceOf(InvalidFairName);
  const { fair, code } = await hosting.create({ organizer: "maya", name: "Kept" });
  await expect(
    hosting.edit({ organizer: "maya", fair, name: "   " }),
  ).rejects.toBeInstanceOf(InvalidFairName);
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Kept", code, listed: false },
  ]);
});

test("only the organizer can list and unlist a fair", async () => {
  const { fair, code } = await hosting.create({ organizer: "maya", name: "Public fair" });
  expect(await hosting._public({})).not.toContainEqual({ fair, name: "Public fair", organizer: "maya" });
  await expect(hosting.setListed({ organizer: "adam", fair, listed: true }))
    .rejects.toBeInstanceOf(NoSuchFair);
  await hosting.setListed({ organizer: "maya", fair, listed: true });
  expect(await hosting._public({})).toContainEqual({ fair, name: "Public fair", organizer: "maya" });
  expect(JSON.stringify(await hosting._public({}))).not.toContain(code);
  expect((await hosting._get({ fair }))[0]?.listed).toBe(true);
  await hosting.setListed({ organizer: "maya", fair, listed: false });
  expect(await hosting._public({})).not.toContainEqual({ fair, name: "Public fair", organizer: "maya" });
  expect(await hosting._byCode({ code })).toEqual([{ fair }]);
});
