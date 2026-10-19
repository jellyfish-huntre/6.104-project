import { assemble } from "@mit-sdg/sync-engine/assembly";
import { composition as reservations } from "./compositions/Reservations.ts";
import { composition as roam } from "./compositions/Roam.ts";
import { composition as sessions } from "./compositions/Sessions.ts";
import { ReservingConcept } from "./concepts/Reserving.ts";
import { HostingConcept } from "./concepts/Hosting.ts";
import { AuthenticatingConcept } from "./concepts/Authenticating.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { ExhibitingConcept } from "./concepts/Exhibiting.ts";
import { NavigatingConcept } from "./concepts/Navigating.ts";
import { CallingConcept } from "./concepts/Calling.ts";
import { QueueingConcept } from "./concepts/Queueing.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Reserving: new ReservingConcept(db),
      Hosting: new HostingConcept(db),
      Authenticating: new AuthenticatingConcept(db),
      Sessioning: new SessioningConcept(db),
      Exhibiting: new ExhibitingConcept(db),
      Navigating: new NavigatingConcept(db),
      Calling: new CallingConcept(db),
      Queueing: new QueueingConcept(db),
    },
    composition: { Reservations: reservations, Sessions: sessions, Roam: roam },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
