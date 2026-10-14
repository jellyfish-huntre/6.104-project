import { assemble } from "@mit-sdg/sync-engine/assembly";
import { composition as reservations } from "./compositions/Reservations.ts";
import { composition as roam } from "./compositions/Roam.ts";
import { ReservingConcept } from "./concepts/Reserving.ts";
import { HostingConcept } from "./concepts/Hosting.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Reserving: new ReservingConcept(db),
      Hosting: new HostingConcept(db),
    },
    composition: { Reservations: reservations, Roam: roam },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
