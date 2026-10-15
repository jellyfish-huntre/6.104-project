import { createHash, randomBytes } from "node:crypto";
import { type Collection, type Db } from "mongodb";

export class UnknownSession extends Error {}

interface Session {
  _id: string;
  subject: string;
  expiresAt: Date;
}

const lifetimeMs = 30 * 60 * 1000;
const digest = (session: string) => createHash("sha256").update(session).digest("hex");

export class SessioningConcept {
  private readonly sessions: Collection<Session>;

  constructor(db: Db) {
    this.sessions = db.collection<Session>("sessioning.sessions");
  }

  async start({ subject }: { subject: string }) {
    const now = new Date();
    await this.sessions.deleteMany({ expiresAt: { $lte: now } });
    const session = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + lifetimeMs);
    await this.sessions.insertOne({ _id: digest(session), subject, expiresAt });
    return { session, expiresAt };
  }

  async current({ session }: { session: string }) {
    const row = await this.#active(session);
    return { subject: row.subject };
  }

  async end({ session }: { session: string }) {
    const result = await this.sessions.deleteOne({
      _id: digest(session),
      expiresAt: { $gt: new Date() },
    });
    if (result.deletedCount === 0) throw new UnknownSession("This session is not active.");
    return { ended: true };
  }

  async _active({ session }: { session: string }) {
    if (typeof session !== "string") return [];
    const row = await this.sessions.findOne({
      _id: digest(session),
      expiresAt: { $gt: new Date() },
    });
    return row ? [{ subject: row.subject, expiresAt: row.expiresAt }] : [];
  }

  async _isActive({ session }: { session: string }) {
    return { active: (await this._active({ session })).length > 0 };
  }

  async #active(session: string) {
    if (typeof session !== "string") throw new UnknownSession("This session is not active.");
    const row = await this.sessions.findOne({
      _id: digest(session),
      expiresAt: { $gt: new Date() },
    });
    if (!row) throw new UnknownSession("This session is not active.");
    return row;
  }
}
