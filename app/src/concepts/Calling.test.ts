import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { CallingConcept, HostBusy, InvalidCallUrl, InvalidMode, LinkNotRotated, NoSuchCall, PlaceBusy } from "./Calling.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`calling_test_${crypto.randomUUID().replaceAll("-", "")}`);
const calls = new CallingConcept(db);
beforeAll(() => client.connect());
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("opens one call per booth and host, shares its URL only through join, and closes it", async () => {
  await expect(calls.open({ host: "rep", place: "booth", joinUrl: "javascript:alert(1)", mode: "OPEN_GROUP" }))
    .rejects.toBeInstanceOf(InvalidCallUrl);
  const { call } = await calls.open({ host: "rep", place: "booth", joinUrl: "https://meet.example/abc", mode: "OPEN_GROUP" });
  expect(await calls._openAt({ place: "booth" })).toEqual([{ call, place: "booth", host: "rep", mode: "OPEN_GROUP" }]);
  expect(await calls.join({ person: "student", call })).toEqual({ joinUrl: "https://meet.example/abc" });
  await expect(calls.open({ host: "other", place: "booth", joinUrl: "https://meet.example/other", mode: "OPEN_GROUP" }))
    .rejects.toBeInstanceOf(PlaceBusy);
  await expect(calls.open({ host: "rep", place: "other", joinUrl: "https://meet.example/other", mode: "OPEN_GROUP" }))
    .rejects.toBeInstanceOf(HostBusy);
  await expect(calls.close({ host: "student", call })).rejects.toBeInstanceOf(NoSuchCall);
  expect(await calls.close({ host: "rep", call })).toEqual({ place: "booth", mode: "OPEN_GROUP" });
  await expect(calls.join({ person: "student", call })).rejects.toBeInstanceOf(NoSuchCall);
});

test("changes one booth call to invite-only with a fresh link", async () => {
  const { call } = await calls.open({ host: "host-two", place: "booth-two", joinUrl: "https://meet.example/group", mode: "OPEN_GROUP" });
  await expect(calls.changeMode({ host: "host-two", call, mode: "INVITE_ONLY", joinUrl: "https://meet.example/group" }))
    .rejects.toBeInstanceOf(LinkNotRotated);
  await expect(calls.changeMode({ host: "host-two", call, mode: "INVITE_ONLY", joinUrl: "javascript:alert(1)" }))
    .rejects.toBeInstanceOf(InvalidCallUrl);
  await expect(calls.changeMode({ host: "host-two", call, mode: "BAD_MODE" as "OPEN_GROUP", joinUrl: "https://meet.example/new" }))
    .rejects.toBeInstanceOf(InvalidMode);
  expect(await calls._openAt({ place: "booth-two" })).toEqual([
    { call, place: "booth-two", host: "host-two", mode: "OPEN_GROUP" },
  ]);
  await calls.changeMode({ host: "host-two", call, mode: "INVITE_ONLY", joinUrl: "https://meet.example/invited" });
  expect(await calls._openAt({ place: "booth-two" })).toEqual([
    { call, place: "booth-two", host: "host-two", mode: "INVITE_ONLY" },
  ]);
  expect(await calls.join({ person: "student", call })).toEqual({ joinUrl: "https://meet.example/invited" });
  await expect(calls.changeMode({ host: "other", call, mode: "OPEN_GROUP", joinUrl: "https://meet.example/open" }))
    .rejects.toBeInstanceOf(NoSuchCall);
  expect(await calls.join({ person: "student", call })).toEqual({ joinUrl: "https://meet.example/invited" });
  await calls.changeMode({ host: "host-two", call, mode: "OPEN_GROUP", joinUrl: "https://meet.example/open" });
  expect(await calls._openAt({ place: "booth-two" })).toEqual([
    { call, place: "booth-two", host: "host-two", mode: "OPEN_GROUP" },
  ]);
  expect(await calls.join({ person: "student", call })).toEqual({ joinUrl: "https://meet.example/open" });
  await calls.close({ host: "host-two", call });
});

test("retains an invite-only link when the host leaves and resumes it for an assigned host", async () => {
  const { call } = await calls.open({
    host: "departing-rep", place: "resume-booth", joinUrl: "https://meet.example/still-here", mode: "INVITE_ONLY",
  });
  await expect(calls.suspend({ host: "other-rep", call })).rejects.toBeInstanceOf(NoSuchCall);
  expect(await calls._openAt({ place: "resume-booth" })).toEqual([
    { call, place: "resume-booth", host: "departing-rep", mode: "INVITE_ONLY" },
  ]);
  expect(await calls.suspend({ host: "departing-rep", call })).toEqual({ place: "resume-booth" });
  expect(await calls._openAt({ place: "resume-booth" })).toEqual([]);
  expect(await calls._suspendedAt({ place: "resume-booth" })).toEqual({ suspended: true });
  await expect(calls.join({ person: "visitor", call })).rejects.toBeInstanceOf(NoSuchCall);
  const resumed = await calls.resume({ host: "returning-rep", place: "resume-booth" });
  expect(await calls.join({ person: "visitor", call: resumed.call })).toEqual({ joinUrl: "https://meet.example/still-here" });
  expect(await calls._suspendedAt({ place: "resume-booth" })).toEqual({ suspended: false });
  await calls.close({ host: "returning-rep", call: resumed.call });
  await expect(calls.resume({ host: "returning-rep", place: "resume-booth" })).rejects.toBeInstanceOf(NoSuchCall);
});

test("does not replace a suspended call when another host is busy", async () => {
  const suspended = await calls.open({
    host: "original-host", place: "suspended-booth", joinUrl: "https://meet.example/suspended", mode: "INVITE_ONLY",
  });
  await calls.suspend({ host: "original-host", call: suspended.call });
  const busy = await calls.open({
    host: "busy-host", place: "another-booth", joinUrl: "https://meet.example/another", mode: "OPEN_GROUP",
  });
  await expect(calls.resume({ host: "busy-host", place: "suspended-booth" })).rejects.toBeInstanceOf(HostBusy);
  expect(await calls._suspendedAt({ place: "suspended-booth" })).toEqual({ suspended: true });
  expect(await calls._openAt({ place: "suspended-booth" })).toEqual([]);
  await calls.close({ host: "busy-host", call: busy.call });
  const resumed = await calls.resume({ host: "busy-host", place: "suspended-booth" });
  expect(await calls.join({ person: "visitor", call: resumed.call })).toEqual({ joinUrl: "https://meet.example/suspended" });
});
