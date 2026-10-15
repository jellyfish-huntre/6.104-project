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
