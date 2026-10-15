import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidUsername extends Error {}
export class WeakPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}
export class NoSuchAccount extends Error {}

interface Account {
  _id: string;
  passwordVerifier: string;
}

const usernamePattern = /^[A-Za-z0-9_-]{3,32}$/;

export class AuthenticatingConcept {
  private readonly accounts: Collection<Account>;

  constructor(db: Db) {
    this.accounts = db.collection<Account>("authenticating.accounts");
  }

  async register({ username, password }: { username: string; password: string }) {
    if (!usernamePattern.test(username)) {
      throw new InvalidUsername("A username must contain 3 to 32 letters, numbers, underscores, or hyphens.");
    }
    if (password.length < 8 || password.length > 128) {
      throw new WeakPassword("A password must contain 8 to 128 characters.");
    }
    const passwordVerifier = await Bun.password.hash(password, { algorithm: "argon2id" });
    try {
      await this.accounts.insertOne({ _id: username, passwordVerifier });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new UsernameTaken("That username is already registered.");
      }
      throw error;
    }
    return { account: username };
  }

  async authenticate({ username, password }: { username: string; password: string }) {
    const account = await this.accounts.findOne({ _id: username });
    if (!account || !(await Bun.password.verify(password, account.passwordVerifier))) {
      throw new InvalidCredentials("The username or password is incorrect.");
    }
    return { account: account._id };
  }

  async _registered({ username }: { username: string }) {
    return { registered: (await this.accounts.countDocuments({ _id: username }, { limit: 1 })) > 0 };
  }

  async verifyRegistered({ username }: { username: string }) {
    const { registered } = await this._registered({ username });
    if (!registered) throw new NoSuchAccount("That account is not registered.");
    return {};
  }
}
