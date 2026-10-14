import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { HostingConcept, InvalidFairName, NoSuchFair } from "./Hosting.ts";

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
  const { fair } = await hosting.create({ organizer: "maya", name: "Club Fair" });
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Club Fair" },
  ]);
  expect(await hosting._exists({ fair })).toEqual({ exists: true });
});

test("uses IDs rather than names to distinguish fairs", async () => {
  const first = await hosting.create({ organizer: "maya", name: "Fall Fair" });
  const second = await hosting.create({ organizer: "maya", name: "Fall Fair" });
  expect(first.fair).not.toBe(second.fair);
  expect(await hosting._get(first)).toHaveLength(1);
  expect(await hosting._get(second)).toHaveLength(1);
});

test("only the organizer can edit a fair", async () => {
  const { fair } = await hosting.create({ organizer: "maya", name: "Before" });
  await expect(
    hosting.edit({ organizer: "adam", fair, name: "Wrong" }),
  ).rejects.toBeInstanceOf(NoSuchFair);
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Before" },
  ]);
  await hosting.edit({ organizer: "maya", fair, name: "After" });
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "After" },
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
  const { fair } = await hosting.create({ organizer: "maya", name: "Kept" });
  await expect(
    hosting.edit({ organizer: "maya", fair, name: "   " }),
  ).rejects.toBeInstanceOf(InvalidFairName);
  expect(await hosting._get({ fair })).toEqual([
    { fair, organizer: "maya", name: "Kept" },
  ]);
});
