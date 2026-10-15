import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidFairName extends Error {}
export class NoSuchFair extends Error {}

interface Fair {
  _id: string;
  name: string;
  organizer: string;
  code?: string;
  listed?: boolean;
}

const newCode = () => crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

export class HostingConcept {
  private readonly fairs: Collection<Fair>;

  constructor(db: Db) {
    this.fairs = db.collection<Fair>("hosting.fairs");
  }

  async #codeIndex() {
    await this.fairs.createIndex(
      { code: 1 },
      { unique: true, partialFilterExpression: { code: { $type: "string" } } },
    );
  }

  async #assignCode(fair: string) {
    await this.#codeIndex();
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = newCode();
      try {
        const result = await this.fairs.updateOne(
          { _id: fair, code: { $exists: false } },
          { $set: { code } },
        );
        if (result.modifiedCount === 1) return code;
        const existing = await this.fairs.findOne({ _id: fair });
        if (!existing) throw new NoSuchFair("That fair is not found.");
        if (existing.code) return existing.code;
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
      }
    }
    throw new Error("Could not assign a unique fair code.");
  }

  async create({ organizer, name }: { organizer: string; name: string }) {
    if (!name.trim()) {
      throw new InvalidFairName("That name is not valid.");
    }
    await this.#codeIndex();
    for (let attempt = 0; attempt < 20; attempt++) {
      const fair = crypto.randomUUID();
      const code = newCode();
      try {
        await this.fairs.insertOne({ _id: fair, name, organizer, code, listed: false });
        return { fair, code };
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
      }
    }
    throw new Error("Could not assign a unique fair code.");
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

  async verifyOwner({ organizer, fair }: { organizer: string; fair: string }) {
    const owns = await this._owns({ fair, organizer });
    if (!owns.owns) throw new NoSuchFair("That fair is not found.");
    return {};
  }

  async setListed({ organizer, fair, listed }: { organizer: string; fair: string; listed: boolean }) {
    const result = await this.fairs.updateOne({ _id: fair, organizer }, { $set: { listed } });
    if (result.matchedCount === 0) throw new NoSuchFair("That fair is not found.");
    return {};
  }

  async _get({ fair }: { fair: string }) {
    const row = await this.fairs.findOne({ _id: fair });
    return row
      ? [{ fair: row._id, name: row.name, organizer: row.organizer,
        code: row.code ?? await this.#assignCode(row._id), listed: row.listed === true }]
      : [];
  }

  async _public(_input: Record<string, never> = {}) {
    const rows = await this.fairs.find({ listed: true })
      .project<Pick<Fair, "_id" | "name" | "organizer">>({ _id: 1, name: 1, organizer: 1 })
      .sort({ name: 1, _id: 1 }).toArray();
    return rows.map((row) => ({ fair: row._id, name: row.name, organizer: row.organizer }));
  }

  async _exists({ fair }: { fair: string }) {
    return { exists: (await this.fairs.countDocuments({ _id: fair }, { limit: 1 })) > 0 };
  }

  async _owns({ fair, organizer }: { fair: string; organizer: string }) {
    return {
      owns: (await this.fairs.countDocuments({ _id: fair, organizer }, { limit: 1 })) > 0,
    };
  }

  async _byCode({ code }: { code: string }) {
    const row = await this.fairs.findOne({ code: code.toUpperCase() });
    return row ? [{ fair: row._id }] : [];
  }

  async _codeExists({ code }: { code: string }) {
    return { exists: (await this.fairs.countDocuments({ code: code.toUpperCase() }, { limit: 1 })) > 0 };
  }
}

export async function migrateLegacyFairCodes(db: Db) {
  const fairs = db.collection<Fair>("hosting.fairs");
  const hosting = new HostingConcept(db);
  for await (const row of fairs.find({ code: { $exists: false } })) {
    await hosting._get({ fair: row._id });
  }
}
