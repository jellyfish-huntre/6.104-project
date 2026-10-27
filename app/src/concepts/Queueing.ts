import { MongoServerError, type Collection, type Db } from "mongodb";

export class AlreadyOpen extends Error {}
export class QueueUnavailable extends Error {}
export class QueueClosed extends Error {}
export class AlreadyWaiting extends Error {}
export class NotWaiting extends Error {}
export class NoOneWaiting extends Error {}
export class NoSuchQueue extends Error {}

interface Queue {
  _id: string;
  accepting: boolean;
  pausedUntil: string | null;
  nextOrder: number;
}

interface Request {
  _id: string;
  target: string;
  person: string;
  order: number;
  invitedUntil: string | null;
}

export class QueueingConcept {
  private readonly queues: Collection<Queue>;
  private readonly requests: Collection<Request>;

  constructor(db: Db, private readonly clock: () => number = Date.now) {
    this.queues = db.collection<Queue>("queueing.queues");
    this.requests = db.collection<Request>("queueing.requests");
  }

  async #indexes() {
    await this.requests.createIndex({ target: 1, person: 1 }, { unique: true });
    await this.requests.createIndex({ target: 1, order: 1 }, { unique: true });
  }

  #timestamp() { return new Date(this.clock()).toISOString(); }

  async open({ target }: { target: string }) {
    await this.#indexes();
    await this.expire({ target });
    try {
      await this.queues.insertOne({ _id: target, accepting: true, pausedUntil: null, nextOrder: 0 });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyOpen("This queue is already open.");
      }
      throw error;
    }
    return {};
  }

  async setAccepting({ target, accepting }: { target: string; accepting: boolean }) {
    const result = await this.queues.updateOne({ _id: target, pausedUntil: null }, { $set: { accepting } });
    if (!result.matchedCount) throw new QueueUnavailable("This queue is not accepting changes.");
    return {};
  }

  async join({ person, target }: { person: string; target: string }) {
    await this.expire({ target });
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || queue.pausedUntil || !queue.accepting) {
      throw new QueueClosed("This booth is not taking new requests.");
    }
    if (await this.requests.findOne({ target, person })) {
      throw new AlreadyWaiting("You already have a request at this booth.");
    }
    const updated = await this.queues.findOneAndUpdate(
      { _id: target, accepting: true, pausedUntil: null },
      { $inc: { nextOrder: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) throw new QueueClosed("This booth is not taking new requests.");
    const order = updated.nextOrder;
    try {
      await this.requests.insertOne({ _id: crypto.randomUUID(), target, person, order, invitedUntil: null });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        if (await this.requests.findOne({ target, person })) {
          throw new AlreadyWaiting("You already have a request at this booth.");
        }
      }
      throw error;
    }
    return { order };
  }

  async leave({ person, target }: { person: string; target: string }) {
    const result = await this.requests.deleteOne({ person, target });
    if (!result.deletedCount) throw new NotWaiting("You have no request at this booth.");
    return {};
  }

  async inviteNext({ target }: { target: string }) {
    await this.expire({ target });
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || queue.pausedUntil) throw new NoOneWaiting("No visitor is waiting for an invitation.");
    const invitedUntil = new Date(this.clock() + 120_000).toISOString();
    const candidate = await this.requests.findOneAndUpdate(
      { target, invitedUntil: null },
      { $set: { invitedUntil } },
      { sort: { order: 1 }, returnDocument: "after" },
    );
    if (!candidate) throw new NoOneWaiting("No visitor is waiting for an invitation.");
    return { person: candidate.person, invitedUntil };
  }

  async remove({ person, target }: { person: string; target: string }) {
    const result = await this.requests.deleteOne({ person, target });
    if (!result.deletedCount) throw new NotWaiting("That visitor has no request at this booth.");
    return {};
  }

  async pause({ target }: { target: string }) {
    const pausedUntil = new Date(this.clock() + 300_000).toISOString();
    const result = await this.queues.updateOne(
      { _id: target, pausedUntil: null }, { $set: { pausedUntil } },
    );
    if (!result.matchedCount && !(await this.queues.findOne({ _id: target }))) {
      throw new NoSuchQueue("That queue is not found.");
    }
    return {};
  }

  async resume({ target }: { target: string }) {
    const result = await this.queues.updateOne(
      { _id: target, pausedUntil: { $gt: this.#timestamp() } },
      { $set: { pausedUntil: null } },
    );
    if (!result.matchedCount) throw new NoSuchQueue("That queue has closed.");
    return {};
  }

  async expire({ target }: { target: string }) {
    const instant = this.#timestamp();
    const expiredPause = await this.queues.deleteOne({ _id: target, pausedUntil: { $lte: instant } });
    if (expiredPause.deletedCount) {
      await this.requests.deleteMany({ target });
    } else {
      await this.requests.deleteMany({ target, invitedUntil: { $ne: null, $lte: instant } });
    }
    return {};
  }

  async close({ target }: { target: string }) {
    const result = await this.queues.deleteOne({ _id: target });
    if (!result.deletedCount) throw new NoSuchQueue("That queue is not found.");
    await this.requests.deleteMany({ target });
    return {};
  }

  async discard({ target }: { target: string }) {
    await this.queues.deleteOne({ _id: target });
    await this.requests.deleteMany({ target });
    return {};
  }

  async _status({ target }: { target: string }) {
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || (queue.pausedUntil && queue.pausedUntil <= this.#timestamp())) return [];
    const waiting = await this.requests.countDocuments({ target, invitedUntil: null });
    return [{ accepting: queue.accepting, pausedUntil: queue.pausedUntil ?? "", waiting }];
  }

  async _mine({ person, target }: { person: string; target: string }) {
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || (queue.pausedUntil && queue.pausedUntil <= this.#timestamp())) return [];
    const request = await this.requests.findOne({ person, target });
    if (!request || (request.invitedUntil && request.invitedUntil <= this.#timestamp())) return [];
    return [{ order: request.order, invitedUntil: request.invitedUntil ?? "" }];
  }

  async _waiting({ target }: { target: string }) {
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || (queue.pausedUntil && queue.pausedUntil <= this.#timestamp())) return [];
    const requests = await this.requests.find({ target, invitedUntil: null }).sort({ order: 1 }).toArray();
    return requests.map(({ person, order }) => ({ person, order }));
  }

  async _requests({ target }: { target: string }) {
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || (queue.pausedUntil && queue.pausedUntil <= this.#timestamp())) return [];
    const requests = await this.requests.find({
      target, $or: [{ invitedUntil: null }, { invitedUntil: { $gt: this.#timestamp() } }],
    }).sort({ order: 1 }).toArray();
    return requests.map(({ person, order, invitedUntil }) => ({ person, order, invitedUntil: invitedUntil ?? "" }));
  }

  async _invited({ person, target }: { person: string; target: string }) {
    const queue = await this.queues.findOne({ _id: target });
    if (!queue || queue.pausedUntil) return { invited: false };
    const request = await this.requests.findOne({ person, target, invitedUntil: { $gt: this.#timestamp() } });
    return { invited: !!request };
  }

  async _exists({ target }: { target: string }) {
    await this.expire({ target });
    return { exists: !!(await this.queues.findOne({ _id: target })) };
  }

  async _paused({ target }: { target: string }) {
    const queue = await this.queues.findOne({ _id: target, pausedUntil: { $gt: this.#timestamp() } });
    return { paused: !!queue };
  }

  async _targets({ person }: { person: string }) {
    const requests = await this.requests.find({ person }).toArray();
    return requests.map(({ target }) => ({ target }));
  }
}
