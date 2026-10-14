import { type Collection, type Db } from "mongodb";

export class InvalidFairName extends Error {}
export class NoSuchFair extends Error {}

interface Fair {
  _id: string;
  name: string;
  organizer: string;
}

export class HostingConcept {
  private readonly fairs: Collection<Fair>;

  constructor(db: Db) {
    this.fairs = db.collection<Fair>("hosting.fairs");
  }

  async create({ organizer, name }: { organizer: string; name: string }) {
    if (!name.trim()) {
      throw new InvalidFairName("That name is not valid.");
    }
    const fair = crypto.randomUUID();
    await this.fairs.insertOne({ _id: fair, name, organizer });
    return { fair };
  }

  async edit({
    organizer,
    fair,
    name,
  }: {
    organizer: string;
    fair: string;
    name: string;
  }) {
    if (!name.trim()) {
      throw new InvalidFairName("That name is not valid.");
    }
    const result = await this.fairs.updateOne(
      { _id: fair, organizer },
      { $set: { name } },
    );
    if (result.matchedCount === 0) {
      throw new NoSuchFair("That fair is not found.");
    }
    return {};
  }

  async _get({ fair }: { fair: string }) {
    const row = await this.fairs.findOne({ _id: fair });
    return row
      ? [{ fair: row._id, name: row.name, organizer: row.organizer }]
      : [];
  }

  async _exists({ fair }: { fair: string }) {
    return { exists: (await this.fairs.countDocuments({ _id: fair }, { limit: 1 })) > 0 };
  }
}
