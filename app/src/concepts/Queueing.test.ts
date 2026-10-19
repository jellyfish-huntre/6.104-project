import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
  AlreadyWaiting, NoOneWaiting, NotWaiting, QueueClosed, QueueingConcept,
  QueueUnavailable, NoSuchQueue,
} from "./Queueing.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`queueing_test_${crypto.randomUUID().replaceAll("-", "")}`);
let now = Date.parse("2026-10-19T12:00:00.000Z");
const queueing = new QueueingConcept(db, () => now);

beforeAll(() => client.connect());
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("offers waiting visitors in order and prevents duplicate requests", async () => {
  await queueing.open({ target: "booth-a" });
  expect(await queueing.join({ person: "adam", target: "booth-a" })).toEqual({ order: 1 });
  expect(await queueing.join({ person: "bea", target: "booth-a" })).toEqual({ order: 2 });
  await expect(queueing.join({ person: "adam", target: "booth-a" })).rejects.toBeInstanceOf(AlreadyWaiting);
  expect(await queueing._waiting({ target: "booth-a" })).toEqual([
    { person: "adam", order: 1 }, { person: "bea", order: 2 },
  ]);
  const invited = await queueing.inviteNext({ target: "booth-a" });
  expect(invited.person).toBe("adam");
  expect(invited.invitedUntil).toBe("2026-10-19T12:02:00.000Z");
  expect(await queueing._requests({ target: "booth-a" })).toEqual([
    { person: "adam", order: 1, invitedUntil: "2026-10-19T12:02:00.000Z" },
    { person: "bea", order: 2, invitedUntil: "" },
  ]);
  expect(await queueing._invited({ person: "adam", target: "booth-a" })).toEqual({ invited: true });
  expect((await queueing.inviteNext({ target: "booth-a" })).person).toBe("bea");
  await expect(queueing.inviteNext({ target: "booth-a" })).rejects.toBeInstanceOf(NoOneWaiting);
  await queueing.leave({ person: "adam", target: "booth-a" });
  expect(await queueing._invited({ person: "adam", target: "booth-a" })).toEqual({ invited: false });
  await expect(queueing.leave({ person: "adam", target: "booth-a" })).rejects.toBeInstanceOf(NotWaiting);
});

test("stops new requests but preserves and manages the existing queue", async () => {
  await queueing.open({ target: "booth-b" });
  await queueing.join({ person: "cy", target: "booth-b" });
  await queueing.setAccepting({ target: "booth-b", accepting: false });
  await expect(queueing.join({ person: "dee", target: "booth-b" })).rejects.toBeInstanceOf(QueueClosed);
  expect((await queueing.inviteNext({ target: "booth-b" })).person).toBe("cy");
  await queueing.remove({ person: "cy", target: "booth-b" });
  expect(await queueing._invited({ person: "cy", target: "booth-b" })).toEqual({ invited: false });
  await queueing.setAccepting({ target: "booth-b", accepting: true });
  expect(await queueing.join({ person: "dee", target: "booth-b" })).toEqual({ order: 2 });
});

test("expires invitations and closes a paused queue after its grace period", async () => {
  await queueing.open({ target: "booth-c" });
  await queueing.join({ person: "eve", target: "booth-c" });
  await queueing.inviteNext({ target: "booth-c" });
  now += 120_000;
  expect(await queueing._invited({ person: "eve", target: "booth-c" })).toEqual({ invited: false });
  await queueing.expire({ target: "booth-c" });
  expect(await queueing._mine({ person: "eve", target: "booth-c" })).toEqual([]);
  await queueing.join({ person: "eve", target: "booth-c" });
  await queueing.pause({ target: "booth-c" });
  await expect(queueing.setAccepting({ target: "booth-c", accepting: false }))
    .rejects.toBeInstanceOf(QueueUnavailable);
  await expect(queueing.join({ person: "fred", target: "booth-c" })).rejects.toBeInstanceOf(QueueClosed);
  now += 299_000;
  await queueing.resume({ target: "booth-c" });
  expect(await queueing._mine({ person: "eve", target: "booth-c" })).toHaveLength(1);
  await queueing.pause({ target: "booth-c" });
  now += 300_000;
  expect(await queueing._status({ target: "booth-c" })).toEqual([]);
  await expect(queueing.resume({ target: "booth-c" })).rejects.toBeInstanceOf(NoSuchQueue);
  await queueing.expire({ target: "booth-c" });
  expect(await queueing._targets({ person: "eve" })).toEqual([]);
  await queueing.open({ target: "booth-c" });
  expect(await queueing._status({ target: "booth-c" })).toEqual([
    { accepting: true, pausedUntil: "", waiting: 0 },
  ]);
});
