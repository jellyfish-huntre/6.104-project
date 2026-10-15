import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { SessioningConcept, UnknownSession } from "./Sessioning.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`session_test_${crypto.randomUUID().replaceAll("-", "")}`);
const sessions = new SessioningConcept(db);

beforeAll(async () => { await client.connect(); });
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("resolves a session after creating a new concept instance", async () => {
  const { session, expiresAt } = await sessions.start({ subject: "organizer" });
  expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  const reloaded = new SessioningConcept(db);
  expect(await reloaded.current({ session })).toEqual({ subject: "organizer" });
  expect(await reloaded._active({ session })).toEqual([{ subject: "organizer", expiresAt }]);
  expect(await reloaded.end({ session })).toEqual({ ended: true });
  await expect(sessions.current({ session })).rejects.toBeInstanceOf(UnknownSession);
});

test("rejects invented sessions", async () => {
  expect(await sessions._active({ session: "made-up" })).toEqual([]);
  await expect(sessions.current({ session: "made-up" })).rejects.toBeInstanceOf(UnknownSession);
});
