import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidCallUrl extends Error {}
export class PlaceBusy extends Error {}
export class HostBusy extends Error {}
export class NoSuchCall extends Error {}

interface Call { _id: string; place: string; host: string; joinUrl: string }

export class CallingConcept {
  private readonly calls: Collection<Call>;

  constructor(db: Db) {
    this.calls = db.collection<Call>("calling.calls");
  }

  async open({ host, place, joinUrl }: { host: string; place: string; joinUrl: string }) {
    let url: URL;
    try { url = new URL(joinUrl); }
    catch { throw new InvalidCallUrl("Enter a valid call link."); }
    if (!(["http:", "https:"].includes(url.protocol) && url.hostname)) {
      throw new InvalidCallUrl("Enter a valid call link.");
    }
    await this.calls.createIndex({ place: 1 }, { unique: true });
    await this.calls.createIndex({ host: 1 }, { unique: true });
    if (await this.calls.findOne({ place })) throw new PlaceBusy("A call is already open here.");
    if (await this.calls.findOne({ host })) throw new HostBusy("This host already has an open call.");
    const call = crypto.randomUUID();
    try { await this.calls.insertOne({ _id: call, host, place, joinUrl }); }
    catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        if (await this.calls.findOne({ place })) throw new PlaceBusy("A call is already open here.");
        throw new HostBusy("This host already has an open call.");
      }
      throw error;
    }
    return { call };
  }

  async join({ person: _person, call }: { person: string; call: string }) {
    const row = await this.calls.findOne({ _id: call });
    if (!row) throw new NoSuchCall("That call is no longer open.");
    return { joinUrl: row.joinUrl };
  }

  async close({ host, call }: { host: string; call: string }) {
    const result = await this.calls.deleteOne({ _id: call, host });
    if (!result.deletedCount) throw new NoSuchCall("That call is not found.");
    return {};
  }

  async _openAt({ place }: { place: string }) {
    const row = await this.calls.findOne({ place });
    return row ? [{ call: row._id, place, host: row.host }] : [];
  }

  async _hostedBy({ host }: { host: string }) {
    const row = await this.calls.findOne({ host });
    return row ? [{ call: row._id, place: row.place }] : [];
  }

  async _isOpen({ place }: { place: string }) {
    return { open: !!(await this.calls.findOne({ place })) };
  }
}
