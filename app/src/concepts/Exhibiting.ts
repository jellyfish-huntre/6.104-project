import { MongoServerError, type Collection, type Db } from "mongodb";
import { boothContains, mapObstacles, plantCells, walkableSegment } from "../map-geometry.ts";

export class InvalidBoothName extends Error {}
export class InvalidFootprint extends Error {}
export class AreaOccupied extends Error {}
export class NoSuchBooth extends Error {}
export class AlreadyAssigned extends Error {}
export class NotAssigned extends Error {}
export class InvalidMeetingUrl extends Error {}

export interface Position { x: number; y: number }
export interface Footprint extends Position { width: number; height: number }

const boothSizes = {
  small: { width: 2, height: 2 },
  medium: { width: 3, height: 2 },
  large: { width: 4, height: 3 },
} as const;

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
interface HallExtent { _id: string; width: number; height: number }

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
  private readonly extents: Collection<HallExtent>;

  constructor(db: Db) {
    this.booths = db.collection<Booth>("exhibiting.booths");
    this.assignments = db.collection<Assignment>("exhibiting.assignments");
    this.extents = db.collection<HallExtent>("exhibiting.extents");
  }

  async create({ organizer, space, footprint, name, description, meetingUrl }: {
    organizer: string; space: string; footprint: Footprint; name: string; description: string;
    meetingUrl: string;
  }) {
    if (!name.trim()) throw new InvalidBoothName("That booth name is not valid.");
    if (!validMeetingUrl(meetingUrl)) throw new InvalidMeetingUrl("Enter a valid meeting link.");
    if (!validFootprint(footprint)) throw new InvalidFootprint("That booth area is not valid.");
    const extent = await this._extent({ space });
    if (footprint.x < 0 || footprint.y < 0 || footprint.x + footprint.width > extent.width ||
      footprint.y + footprint.height > extent.height ||
      (footprint.x === 0 && footprint.y === 0)) {
      throw new InvalidFootprint("That booth area is not valid.");
    }
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

  async createSized({ organizer, space, size, name, description, meetingUrl }: {
    organizer: string; space: string; size: string; name: string; description: string;
    meetingUrl: string;
  }): Promise<{ booth: string }> {
    const dimensions = boothSizes[size as keyof typeof boothSizes];
    if (!dimensions) throw new InvalidFootprint("Choose a small, medium, or large booth.");
    if (!name.trim()) throw new InvalidBoothName("That booth name is not valid.");
    if (!validMeetingUrl(meetingUrl)) throw new InvalidMeetingUrl("Enter a valid meeting link.");
    const existing = (await this.booths.find({ space }).toArray()).map(({ footprint }) => footprint);
    let extent = await this._extent({ space });
    let candidates: { footprint: Footprint; clearance: number; score: number }[] = [];
    while (true) {
      const anchors = [
        { x: extent.width - 1 - dimensions.width, y: 1 },
        { x: 1, y: 3 },
        { x: extent.width - 1 - dimensions.width, y: extent.height - 1 - dimensions.height },
        { x: 1, y: extent.height - 1 - dimensions.height },
      ];
      const anchor = anchors[existing.length % anchors.length]!;
      for (let y = 0; y <= extent.height - dimensions.height; y++) {
        for (let x = 0; x <= extent.width - dimensions.width; x++) {
          if (x === 0 && y === 0) continue;
          const footprint = { x, y, ...dimensions };
          const gaps = existing.map((other) => {
            const horizontal = Math.max(0, other.x - (x + dimensions.width), x - (other.x + other.width));
            const vertical = Math.max(0, other.y - (y + dimensions.height), y - (other.y + other.height));
            return { horizontal, vertical };
          });
          if (existing.some((other) => x < other.x + other.width && x + dimensions.width > other.x &&
            y < other.y + other.height && y + dimensions.height > other.y)) continue;
          const clearance = gaps.length ? Math.min(...gaps.map(({ horizontal, vertical }) =>
            Math.hypot(horizontal, vertical))) : 0;
          const edgePenalty = Number(x === 0 || x + dimensions.width === extent.width) +
            Number(y === 0 || y + dimensions.height === extent.height);
          const coveredPlants = plantCells.filter((plant) => plant.x >= x && plant.x < x + dimensions.width &&
            plant.y >= y && plant.y < y + dimensions.height).length;
          const anchorDistance = Math.hypot(x - anchor.x, y - anchor.y);
          candidates.push({ footprint, clearance,
            score: clearance * 2 - anchorDistance * 8 - edgePenalty * 2 - coveredPlants * 0.3 });
        }
      }
      const spaced = candidates.filter(({ clearance }) => !existing.length || clearance >= 1);
      if (spaced.length) {
        candidates = spaced;
        break;
      }
      candidates = [];
      const next = { width: extent.width + 4, height: extent.height + 4 };
      try {
        await this.extents.updateOne({ _id: space }, { $max: next }, { upsert: true });
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
        await this.extents.updateOne({ _id: space }, { $max: next });
      }
      extent = await this._extent({ space });
    }
    const ranked = candidates.sort((a, b) =>
      b.score - a.score || a.footprint.y - b.footprint.y || a.footprint.x - b.footprint.x);
    for (const { footprint } of ranked) {
      try {
        return await this.create({ organizer, space, footprint, name, description, meetingUrl });
      } catch (error) {
        if (!(error instanceof AreaOccupied)) throw error;
        // Another organizer claimed this cell after the ranking query. Re-rank
        // against their booth so concurrent creation still spreads out.
        return this.createSized({ organizer, space, size, name, description, meetingUrl });
      }
    }
    throw new AreaOccupied("Another booth claimed the remaining space. Try again.");
  }

  async move({ organizer, booth, position }: {
    organizer: string; booth: string; position: Position;
  }) {
    const existing = await this.booths.findOne({ _id: booth, organizer });
    if (!existing) throw new NoSuchBooth("That booth is not found.");
    const footprint = { ...existing.footprint, x: position.x, y: position.y };
    const extent = await this._extent({ space: existing.space });
    if (!validFootprint(footprint) || position.x < 0 || position.y < 0 ||
      footprint.x + footprint.width > extent.width || footprint.y + footprint.height > extent.height ||
      (position.x === 0 && position.y === 0)) {
      throw new InvalidFootprint("That booth location is not valid.");
    }
    try {
      await this.booths.updateOne({ _id: booth, organizer }, {
        $set: { footprint, cells: cellsOf(footprint) },
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AreaOccupied("That booth area overlaps another booth.");
      }
      throw error;
    }
    return {};
  }

  async remove({ organizer, booth }: { organizer: string; booth: string }) {
    const deleted = await this.booths.findOneAndDelete({ _id: booth, organizer });
    if (!deleted) throw new NoSuchBooth("That booth is not found.");
    await this.assignments.deleteMany({ booth });
    return {};
  }

  async verifyOwner({ organizer, booth }: { organizer: string; booth: string }) {
    await this.#ownedBooth(organizer, booth);
    return {};
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
    const rows = await this.booths.find({ space }).toArray();
    const row = rows.find((candidate) => boothContains(candidate.footprint, position));
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
    const row = await this.booths.findOne({ _id: booth });
    return { contains: !!row && boothContains(row.footprint, position) };
  }

  async _walkable({ space, from, to }: { space: string; from: Position; to: Position }) {
    const footprints = (await this.booths.find({ space }).toArray()).map((row) => ({ ...row.footprint, booth: row._id }));
    const extent = await this._extent({ space });
    return { walkable: walkableSegment(from, to, mapObstacles(footprints), extent) };
  }

  async _extent({ space }: { space: string }) {
    const row = await this.extents.findOne({ _id: space });
    return { width: row?.width ?? 10, height: row?.height ?? 10 };
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
