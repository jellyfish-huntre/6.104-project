import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
  ExhibitingConcept, AreaOccupied, InvalidFootprint, NoSuchBooth,
  AlreadyAssigned, NotAssigned, InvalidMeetingUrl, migrateLegacyBoothRepresentatives,
} from "./Exhibiting.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`exhibiting_test_${crypto.randomUUID().replaceAll("-", "")}`);
const exhibiting = new ExhibitingConcept(db);
let booth: string;

beforeAll(async () => {
  await client.connect();
  ({ booth } = await exhibiting.create({
    organizer: "organizer", space: "fair-a",
    footprint: { x: 2, y: 3, width: 3, height: 2 },
    name: "Robotics", description: "Build robots", meetingUrl: "",
  }));
});
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("creates a multi-cell booth and finds it by position", async () => {
  expect(await exhibiting._at({ space: "fair-a", position: { x: 4, y: 4 } }))
    .toEqual([{ booth }]);
  expect(await exhibiting._at({ space: "fair-a", position: { x: 5, y: 4 } }))
    .toEqual([]);
  expect(await exhibiting._in({ space: "fair-a" })).toHaveLength(1);
  expect(await exhibiting._isRepresentative({ booth, representative: "organizer" }))
    .toEqual({ assigned: true });
});

test("refuses overlapping or malformed areas but allows another fair", async () => {
  await expect(exhibiting.create({
    organizer: "organizer", space: "fair-a",
    footprint: { x: 4, y: 4, width: 2, height: 2 },
    name: "Overlap", description: "", meetingUrl: "",
  })).rejects.toBeInstanceOf(AreaOccupied);
  await expect(exhibiting.create({
    organizer: "organizer", space: "fair-a",
    footprint: { x: 7, y: 7, width: 0, height: 2 },
    name: "Invalid", description: "", meetingUrl: "",
  })).rejects.toBeInstanceOf(InvalidFootprint);
  await exhibiting.create({
    organizer: "other", space: "fair-b",
    footprint: { x: 2, y: 3, width: 3, height: 2 },
    name: "Separate fair", description: "", meetingUrl: "",
  });
});

test("only the recorded organizer can edit or assign representatives", async () => {
  await expect(exhibiting.edit({
    organizer: "other", booth, name: "Stolen", description: "",
  })).rejects.toBeInstanceOf(NoSuchBooth);
  await expect(exhibiting.addRepresentative({
    organizer: "other", booth, representative: "rep",
  })).rejects.toBeInstanceOf(NoSuchBooth);
  await exhibiting.edit({ organizer: "organizer", booth, name: "Robotics Club", description: "Meet us" });
  expect((await exhibiting._get({ booth }))[0]?.name).toBe("Robotics Club");
});

test("adds and removes a representative once", async () => {
  await exhibiting.addRepresentative({ organizer: "organizer", booth, representative: "rep" });
  expect(await exhibiting._isRepresentative({ booth, representative: "rep" }))
    .toEqual({ assigned: true });
  await expect(exhibiting.addRepresentative({ organizer: "organizer", booth, representative: "rep" }))
    .rejects.toBeInstanceOf(AlreadyAssigned);
  await exhibiting.removeRepresentative({ organizer: "organizer", booth, representative: "rep" });
  expect(await exhibiting._representatives({ booth })).toEqual([{ representative: "organizer" }]);
  await expect(exhibiting.removeRepresentative({ organizer: "organizer", booth, representative: "rep" }))
    .rejects.toBeInstanceOf(NotAssigned);
});

test("saves a meeting link for the organizer and assigned representative only", async () => {
  await expect(exhibiting.setMeetingLink({ organizer: "organizer", booth, meetingUrl: "javascript:alert(1)" }))
    .rejects.toBeInstanceOf(InvalidMeetingUrl);
  await expect(exhibiting.setMeetingLink({ organizer: "other", booth, meetingUrl: "https://meet.example/a" }))
    .rejects.toBeInstanceOf(NoSuchBooth);
  await exhibiting.setMeetingLink({ organizer: "organizer", booth, meetingUrl: " https://meet.example/a " });
  expect((await exhibiting._get({ booth }))[0]?.meetingLinkSaved).toBe(true);
  expect(JSON.stringify(await exhibiting._in({ space: "fair-a" }))).not.toContain("meet.example");
  expect(await exhibiting.meetingLink({ person: "organizer", booth })).toEqual({ joinUrl: "https://meet.example/a" });
  await expect(exhibiting.meetingLink({ person: "visitor", booth })).rejects.toBeInstanceOf(NoSuchBooth);
  await exhibiting.addRepresentative({ organizer: "organizer", booth, representative: "rep2" });
  expect(await exhibiting.meetingLink({ person: "rep2", booth })).toEqual({ joinUrl: "https://meet.example/a" });
  await exhibiting.setMeetingLink({ organizer: "organizer", booth, meetingUrl: "" });
  expect((await exhibiting._get({ booth }))[0]?.meetingLinkSaved).toBe(false);
  await expect(exhibiting.meetingLink({ person: "rep2", booth })).rejects.toBeInstanceOf(NoSuchBooth);
});

test("adds organizers to older booths once without restoring a removed assignment", async () => {
  const legacy = crypto.randomUUID();
  await db.collection<{ _id: string; organizer: string; space: string; footprint: {
    x: number; y: number; width: number; height: number;
  }; name: string; description: string; cells: string[] }>("exhibiting.booths").insertOne({
    _id: legacy, organizer: "legacy-owner", space: "old-fair",
    footprint: { x: 1, y: 1, width: 1, height: 1 },
    name: "Older booth", description: "", cells: ["1,1"],
  });
  await migrateLegacyBoothRepresentatives(db);
  expect(await exhibiting._isRepresentative({ booth: legacy, representative: "legacy-owner" }))
    .toEqual({ assigned: true });
  await exhibiting.removeRepresentative({ organizer: "legacy-owner", booth: legacy, representative: "legacy-owner" });
  await migrateLegacyBoothRepresentatives(db);
  expect(await exhibiting._isRepresentative({ booth: legacy, representative: "legacy-owner" }))
    .toEqual({ assigned: false });
});
