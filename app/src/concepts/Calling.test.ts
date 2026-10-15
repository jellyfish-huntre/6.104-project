import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { CallingConcept, HostBusy, InvalidCallUrl, NoSuchCall, PlaceBusy } from "./Calling.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`calling_test_${crypto.randomUUID().replaceAll("-", "")}`);
const calls = new CallingConcept(db);
beforeAll(() => client.connect());
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("opens one call per booth and host, shares its URL only through join, and closes it", async () => {
  await expect(calls.open({ host: "rep", place: "booth", joinUrl: "javascript:alert(1)" }))
    .rejects.toBeInstanceOf(InvalidCallUrl);
  const { call } = await calls.open({ host: "rep", place: "booth", joinUrl: "https://meet.example/abc" });
  expect(await calls._openAt({ place: "booth" })).toEqual([{ call, place: "booth", host: "rep" }]);
  expect(await calls.join({ person: "student", call })).toEqual({ joinUrl: "https://meet.example/abc" });
  await expect(calls.open({ host: "other", place: "booth", joinUrl: "https://meet.example/other" }))
    .rejects.toBeInstanceOf(PlaceBusy);
  await expect(calls.open({ host: "rep", place: "other", joinUrl: "https://meet.example/other" }))
    .rejects.toBeInstanceOf(HostBusy);
  await expect(calls.close({ host: "student", call })).rejects.toBeInstanceOf(NoSuchCall);
  await calls.close({ host: "rep", call });
  await expect(calls.join({ person: "student", call })).rejects.toBeInstanceOf(NoSuchCall);
});
