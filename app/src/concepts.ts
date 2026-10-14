import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Reserving.md" with { type: "text" };
import hostingSpec from "@design/concepts/Hosting.md" with { type: "text" };
import {
  AlreadyReserved,
  NoSuchReservation,
  ReservingConcept,
} from "./concepts/Reserving.ts";
import { HostingConcept, InvalidFairName, NoSuchFair } from "./concepts/Hosting.ts";

const reserving = registerConcept({
  class: ReservingConcept,
  spec,
  refusals: {
    ALREADY_RESERVED: AlreadyReserved,
    NO_SUCH_RESERVATION: NoSuchReservation,
  },
});

const hosting = registerConcept({
  class: HostingConcept,
  spec: hostingSpec,
  refusals: { INVALID_NAME: InvalidFairName, NOT_FOUND: NoSuchFair },
});

export const applicationConceptSet = conceptSet({
  Reserving: reserving,
  Hosting: hosting,
});
export const { concepts } = applicationConceptSet;
