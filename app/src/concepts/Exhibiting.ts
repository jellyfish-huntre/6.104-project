import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidBoothName extends Error {}
export class InvalidFootprint extends Error {}
export class AreaOccupied extends Error {}
export class NoSuchBooth extends Error {}
export class AlreadyAssigned extends Error {}
export class NotAssigned extends Error {}
export class InvalidMeetingUrl extends Error {}

export interface Position { x: number; y: number }
export interface Footprint extends Position { width: number; height: number }

interface Booth {
  _id: string;
  organizer: string;
  space: string;
  footprint: Footprint;
  name: string;
  description: string;
  meetingUrl?: string;
  cells: string[];
}

interface Assignment {
  _id: string;
  booth: string;
  representative: string;
}

const cell = (x: number, y: number) => `${x},${y}`;

function cellsOf({ x, y, width, height }: Footprint) {
  const cells: string[] = [];
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) cells.push(cell(column, row));
  }
  return cells;
}

function validFootprint(value: Footprint) {
  return value && [value.x, value.y, value.width, value.height].every(Number.isSafeInteger)
    && value.width > 0 && value.height > 0;
}

function validMeetingUrl(value: string) {
  if (typeof value !== "string") return false;
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname;
  } catch { return false; }
}

const boothRow = (row: Booth) => ({
  booth: row._id,
  organizer: row.organizer,
  space: row.space,
  footprint: row.footprint,
  name: row.name,
  description: row.description,
  meetingLinkSaved: !!row.meetingUrl,
});

export class ExhibitingConcept {
  private readonly booths: Collection<Booth>;
  private readonly assignments: Collection<Assignment>;

  constructor(db: Db) {
    this.booths = db.collection<Booth>("exhibiting.booths");
    this.assignments = db.collection<Assignment>("exhibiting.assignments");
  }

  async create({ organizer, space, footprint, name, description, meetingUrl }: {
    organizer: string; space: string; footprint: Footprint; name: string; description: string;
    meetingUrl: string;
  }) {
    if (!name.trim()) throw new InvalidBoothName("That booth name is not valid.");
    if (!validMeetingUrl(meetingUrl)) throw new InvalidMeetingUrl("Enter a valid meeting link.");
    if (!validFootprint(footprint)) throw new InvalidFootprint("That booth area is not valid.");
    await this.booths.createIndex({ space: 1, cells: 1 }, { unique: true });
    await this.assignments.createIndex({ booth: 1, representative: 1 }, { unique: true });
    const booth = crypto.randomUUID();
    try {
      await this.booths.insertOne({
        _id: booth, organizer, space, footprint, name, description,
        meetingUrl: meetingUrl.trim(),
        cells: cellsOf(footprint),
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AreaOccupied("That booth area overlaps another booth.");
      }
      throw error;
    }
    try {
      await this.assignments.insertOne({ _id: crypto.randomUUID(), booth, representative: organizer });
    } catch (error) {
      await this.booths.deleteOne({ _id: booth });
      throw error;
    }
    return { booth };
  }

  async edit({ organizer, booth, name, description }: {
    organizer: string; booth: string; name: string; description: string;
  }) {
    if (!name.trim()) throw new InvalidBoothName("That booth name is not valid.");
    const result = await this.booths.updateOne(
      { _id: booth, organizer }, { $set: { name, description } },
    );
    if (result.matchedCount === 0) throw new NoSuchBooth("That booth is not found.");
    return {};
  }

  async addRepresentative({ organizer, booth, representative }: {
    organizer: string; booth: string; representative: string;
  }) {
    await this.#ownedBooth(organizer, booth);
    await this.assignments.createIndex({ booth: 1, representative: 1 }, { unique: true });
    try {
      await this.assignments.insertOne({ _id: crypto.randomUUID(), booth, representative });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyAssigned("That person already represents this booth.");
      }
      throw error;
    }
    return {};
  }

  async removeRepresentative({ organizer, booth, representative }: {
    organizer: string; booth: string; representative: string;
  }) {
    await this.#ownedBooth(organizer, booth);
    const result = await this.assignments.deleteOne({ booth, representative });
    if (result.deletedCount === 0) throw new NotAssigned("That person does not represent this booth.");
    return {};
  }

  async setMeetingLink({ organizer, booth, meetingUrl }: {
    organizer: string; booth: string; meetingUrl: string;
  }) {
    if (!validMeetingUrl(meetingUrl)) throw new InvalidMeetingUrl("Enter a valid meeting link.");
    const result = await this.booths.updateOne(
      { _id: booth, organizer }, { $set: { meetingUrl: meetingUrl.trim() } },
    );
    if (!result.matchedCount) throw new NoSuchBooth("That booth is not found.");
    return {};
  }

  async meetingLink({ person, booth }: { person: string; booth: string }) {
    const row = await this.booths.findOne({ _id: booth });
    if (!row?.meetingUrl || (row.organizer !== person &&
        !(await this.assignments.findOne({ booth, representative: person })))) {
      throw new NoSuchBooth("That meeting link is not found.");
    }
    return { joinUrl: row.meetingUrl };
  }

  async _get({ booth }: { booth: string }) {
    const row = await this.booths.findOne({ _id: booth });
    return row ? [boothRow(row)] : [];
  }

  async _in({ space }: { space: string }) {
    const rows = await this.booths.find({ space }).toArray();
    return rows.sort((a, b) => a.footprint.y - b.footprint.y || a.footprint.x - b.footprint.x)
      .map(boothRow);
  }

  async _at({ space, position }: { space: string; position: Position }) {
    const row = await this.booths.findOne({ space, cells: cell(position.x, position.y) });
    return row ? [{ booth: row._id }] : [];
  }

  async _representatives({ booth }: { booth: string }) {
    const rows = await this.assignments.find({ booth }).sort({ representative: 1 }).toArray();
    return rows.map(({ representative }) => ({ representative }));
  }

  async _isRepresentative({ booth, representative }: { booth: string; representative: string }) {
    return {
      assigned: (await this.assignments.countDocuments({ booth, representative }, { limit: 1 })) > 0,
    };
  }

  async _contains({ booth, position }: { booth: string; position: Position }) {
    return { contains: !!(await this.booths.findOne({ _id: booth, cells: cell(position.x, position.y) })) };
  }

  async _exists({ booth }: { booth: string }) {
    return { exists: !!(await this.booths.findOne({ _id: booth })) };
  }

  async _inSpace({ booth, space }: { booth: string; space: string }) {
    return { inSpace: !!(await this.booths.findOne({ _id: booth, space })) };
  }

  async #ownedBooth(organizer: string, booth: string) {
    if (!(await this.booths.findOne({ _id: booth, organizer }))) {
      throw new NoSuchBooth("That booth is not found.");
    }
  }
}

export async function migrateLegacyBoothRepresentatives(db: Db) {
  const migrations = db.collection<{ _id: string }>("app.migrations");
  const migration = "booth-organizer-representatives-v1";
  if (await migrations.findOne({ _id: migration })) return;
  const booths = db.collection<Booth>("exhibiting.booths");
  const assignments = db.collection<Assignment>("exhibiting.assignments");
  await assignments.createIndex({ booth: 1, representative: 1 }, { unique: true });
  for await (const booth of booths.find({})) {
    await assignments.updateOne(
      { booth: booth._id, representative: booth.organizer },
      { $setOnInsert: { _id: crypto.randomUUID(), booth: booth._id, representative: booth.organizer } },
      { upsert: true },
    );
  }
  await migrations.updateOne({ _id: migration }, { $setOnInsert: { _id: migration } }, { upsert: true });
}
