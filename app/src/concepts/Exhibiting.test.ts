import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { boothLayout } from "../map-geometry.ts";
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
  expect(await exhibiting._at({ space: "fair-a", position: { x: 2.3, y: 3.2 } }))
    .toEqual([{ booth }]);
  expect(await exhibiting._contains({ booth, position: { x: 1.4, y: 3.2 } }))
    .toEqual({ contains: false });
  const solidFurniture = boothLayout({ booth, x: 2, y: 3, width: 3, height: 2 }).furnishings
    .find(({ kind }) => kind === "table" || kind === "piano")!;
  const furnitureX = 1.5 + solidFurniture.x + solidFurniture.width / 2;
  const furnitureTop = 2.5 + solidFurniture.y;
  expect(await exhibiting._walkable({ space: "fair-a", from: { x: furnitureX, y: furnitureTop - 0.25 },
    to: { x: furnitureX, y: furnitureTop + solidFurniture.height / 2 } }))
    .toEqual({ walkable: false });
  expect(await exhibiting._walkable({ space: "empty-fair", from: { x: 3, y: 2.5 }, to: { x: 3, y: 3 } }))
    .toEqual({ walkable: false });
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

test("places sized booths automatically and lets only their organizer move them", async () => {
  const first = await exhibiting.createSized({
    organizer: "owner", space: "sized-fair", size: "small",
    name: "Small", description: "", meetingUrl: "",
  });
  const second = await exhibiting.createSized({
    organizer: "owner", space: "sized-fair", size: "large",
    name: "Large", description: "", meetingUrl: "",
  });
  expect((await exhibiting._get({ booth: first.booth }))[0]?.footprint)
    .toEqual({ x: 7, y: 1, width: 2, height: 2 });
  const secondFootprint = (await exhibiting._get({ booth: second.booth }))[0]!.footprint;
  expect(secondFootprint.width).toBe(4);
  expect(secondFootprint.height).toBe(3);
  expect(secondFootprint.x + secondFootprint.width <= 6 || secondFootprint.y >= 4).toBe(true);
  await expect(exhibiting.move({ organizer: "visitor", booth: first.booth, position: { x: 8, y: 8 } }))
    .rejects.toBeInstanceOf(NoSuchBooth);
  await expect(exhibiting.move({ organizer: "owner", booth: first.booth, position: secondFootprint }))
    .rejects.toBeInstanceOf(AreaOccupied);
  await expect(exhibiting.move({ organizer: "owner", booth: second.booth, position: { x: 8, y: 8 } }))
    .rejects.toBeInstanceOf(InvalidFootprint);
  await exhibiting.move({ organizer: "owner", booth: first.booth, position: { x: 7, y: 7 } });
  expect((await exhibiting._get({ booth: first.booth }))[0]?.footprint)
    .toEqual({ x: 7, y: 7, width: 2, height: 2 });
  expect((await exhibiting._get({ booth: second.booth }))[0]?.footprint)
    .toEqual(secondFootprint);
});

test("expands a full hall and keeps its new bounds for placement and walking", async () => {
  const space = "expanding-fair";
  await exhibiting.create({ organizer: "owner", space,
    footprint: { x: 1, y: 0, width: 9, height: 10 },
    name: "East block", description: "", meetingUrl: "" });
  await exhibiting.create({ organizer: "owner", space,
    footprint: { x: 0, y: 1, width: 1, height: 9 },
    name: "West block", description: "", meetingUrl: "" });
  expect(await exhibiting._extent({ space })).toEqual({ width: 10, height: 10 });
  const { booth: added } = await exhibiting.createSized({ organizer: "owner", space,
    size: "small", name: "New wing", description: "", meetingUrl: "" });
  expect(await exhibiting._extent({ space })).toEqual({ width: 14, height: 14 });
  const footprint = (await exhibiting._get({ booth: added }))[0]!.footprint;
  expect(footprint.x >= 10 || footprint.y >= 10).toBe(true);
  expect(await exhibiting._walkable({ space,
    from: { x: 10.1, y: 0.5 }, to: { x: 10.5, y: 0.5 } }))
    .toEqual({ walkable: true });
  await expect(exhibiting.move({ organizer: "owner", booth: added,
    position: { x: 13, y: 13 } })).rejects.toBeInstanceOf(InvalidFootprint);
  expect(await new ExhibitingConcept(db)._extent({ space })).toEqual({ width: 14, height: 14 });
});

test("concurrent sized creation re-spaces the booth that loses the first slot", async () => {
  const created = await Promise.all(["One", "Two"].map((name) => exhibiting.createSized({
    organizer: "owner", space: "concurrent-sized-fair", size: "small", name,
    description: "", meetingUrl: "",
  })));
  const footprints = await Promise.all(created.map(async ({ booth }) =>
    (await exhibiting._get({ booth }))[0]!.footprint));
  expect(footprints).toContainEqual({ x: 7, y: 1, width: 2, height: 2 });
  expect(footprints).toContainEqual({ x: 1, y: 3, width: 2, height: 2 });
});

test("only the organizer can delete a booth, clearing assignments and freeing its cells", async () => {
  const { booth: target } = await exhibiting.createSized({
    organizer: "owner", space: "delete-fair", size: "small", name: "Temporary",
    description: "", meetingUrl: "https://meet.example/temporary",
  });
  await exhibiting.addRepresentative({ organizer: "owner", booth: target, representative: "rep" });
  await expect(exhibiting.remove({ organizer: "visitor", booth: target }))
    .rejects.toBeInstanceOf(NoSuchBooth);
  expect(await exhibiting._get({ booth: target })).toHaveLength(1);
  await exhibiting.remove({ organizer: "owner", booth: target });
  expect(await exhibiting._get({ booth: target })).toEqual([]);
  expect(await exhibiting._representatives({ booth: target })).toEqual([]);
  await expect(exhibiting.remove({ organizer: "owner", booth: target }))
    .rejects.toBeInstanceOf(NoSuchBooth);
  const replacement = await exhibiting.createSized({
    organizer: "owner", space: "delete-fair", size: "small", name: "Replacement",
    description: "", meetingUrl: "",
  });
  expect((await exhibiting._get({ booth: replacement.booth }))[0]?.footprint)
    .toEqual({ x: 7, y: 1, width: 2, height: 2 });
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
