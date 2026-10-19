import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidCallUrl extends Error {}
export class PlaceBusy extends Error {}
export class HostBusy extends Error {}
export class NoSuchCall extends Error {}
export class InvalidMode extends Error {}
export class LinkNotRotated extends Error {}

type Mode = "OPEN_GROUP" | "INVITE_ONLY";
interface Call { _id: string; place: string; host: string; joinUrl: string; mode: Mode }
interface SuspendedCall { _id: string; joinUrl: string }

function checkedUrl(joinUrl: string) {
  let url: URL;
  try { url = new URL(joinUrl); }
  catch { throw new InvalidCallUrl("Enter a valid call link."); }
  if (!(["http:", "https:"].includes(url.protocol) && url.hostname)) {
    throw new InvalidCallUrl("Enter a valid call link.");
  }
}

function checkedMode(mode: string): asserts mode is Mode {
  if (mode !== "OPEN_GROUP" && mode !== "INVITE_ONLY") {
    throw new InvalidMode("Choose open group or invite-only access.");
  }
}

export class CallingConcept {
  private readonly calls: Collection<Call>;
  private readonly suspendedCalls: Collection<SuspendedCall>;

  constructor(db: Db) {
    this.calls = db.collection<Call>("calling.calls");
    this.suspendedCalls = db.collection<SuspendedCall>("calling.suspendedCalls");
  }

  async open({ host, place, joinUrl, mode }: { host: string; place: string; joinUrl: string; mode: Mode }) {
    checkedUrl(joinUrl);
    checkedMode(mode);
    await this.calls.createIndex({ place: 1 }, { unique: true });
    await this.calls.createIndex({ host: 1 }, { unique: true });
    if (await this.calls.findOne({ place })) throw new PlaceBusy("A call is already open here.");
    if (await this.calls.findOne({ host })) throw new HostBusy("This host already has an open call.");
    const call = crypto.randomUUID();
    try { await this.calls.insertOne({ _id: call, host, place, joinUrl, mode }); }
    catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        if (await this.calls.findOne({ place })) throw new PlaceBusy("A call is already open here.");
        throw new HostBusy("This host already has an open call.");
      }
      throw error;
    }
    await this.suspendedCalls.deleteOne({ _id: place });
    return { call };
  }

  async resume({ host, place }: { host: string; place: string }) {
    const suspended = await this.suspendedCalls.findOne({ _id: place });
    if (!suspended) throw new NoSuchCall("There is no invite-only call to resume.");
    if (await this.calls.findOne({ place })) throw new PlaceBusy("A call is already open here.");
    if (await this.calls.findOne({ host })) throw new HostBusy("This host already has an open call.");
    const { call } = await this.open({ host, place, joinUrl: suspended.joinUrl, mode: "INVITE_ONLY" });
    return { call };
  }

  async changeMode({ host, call, mode, joinUrl }: { host: string; call: string; mode: Mode; joinUrl: string }) {
    checkedMode(mode);
    checkedUrl(joinUrl);
    const current = await this.calls.findOne({ _id: call, host });
    if (!current) throw new NoSuchCall("That call is not found.");
    if ((current.mode ?? "OPEN_GROUP") === "OPEN_GROUP" && mode === "INVITE_ONLY" && current.joinUrl === joinUrl) {
      throw new LinkNotRotated("Use a fresh meeting link for invite-only access.");
    }
    const changed = await this.calls.updateOne(
      { _id: call, host, mode: current.mode, joinUrl: current.joinUrl },
      { $set: { mode, joinUrl } },
    );
    if (!changed.matchedCount) throw new NoSuchCall("That call changed. Try again.");
    return {};
  }

  async join({ person: _person, call }: { person: string; call: string }) {
    const row = await this.calls.findOne({ _id: call });
    if (!row) throw new NoSuchCall("That call is no longer open.");
    return { joinUrl: row.joinUrl };
  }

  async close({ host, call }: { host: string; call: string }) {
    const row = await this.calls.findOneAndDelete({ _id: call, host });
    if (!row) throw new NoSuchCall("That call is not found.");
    return { place: row.place, mode: row.mode ?? "OPEN_GROUP" };
  }

  async suspend({ host, call }: { host: string; call: string }) {
    const row = await this.calls.findOne({ _id: call, host, mode: "INVITE_ONLY" });
    if (!row) throw new NoSuchCall("That call is not found.");
    await this.suspendedCalls.updateOne(
      { _id: row.place }, { $set: { joinUrl: row.joinUrl } }, { upsert: true },
    );
    const removed = await this.calls.deleteOne({ _id: call, host, mode: "INVITE_ONLY" });
    if (!removed.deletedCount) throw new NoSuchCall("That call changed. Try again.");
    return { place: row.place };
  }

  async _openAt({ place }: { place: string }) {
    const row = await this.calls.findOne({ place });
    return row ? [{ call: row._id, place, host: row.host, mode: row.mode ?? "OPEN_GROUP" }] : [];
  }

  async _hostedBy({ host }: { host: string }) {
    const row = await this.calls.findOne({ host });
    return row ? [{ call: row._id, place: row.place, mode: row.mode ?? "OPEN_GROUP" }] : [];
  }

  async _isOpen({ place }: { place: string }) {
    return { open: !!(await this.calls.findOne({ place })) };
  }

  async _suspendedAt({ place }: { place: string }) {
    return { suspended: !!(await this.suspendedCalls.findOne({ _id: place })) };
  }
}
