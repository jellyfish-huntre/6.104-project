import { MongoServerError, type Collection, type Db } from "mongodb";

export class AlreadyPresent extends Error {}
export class NotPresent extends Error {}
export class InvalidMove extends Error {}

export interface Position { x: number; y: number }
interface Presence { _id: string; space: string; position: Position }

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
    if (!Number.isSafeInteger(destination?.x) || !Number.isSafeInteger(destination?.y) ||
        destination.x < 0 || destination.x > 9 || destination.y < 0 || destination.y > 9 ||
        Math.abs(destination.x - current.position.x) + Math.abs(destination.y - current.position.y) !== 1) {
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

  async _location({ person }: { person: string }) {
    const row = await this.presences.findOne({ _id: person });
    return row ? [{ person, space: row.space, position: row.position }] : [];
  }

  async _present({ space }: { space: string }) {
    return (await this.presences.find({ space }).toArray())
      .map((row) => ({ person: row._id, position: row.position }));
  }

  async _inSpace({ person, space }: { person: string; space: string }) {
    return { present: !!(await this.presences.findOne({ _id: person, space })) };
  }
}
