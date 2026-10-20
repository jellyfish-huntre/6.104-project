import { afterAll, beforeAll, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
  AuthenticatingConcept, InvalidCredentials, InvalidUsername,
  NoSuchAccount, UsernameTaken, WeakPassword,
} from "./Authenticating.ts";

const url = process.env.MONGODB_URL;
if (!url) throw new Error("MONGODB_URL is not set.");
const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
const db = client.db(`auth_test_${crypto.randomUUID().replaceAll("-", "")}`);
const auth = new AuthenticatingConcept(db);

beforeAll(async () => { await client.connect(); });
afterAll(async () => { await db.dropDatabase(); await client.close(); });

test("registers and authenticates a persistent account", async () => {
  expect(await auth.register({ username: "organizer", password: "example-pass-123" }))
    .toEqual({ account: "organizer" });
  const reloaded = new AuthenticatingConcept(db);
  expect(await reloaded.authenticate({ username: "organizer", password: "example-pass-123" }))
    .toEqual({ account: "organizer" });
  expect(await reloaded._registered({ username: "organizer" })).toEqual({ registered: true });
  expect(await reloaded.verifyRegistered({ username: "organizer" })).toEqual({});
});

test("rejects duplicate names and incorrect credentials", async () => {
  await expect(auth.register({ username: "organizer", password: "example-pass-123" }))
    .rejects.toBeInstanceOf(UsernameTaken);
  await expect(auth.authenticate({ username: "organizer", password: "wrong-pass-123" }))
    .rejects.toBeInstanceOf(InvalidCredentials);
  await expect(auth.authenticate({ username: "missing", password: "wrong-pass-123" }))
    .rejects.toBeInstanceOf(InvalidCredentials);
});

test("validates new credentials", async () => {
  await expect(auth.register({ username: "x", password: "example-pass-123" }))
    .rejects.toBeInstanceOf(InvalidUsername);
  await expect(auth.register({ username: "another", password: "short" }))
    .rejects.toBeInstanceOf(WeakPassword);
  expect(await auth._registered({ username: "another" })).toEqual({ registered: false });
});

test("refuses to verify an account that was not registered", async () => {
  await expect(auth.verifyRegistered({ username: "missing" })).rejects.toBeInstanceOf(NoSuchAccount);
  expect(await auth._registered({ username: "missing" })).toEqual({ registered: false });
});
