import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { AlreadyReserved, NoSuchReservation, ReservingConcept } from "./Reserving.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`reserving_test_${crypto.randomUUID().replaceAll("-", "")}`);
const reserving = new ReservingConcept(db);

beforeAll(() => client.connect());
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("reserves a resource for one person and releases it on cancellation", async () => {
  const { reservation } = await reserving.reserve({ user: "ada", resource: "table-one" });
  expect(await reserving._all({})).toEqual([{ reservation, user: "ada", resource: "table-one" }]);
  expect(await reserving.cancel({ reservation })).toEqual({ reservation });
  expect(await reserving._all({})).toEqual([]);
  await expect(reserving.cancel({ reservation })).rejects.toBeInstanceOf(NoSuchReservation);
  expect(await reserving.reserve({ user: "bea", resource: "table-one" })).toHaveProperty("reservation");
});

test("a refused duplicate reservation leaves the original owner unchanged", async () => {
  const { reservation } = await reserving.reserve({ user: "ada", resource: "table-two" });
  await expect(reserving.reserve({ user: "bea", resource: "table-two" })).rejects.toBeInstanceOf(AlreadyReserved);
  expect(await reserving._all({})).toContainEqual({ reservation, user: "ada", resource: "table-two" });
  await expect(reserving.cancel({ reservation: "missing" })).rejects.toBeInstanceOf(NoSuchReservation);
  expect(await reserving._all({})).toContainEqual({ reservation, user: "ada", resource: "table-two" });
});
