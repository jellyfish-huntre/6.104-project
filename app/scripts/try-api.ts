import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { RoamWireHttp } from "../generated/wire.ts";

const client = createHttpClient<RoamWireHttp>({
  baseUrl: "http://127.0.0.1:3000/api",
});

const created = await client.fairs.create({
  organizer: "Demo Organizer",
  name: "Demo Fair",
});
if ("error" in created) {
  console.error("Could not create fair:", created.error);
  process.exit(1);
}

const loaded = await client.fairs.page({ fair: created.fair });
console.log("Created:", created);
console.log("Loaded:", loaded);
