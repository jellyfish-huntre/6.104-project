import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Reserving.md" with { type: "text" };
import hostingSpec from "@design/concepts/Hosting.md" with { type: "text" };
import authenticatingSpec from "@design/concepts/Authenticating.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import exhibitingSpec from "@design/concepts/Exhibiting.md" with { type: "text" };
import navigatingSpec from "@design/concepts/Navigating.md" with { type: "text" };
import callingSpec from "@design/concepts/Calling.md" with { type: "text" };
import queueingSpec from "@design/concepts/Queueing.md" with { type: "text" };
import {
  AlreadyReserved,
  NoSuchReservation,
  ReservingConcept,
} from "./concepts/Reserving.ts";
import { HostingConcept, InvalidFairName, NoSuchFair } from "./concepts/Hosting.ts";
import {
  AuthenticatingConcept, InvalidCredentials, InvalidUsername, NoSuchAccount,
  UsernameTaken, WeakPassword,
} from "./concepts/Authenticating.ts";
import { SessioningConcept, UnknownSession } from "./concepts/Sessioning.ts";
import {
  ExhibitingConcept, InvalidBoothName, InvalidFootprint, AreaOccupied,
  NoSuchBooth, AlreadyAssigned, NotAssigned,
  InvalidMeetingUrl,
} from "./concepts/Exhibiting.ts";
import { NavigatingConcept, AlreadyPresent, NotPresent, InvalidMove, InvalidGuestToken } from "./concepts/Navigating.ts";
import { CallingConcept, InvalidCallUrl, PlaceBusy, HostBusy, NoSuchCall, InvalidMode, LinkNotRotated } from "./concepts/Calling.ts";
import { QueueingConcept, AlreadyOpen, QueueUnavailable, QueueClosed, AlreadyWaiting, NotWaiting, NoOneWaiting, NoSuchQueue } from "./concepts/Queueing.ts";

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

const authenticating = registerConcept({
  class: AuthenticatingConcept,
  spec: authenticatingSpec,
  refusals: {
    INVALID_USERNAME: InvalidUsername,
    WEAK_PASSWORD: WeakPassword,
    USERNAME_TAKEN: UsernameTaken,
    INVALID_CREDENTIALS: InvalidCredentials,
    NO_SUCH_ACCOUNT: NoSuchAccount,
  },
});

const sessioning = registerConcept({
  class: SessioningConcept,
  spec: sessioningSpec,
  refusals: { UNKNOWN_SESSION: UnknownSession },
});

const exhibiting = registerConcept({
  class: ExhibitingConcept,
  spec: exhibitingSpec,
  refusals: {
    INVALID_NAME: InvalidBoothName,
    INVALID_FOOTPRINT: InvalidFootprint,
    AREA_OCCUPIED: AreaOccupied,
    NOT_FOUND: NoSuchBooth,
    ALREADY_ASSIGNED: AlreadyAssigned,
    NOT_ASSIGNED: NotAssigned,
    INVALID_URL: InvalidMeetingUrl,
  },
});

const navigating = registerConcept({
  class: NavigatingConcept,
  spec: navigatingSpec,
  refusals: {
    ALREADY_PRESENT: AlreadyPresent, NOT_PRESENT: NotPresent,
    INVALID_MOVE: InvalidMove, INVALID_GUEST_TOKEN: InvalidGuestToken,
  },
});

const calling = registerConcept({
  class: CallingConcept,
  spec: callingSpec,
  refusals: {
    INVALID_URL: InvalidCallUrl, PLACE_BUSY: PlaceBusy,
    HOST_BUSY: HostBusy, NOT_FOUND: NoSuchCall,
    INVALID_MODE: InvalidMode, LINK_NOT_ROTATED: LinkNotRotated,
  },
});

const queueing = registerConcept({
  class: QueueingConcept,
  spec: queueingSpec,
  refusals: {
    ALREADY_OPEN: AlreadyOpen, QUEUE_UNAVAILABLE: QueueUnavailable,
    QUEUE_CLOSED: QueueClosed, ALREADY_WAITING: AlreadyWaiting,
    NOT_WAITING: NotWaiting, NO_ONE_WAITING: NoOneWaiting,
    NOT_FOUND: NoSuchQueue,
  },
});

export const applicationConceptSet = conceptSet({
  Reserving: reserving,
  Hosting: hosting,
  Authenticating: authenticating,
  Sessioning: sessioning,
  Exhibiting: exhibiting,
  Navigating: navigating,
  Calling: calling,
  Queueing: queueing,
});
export const { concepts } = applicationConceptSet;
