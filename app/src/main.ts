import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { policy } from "./http.ts";
import { db } from "./db.ts";
import { migrateLegacyFairCodes } from "./concepts/Hosting.ts";
import { migrateLegacyBoothRepresentatives } from "./concepts/Exhibiting.ts";

await migrateLegacyFairCodes(db);
await migrateLegacyBoothRepresentatives(db);

const application = assembleApplication();
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });
let healthFailureLogged = false;

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": api,
    "/health": async () => {
      try {
        await db
          .collection("hosting.fairs")
          .findOne({}, { maxTimeMS: 2000, timeoutMS: 3000 });
        if (healthFailureLogged) console.info("Database health check recovered");
        healthFailureLogged = false;
        return Response.json(
          { status: "ok" },
          { headers: { "Cache-Control": "no-store" } },
        );
      } catch (error) {
        if (!healthFailureLogged) {
          console.error("Database health check failed", error instanceof Error ? error.name : "UnknownError");
          healthFailureLogged = true;
        }
        return Response.json(
          { status: "unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    },
  },
});

console.log(`Backend ready on ${server.url}`);
