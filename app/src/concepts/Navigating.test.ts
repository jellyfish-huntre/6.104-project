import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { AlreadyPresent, InvalidMove, NavigatingConcept, NotPresent } from "./Navigating.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`navigating_test_${crypto.randomUUID().replaceAll("-", "")}`);
const navigating = new NavigatingConcept(db);
beforeAll(() => client.connect());
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("tracks a person and permits only adjacent in-bounds moves", async () => {
  await navigating.enter({ person: "visitor", space: "fair", position: { x: 0, y: 0 } });
  await expect(navigating.enter({ person: "visitor", space: "fair", position: { x: 0, y: 0 } }))
    .rejects.toBeInstanceOf(AlreadyPresent);
  await expect(navigating.move({ person: "visitor", destination: { x: 2, y: 0 } }))
    .rejects.toBeInstanceOf(InvalidMove);
  await expect(navigating.move({ person: "visitor", destination: { x: -1, y: 0 } }))
    .rejects.toBeInstanceOf(InvalidMove);
  await navigating.move({ person: "visitor", destination: { x: 1, y: 0 } });
  expect(await navigating._present({ space: "fair" })).toEqual([{ person: "visitor", position: { x: 1, y: 0 } }]);
  await navigating.leave({ person: "visitor" });
  await expect(navigating.move({ person: "visitor", destination: { x: 2, y: 0 } }))
    .rejects.toBeInstanceOf(NotPresent);
});

test("shares guest positions without exposing the guest token", async () => {
  const token = crypto.randomUUID();
  const otherToken = crypto.randomUUID();
  const entered = await navigating.enterGuest({ token, space: "guest-fair" });
  const other = await navigating.enterGuest({ token: otherToken, space: "guest-fair" });
  expect(entered.position).toEqual({ x: 0, y: 0 });
  expect(entered.person).not.toBe(other.person);
  expect(entered.person).not.toContain(token);
  await expect(navigating.moveGuest({ token, destination: { x: 2, y: 0 } }))
    .rejects.toBeInstanceOf(InvalidMove);
  await navigating.moveGuest({ token, destination: { x: 1, y: 0 } });
  expect(await navigating._guestLocation({ token }))
    .toEqual([{ person: entered.person, space: "guest-fair", position: { x: 1, y: 0 } }]);
  expect(await navigating._present({ space: "guest-fair" })).toEqual(expect.arrayContaining([
    { person: entered.person, position: { x: 1, y: 0 } },
    { person: other.person, position: { x: 0, y: 0 } },
  ]));
  expect(JSON.stringify(await navigating._present({ space: "guest-fair" }))).not.toContain(token);
  expect((await navigating.enterGuest({ token, space: "guest-fair" })).position).toEqual({ x: 1, y: 0 });
  await navigating.leaveGuest({ token });
  expect(await navigating._guestInSpace({ token, space: "guest-fair" })).toEqual({ present: false });
  await expect(navigating.moveGuest({ token, destination: { x: 2, y: 0 } }))
    .rejects.toBeInstanceOf(NotPresent);
});
