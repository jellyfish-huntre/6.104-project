import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

export const policy = httpPolicy({
  publicOrigin: process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080",
  basePath: "/api",
  publicErrors: {
    ALREADY_RESERVED: "CONFLICT",
    NO_SUCH_RESERVATION: "NOT_FOUND",
    INVALID_NAME: "INVALID_REQUEST",
    NOT_FOUND: "NOT_FOUND",
    INVALID_USERNAME: "INVALID_REQUEST",
    WEAK_PASSWORD: "INVALID_REQUEST",
    USERNAME_TAKEN: "CONFLICT",
    INVALID_CREDENTIALS: "UNAUTHORIZED",
    NO_SUCH_ACCOUNT: "NOT_FOUND",
    UNKNOWN_SESSION: "UNAUTHORIZED",
    INVALID_FOOTPRINT: "INVALID_REQUEST",
    AREA_OCCUPIED: "CONFLICT",
    ALREADY_ASSIGNED: "CONFLICT",
    NOT_ASSIGNED: "NOT_FOUND",
    ALREADY_PRESENT: "CONFLICT",
    NOT_PRESENT: "NOT_FOUND",
    INVALID_MOVE: "INVALID_REQUEST",
    INVALID_GUEST_TOKEN: "INVALID_REQUEST",
    INVALID_URL: "INVALID_REQUEST",
    PLACE_BUSY: "CONFLICT",
    HOST_BUSY: "CONFLICT",
    NOT_ALLOWED: "FORBIDDEN",
  },
  cookies: {
    session: {
      name: "roam-session",
      input: "session",
      issue: [
        { path: "/auth/register", value: "session", expires: "expiresAt" },
        { path: "/auth/sign-in", value: "session", expires: "expiresAt" },
      ],
      clear: ["/auth/sign-out"],
    },
  },
});
