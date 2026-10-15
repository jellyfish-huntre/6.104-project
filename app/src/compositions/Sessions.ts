import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { Authenticating, Sessioning } = concepts;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const credentialsInput: EndpointValidator = (value) =>
  record(value) && typeof value.username === "string" &&
    typeof value.password === "string" && value.username.length <= 32 &&
    value.password.length <= 128
    ? { ok: true }
    : { ok: false, detail: "Enter a username and password." };

const sessionInput: EndpointValidator = (value) =>
  record(value) && (typeof value.session === "string" || value.session === null)
    ? { ok: true }
    : { ok: false, detail: "The browser session is invalid." };

const Register = endpoint(
  "/auth/register",
  ({ username, password, account, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.register({ username, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(respond({ account, session, expiresAt })),
  {
    input: { required: ["username", "password"] },
    validators: { input: credentialsInput },
  },
);

const SignIn = endpoint(
  "/auth/sign-in",
  ({ username, password, account, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.authenticate({ username, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(respond({ account, session, expiresAt })),
  {
    input: { required: ["username", "password"] },
    validators: { input: credentialsInput },
  },
);

const CurrentUser = endpoint(
  "/auth/current",
  ({ session, account }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: account }))
      .then(respond({ account })),
  { input: { required: ["session"] }, validators: { input: sessionInput } },
);

const SignOut = endpoint(
  "/auth/sign-out",
  ({ session, ended }) =>
    receive({ session })
      .then(Sessioning.end({ session }).responds({ ended }))
      .then(respond({ ended })),
  { input: { required: ["session"] }, validators: { input: sessionInput } },
);

export const composition = { Register, SignIn, CurrentUser, SignOut };
