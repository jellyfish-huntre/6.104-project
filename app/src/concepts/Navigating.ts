import { createHash } from "node:crypto";
import { MongoServerError, type Collection, type Db } from "mongodb";

export class AlreadyPresent extends Error {}
export class NotPresent extends Error {}
export class InvalidMove extends Error {}
export class InvalidGuestToken extends Error {}

export interface Position { x: number; y: number }
interface Presence { _id: string; space: string; position: Position; guestSeenAt?: Date }

const guestLifetimeMs = 30_000;
const guestCutoff = () => new Date(Date.now() - guestLifetimeMs);
const entrance = () => ({ x: 0, y: 0 });

function guestPerson(token: string) {
  if (typeof token !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(token)) {
    throw new InvalidGuestToken("Use a valid guest token.");
  }
  return `guest:${createHash("sha256").update(token).digest("hex")}`;
}

function validStep(current: Position, destination: Position) {
  return Number.isSafeInteger(destination?.x) && Number.isSafeInteger(destination?.y) &&
    destination.x >= 0 && destination.x <= 9 && destination.y >= 0 && destination.y <= 9 &&
    Math.abs(destination.x - current.x) + Math.abs(destination.y - current.y) === 1;
}

export class NavigatingConcept {
  private readonly presences: Collection<Presence>;

  constructor(db: Db) {
    this.presences = db.collection<Presence>("navigating.presences");
  }

  async enter({ person, space, position }: { person: string; space: string; position: Position }) {
    try {
      await this.presences.insertOne({ _id: person, space, position });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyPresent("That person is already in a space.");
      }
      throw error;
    }
    return {};
  }

  async move({ person, destination }: { person: string; destination: Position }) {
    const current = await this.presences.findOne({ _id: person });
    if (!current) throw new NotPresent("That person is not in a space.");
    if (!validStep(current.position, destination)) {
      throw new InvalidMove("Move one cell within the fair.");
    }
    const result = await this.presences.updateOne(
      { _id: person, position: current.position }, { $set: { position: destination } },
    );
    if (result.matchedCount === 0) throw new InvalidMove("Move one cell within the fair.");
    return {};
  }

  async leave({ person }: { person: string }) {
    const result = await this.presences.deleteOne({ _id: person });
    if (!result.deletedCount) throw new NotPresent("That person is not in a space.");
    return {};
  }

  async enterGuest({ token, space }: { token: string; space: string }) {
    const person = guestPerson(token);
    await this.presences.createIndex({ guestSeenAt: 1 }, { expireAfterSeconds: 30 });
    const current = await this.presences.findOne({ _id: person });
    const position = current?.space === space && current.guestSeenAt && current.guestSeenAt >= guestCutoff()
      ? current.position : entrance();
    await this.presences.updateOne(
      { _id: person },
      { $set: { space, position, guestSeenAt: new Date() } },
      { upsert: true },
    );
    return { person, position };
  }

  async moveGuest({ token, destination }: { token: string; destination: Position }) {
    const person = guestPerson(token);
    const current = await this.presences.findOne({ _id: person, guestSeenAt: { $gte: guestCutoff() } });
    if (!current) throw new NotPresent("That guest is not in a fair.");
    if (!validStep(current.position, destination)) throw new InvalidMove("Move one cell within the fair.");
    const result = await this.presences.updateOne(
      { _id: person, position: current.position, guestSeenAt: { $gte: guestCutoff() } },
      { $set: { position: destination, guestSeenAt: new Date() } },
    );
    if (!result.matchedCount) throw new InvalidMove("Move one cell within the fair.");
    return { person, position: destination };
  }

  async leaveGuest({ token }: { token: string }) {
    const result = await this.presences.deleteOne({ _id: guestPerson(token) });
    if (!result.deletedCount) throw new NotPresent("That guest is not in a fair.");
    return {};
  }

  async _location({ person }: { person: string }) {
    const row = await this.presences.findOne({ _id: person });
    return row ? [{ person, space: row.space, position: row.position }] : [];
  }

  async _present({ space }: { space: string }) {
    return (await this.presences.find({
      space,
      $or: [{ guestSeenAt: { $exists: false } }, { guestSeenAt: { $gte: guestCutoff() } }],
    }).toArray())
      .map((row) => ({ person: row._id, position: row.position }));
  }

  async _inSpace({ person, space }: { person: string; space: string }) {
    return { present: !!(await this.presences.findOne({ _id: person, space })) };
  }

  async _guestLocation({ token }: { token: string }) {
    const person = guestPerson(token);
    const row = await this.presences.findOne({ _id: person, guestSeenAt: { $gte: guestCutoff() } });
    return row ? [{ person, space: row.space, position: row.position }] : [];
  }

  async _guestInSpace({ token, space }: { token: string; space: string }) {
    const person = guestPerson(token);
    return { present: !!(await this.presences.findOne({
      _id: person, space, guestSeenAt: { $gte: guestCutoff() },
    })) };
  }
}
