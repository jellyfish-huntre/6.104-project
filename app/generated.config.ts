import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { assembleApplication } from "./src/assembly.ts";
import { policy } from "./src/http.ts";

export default {
  assemble: assembleApplication,
  title: "Roam",
  wireName: "RoamWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Reservations.md", import.meta.url),
      new URL("./design/compositions/Sessions.md", import.meta.url),
      new URL("./design/compositions/RoamHosting.md", import.meta.url),
      new URL("./design/compositions/StudentDiscovery.md", import.meta.url),
      new URL("./design/compositions/RoamCalling.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy, name: "RoamWireHttp" })],
};
