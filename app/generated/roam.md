<!-- Generated from the Roam assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Roam — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_USERNAME`: A username must contain 3 to 32 letters, numbers, underscores, or hyphens.
  - Refuses `WEAK_PASSWORD`: A password must contain 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is already registered.
- `authenticate(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.
- `verifyRegistered(username: String) : returns ()`
  - Refuses `NO_SUCH_ACCOUNT`: That account is not registered.

#### Queries

- `_registered(username: String) : one (registered: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [Application types](../design/types.md), line 34.

### Calling

Defined in [Calling](../design/concepts/Calling.md), line 1.

#### Actions

- `open(host: Person, place: Place, joinUrl: String, mode: Mode) : returns (call: Call)`
  - Refuses `INVALID_URL`: Enter a valid call link.
  - Refuses `INVALID_MODE`: Choose open group or invite-only access.
  - Refuses `PLACE_BUSY`: A call is already open here.
  - Refuses `HOST_BUSY`: This host already has an open call.
- `resume(host: Person, place: Place) : returns (call: Call)`
  - Refuses `NOT_FOUND`: There is no invite-only call to resume.
  - Refuses `PLACE_BUSY`: A call is already open here.
  - Refuses `HOST_BUSY`: This host already has an open call.
- `changeMode(host: Person, call: Call, mode: Mode, joinUrl: String) : returns ()`
  - Refuses `NOT_FOUND`: That call is not found.
  - Refuses `INVALID_MODE`: Choose open group or invite-only access.
  - Refuses `INVALID_URL`: Enter a valid call link.
  - Refuses `LINK_NOT_ROTATED`: Use a fresh meeting link for invite-only access.
- `join(person: Person, call: Call) : returns (joinUrl: String)`
  - Refuses `NOT_FOUND`: That call is no longer open.
- `close(host: Person, call: Call) : returns (place: Place, mode: Mode)`
  - Refuses `NOT_FOUND`: That call is not found.
- `discardAt(place: Place) : returns ()`
- `suspend(host: Person, call: Call) : returns (place: Place)`
  - Refuses `NOT_FOUND`: That call is not found.

#### Queries

- `_openAt(place: Place) : optional (call: Call, place: Place, host: Person, mode: Mode)`
- `_hostedBy(host: Person) : optional (call: Call, place: Place, mode: Mode)`
- `_isHost(host: Person, call: Call) : one (hosting: Flag)`
- `_isOpen(place: Place) : one (open: Flag)`
- `_suspendedAt(place: Place) : one (suspended: Flag)`

#### Instances

- `Calling` — instance of `Calling` — [Application types](../design/types.md), line 54.
  - `Person` is `Participant` — [Application types](../design/types.md), line 55.
  - `Place` is `Exhibiting.Booth` — [Application types](../design/types.md), line 56.

### Exhibiting

Defined in [Exhibiting](../design/concepts/Exhibiting.md), line 1.

#### Actions

- `create(organizer: Person, space: Space, footprint: Footprint, name: String, description: String, meetingUrl: String) : returns (booth: Booth)`
  - Refuses `INVALID_NAME`: That booth name is not valid.
  - Refuses `INVALID_URL`: Enter a valid meeting link.
  - Refuses `INVALID_FOOTPRINT`: That booth area is not valid.
  - Refuses `AREA_OCCUPIED`: That booth area overlaps another booth.
- `createSized(organizer: Person, space: Space, size: String, name: String, description: String, meetingUrl: String) : returns (booth: Booth)`
  - Refuses `INVALID_FOOTPRINT`: Choose a small, medium, or large booth.
- `move(organizer: Person, booth: Booth, position: Position) : returns ()`
  - Refuses `NOT_FOUND`: That booth is not found.
  - Refuses `INVALID_FOOTPRINT`: That booth location is not valid.
  - Refuses `AREA_OCCUPIED`: That booth area overlaps another booth.
- `remove(organizer: Person, booth: Booth) : returns ()`
  - Refuses `NOT_FOUND`: That booth is not found.
- `verifyOwner(organizer: Person, booth: Booth) : returns ()`
  - Refuses `NOT_FOUND`: That booth is not found.
- `edit(organizer: Person, booth: Booth, name: String, description: String) : returns ()`
  - Refuses `INVALID_NAME`: That booth name is not valid.
  - Refuses `NOT_FOUND`: That booth is not found.
- `addRepresentative(organizer: Person, booth: Booth, representative: Person) : returns ()`
  - Refuses `NOT_FOUND`: That booth is not found.
  - Refuses `ALREADY_ASSIGNED`: That person already represents this booth.
- `removeRepresentative(organizer: Person, booth: Booth, representative: Person) : returns ()`
  - Refuses `NOT_FOUND`: That booth is not found.
  - Refuses `NOT_ASSIGNED`: That person does not represent this booth.
- `setMeetingLink(organizer: Person, booth: Booth, meetingUrl: String) : returns ()`
  - Refuses `INVALID_URL`: Enter a valid meeting link.
  - Refuses `NOT_FOUND`: That booth is not found.
- `meetingLink(person: Person, booth: Booth) : returns (joinUrl: String)`
  - Refuses `NOT_FOUND`: That meeting link is not found.

#### Queries

- `_get(booth: Booth) : optional (booth: Booth, space: Space, footprint: Footprint, name: String, description: String, organizer: Person, meetingLinkSaved: Flag)`
- `_in(space: Space) : many (booth: Booth, space: Space, footprint: Footprint, name: String, description: String, organizer: Person, meetingLinkSaved: Flag)`
- `_at(space: Space, position: Position) : optional (booth: Booth)`
- `_representatives(booth: Booth) : many (representative: Person)`
- `_isRepresentative(booth: Booth, representative: Person) : one (assigned: Flag)`
- `_contains(booth: Booth, position: Position) : one (contains: Flag)`
- `_walkable(space: Space, from: Position, to: Position) : one (walkable: Flag)`
- `_extent(space: Space) : one (width: Number, height: Number)`
- `_exists(booth: Booth) : one (exists: Flag)`
- `_inSpace(booth: Booth, space: Space) : one (inSpace: Flag)`

#### Instances

- `Exhibiting` — instance of `Exhibiting` — [Application types](../design/types.md), line 42.
  - `Footprint` is `Footprint` — [Application types](../design/types.md), line 46.
  - `Person` is `Authenticating.Account` — [Application types](../design/types.md), line 43.
  - `Position` is `Position` — [Application types](../design/types.md), line 45.
  - `Space` is `Hosting.Fair` — [Application types](../design/types.md), line 44.

### Hosting

Defined in [Hosting](../design/concepts/Hosting.md), line 1.

#### Actions

- `create(organizer: Person, name: String) : returns (fair: Fair, code: String)`
  - Refuses `INVALID_NAME`: That name is not valid.
- `edit(organizer: Person, fair: Fair, name: String) : returns ()`
  - Refuses `NOT_FOUND`: That fair is not found
  - Refuses `INVALID_NAME`: That name is not valid.
- `verifyOwner(organizer: Person, fair: Fair) : returns ()`
  - Refuses `NOT_FOUND`: That fair is not found.
- `setListed(organizer: Person, fair: Fair, listed: Flag) : returns ()`
  - Refuses `NOT_FOUND`: That fair is not found.

#### Queries

- `_get(fair: Fair) : optional (fair: Fair, name: String, organizer: Person, code: String, listed: Flag)`
- `_exists(fair: Fair) : one (exists: Flag)`
- `_owns(fair: Fair, organizer: Person) : one (owns: Flag)`
- `_byCode(code: String) : optional (fair: Fair)`
- `_codeExists(code: String) : one (exists: Flag)`
- `_public() : many (fair: Fair, name: String, organizer: Person)`

#### Instances

- `Hosting` — instance of `Hosting` — [Application types](../design/types.md), line 39.
  - `Person` is `Authenticating.Account` — [Application types](../design/types.md), line 40.

### Navigating

Defined in [Navigating](../design/concepts/Navigating.md), line 1.

#### Actions

- `enter(person: Person, space: Space, position: Position) : returns ()`
  - Refuses `ALREADY_PRESENT`: That person is already in a space.
- `move(person: Person, destination: Position) : returns ()`
  - Refuses `INVALID_MOVE`: Move one cell within the fair.
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `moveFree(person: Person, destination: Position) : returns ()`
  - Refuses `INVALID_MOVE`: That movement is too far or outside the fair.
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `leave(person: Person) : returns ()`
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `enterGuest(token: GuestToken, space: Space) : returns (person: Person, position: Position)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
- `moveGuest(token: GuestToken, destination: Position) : returns (person: Person, position: Position)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
  - Refuses `INVALID_MOVE`: Move one cell within the fair.
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `moveGuestFree(token: GuestToken, destination: Position) : returns (person: Person, position: Position)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
  - Refuses `INVALID_MOVE`: That movement is too far or outside the fair.
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `leaveGuest(token: GuestToken) : returns (person: Person)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
  - Refuses `NOT_PRESENT`: That person is not in a space.

#### Queries

- `_location(person: Person) : optional (person: Person, space: Space, position: Position)`
- `_present(space: Space) : many (person: Person, position: Position)`
- `_inSpace(person: Person, space: Space) : one (present: Flag)`
- `_guestLocation(token: GuestToken) : optional (person: Person, space: Space, position: Position)`
- `_guestInSpace(token: GuestToken, space: Space) : one (present: Flag)`

#### Instances

- `Navigating` — instance of `Navigating` — [Application types](../design/types.md), line 48.
  - `GuestToken` is `GuestToken` — [Application types](../design/types.md), line 52.
  - `Person` is `Participant` — [Application types](../design/types.md), line 49.
  - `Position` is `Position` — [Application types](../design/types.md), line 51.
  - `Space` is `Hosting.Fair` — [Application types](../design/types.md), line 50.

### Queueing

Defined in [Queueing](../design/concepts/Queueing.md), line 1.

#### Actions

- `open(target: Target) : returns ()`
  - Refuses `ALREADY_OPEN`: This queue is already open.
- `discard(target: Target) : returns ()`
- `setAccepting(target: Target, accepting: Flag) : returns ()`
  - Refuses `QUEUE_UNAVAILABLE`: This queue is not accepting changes.
- `join(person: Person, target: Target) : returns (order: Number)`
  - Refuses `QUEUE_CLOSED`: This booth is not taking new requests.
  - Refuses `ALREADY_WAITING`: You already have a request at this booth.
- `leave(person: Person, target: Target) : returns ()`
  - Refuses `NOT_WAITING`: You have no request at this booth.
- `inviteNext(target: Target) : returns (person: Person, invitedUntil: String)`
  - Refuses `NO_ONE_WAITING`: No visitor is waiting for an invitation.
- `remove(person: Person, target: Target) : returns ()`
  - Refuses `NOT_WAITING`: That visitor has no request at this booth.
- `pause(target: Target) : returns ()`
  - Refuses `NOT_FOUND`: That queue is not found.
- `resume(target: Target) : returns ()`
  - Refuses `NOT_FOUND`: That queue has closed.
- `expire(target: Target) : returns ()`
- `close(target: Target) : returns ()`
  - Refuses `NOT_FOUND`: That queue is not found.

#### Queries

- `_status(target: Target) : optional (accepting: Flag, pausedUntil: String, waiting: Number)`
- `_mine(person: Person, target: Target) : optional (order: Number, invitedUntil: String)`
- `_waiting(target: Target) : many (person: Person, order: Number)`
- `_requests(target: Target) : many (person: Person, order: Number, invitedUntil: String)`
- `_invited(person: Person, target: Target) : one (invited: Flag)`
- `_exists(target: Target) : one (exists: Flag)`
- `_paused(target: Target) : one (paused: Flag)`
- `_targets(person: Person) : many (target: Target)`

#### Instances

- `Queueing` — instance of `Queueing` — [Application types](../design/types.md), line 58.
  - `Person` is `Participant` — [Application types](../design/types.md), line 59.
  - `Target` is `Exhibiting.Booth` — [Application types](../design/types.md), line 60.

### Reserving

Defined in [Reserving](../design/concepts/Reserving.md), line 1.

#### Actions

- `reserve(user: User, resource: Resource) : returns (reservation: Reservation)`
  - Refuses `ALREADY_RESERVED`: That resource is already reserved.
- `cancel(reservation: Reservation) : returns (reservation: Reservation)`
  - Refuses `NO_SUCH_RESERVATION`: There is no such reservation.

#### Queries

- `_all() : many (reservation: Reservation, user: User, resource: Resource)`

#### Instances

- `Reserving` — instance of `Reserving` — [Application types](../design/types.md), line 30.
  - `Resource` is `Table` — [Application types](../design/types.md), line 32.
  - `User` is `Name` — [Application types](../design/types.md), line 31.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`
- `_isActive(session: Session) : one (active: Flag)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [Application types](../design/types.md), line 36.
  - `Subject` is `Authenticating.Account` — [Application types](../design/types.md), line 37.

## Application types

Concrete types:

- `Footprint` — [Application types](../design/types.md), line 18.
- `GuestToken` — [Application types](../design/types.md), line 25.
- `Name` — [Application types](../design/types.md), line 8.
- `Participant` — [Application types](../design/types.md), line 22.
- `Position` — [Application types](../design/types.md), line 14.
- `Table` — [Application types](../design/types.md), line 11.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the fair page for (fair)

Authored path: `Roam.FairPage`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 36.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 6.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 3.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 21.

```former
Former "the fair page for (fair)" — inputs (fair); bindings (name, organizer, code, listed, width, height, booth, boothName, description, footprint, meetingLinkSaved, representative, call, host, mode, accepting, pausedUntil, waiting); promises exactly one record — forms:
  a record of
    where Hosting._get (fair) has (code, listed, name, organizer)
    where Exhibiting._extent (space: fair) has (height, width)
    booths: each Exhibiting._in (space: fair) has (booth, description, footprint, meetingLinkSaved, name: boothName)
      form a record of
        booth
        calls: each Calling._openAt (place: booth) has (call, host, mode)
          form a record of
            call
            host
            mode
        description
        footprint
        meetingLinkSaved
        name: boothName
        queues: each Queueing._status (target: booth) has (accepting, pausedUntil, waiting)
          form a record of
            accepting
            pausedUntil
            waiting
        representatives: each Exhibiting._representatives (booth) has (representative)
          form a record of
            representative
    code
    extent: a record of
      height
      width
    fair
    listed
    name
    organizer
```

### the people in (fair)

Authored path: `Roam.FairPresence`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 19.

```former
Former "the people in (fair)" — inputs (fair); bindings (person, position); promises exactly one record — forms:
  a record of
    where Hosting._exists (fair) has (exists: true)
    people: each Navigating._present (space: fair) has (person, position)
      form a record of
        person
        position
```

### the public fair directory

Authored path: `Roam.PublicFairs`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 9.

```former
Former "the public fair directory" — inputs (); bindings (fair, name, organizer); promises exactly one record — forms:
  a record of
    fairs: each Hosting._public () has (fair, name, organizer)
      form a record of
        fair
        name
        organizer
```

### the queue request of (person) at (booth)

Authored path: `Roam.MyQueueStatus`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 165.

```former
Former "the queue request of (person) at (booth)" — inputs (person, booth); bindings (order, invitedUntil); promises exactly one record — forms:
  a record of
    requests: each Queueing._mine (person, target: booth) has (invitedUntil, order)
      form a record of
        invitedUntil
        order
```

### the reservation book

Authored path: `Reservations.ReservationBook`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 4.

```former
Former "the reservation book" — inputs (); bindings (reservation, user, resource); promises exactly one record — forms:
  a record of
    reservations: each Reserving._all () has (reservation, resource, user)
      form a record of
        reservation
        resource
        user
```

### the waiting and invited visitors at (booth)

Authored path: `Roam.BoothQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 172.

```former
Former "the waiting and invited visitors at (booth)" — inputs (booth); bindings (person, order, invitedUntil); promises exactly one record — forms:
  a record of
    visitors: each Queueing._requests (target: booth) has (invitedUntil, order, person)
      form a record of
        invitedUntil
        order
        person
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Reservations.Cancel

Authored path: `Reservations.Cancel`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 11.
- Covered by [Reservations](../design/compositions/Reservations.md), line 15.

```reaction
when RequestBoundary.request (path: "/reservations/cancel", requestId, reservation)
then
  Reserving.cancel (reservation)
```

### Reservations.Cancel#2

Authored path: `Reservations.Cancel`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 11.
- Covered by [Reservations](../design/compositions/Reservations.md), line 15.

```reaction
when Reserving.cancel (reservation), asked by Reservations.Cancel
where
  earlier, RequestBoundary.request (path: "/reservations/cancel", requestId, reservation)
then
  RequestBoundary.respond (requestId, reservation)
```

### Reservations.List

Authored path: `Reservations.List`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 3.
- Covered by [Reservations](../design/compositions/Reservations.md), line 7.

```reaction
when RequestBoundary.request (path: "/reservations/list", requestId)
then
  RequestBoundary.respond (book: former "the reservation book", requestId)
```

### Reservations.Reserve

Authored path: `Reservations.Reserve`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 10.
- Covered by [Reservations](../design/compositions/Reservations.md), line 14.

```reaction
when RequestBoundary.request (path: "/reservations/reserve", requestId, resource, user)
then
  Reserving.reserve (resource, user)
```

### Reservations.Reserve#2

Authored path: `Reservations.Reserve`.
- Covered by [Reservations](../design/compositions/Reservations.md), line 10.
- Covered by [Reservations](../design/compositions/Reservations.md), line 14.

```reaction
when Reserving.reserve (resource, user, reservation), asked by Reservations.Reserve
where
  earlier, RequestBoundary.request (path: "/reservations/reserve", requestId, resource, user)
then
  RequestBoundary.respond (requestId, reservation)
```

### Roam.AddRepresentative

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 29.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 53.

```reaction
when RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  Sessioning.current (session)
```

### Roam.AddRepresentative#2

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 29.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 53.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.AddRepresentative
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  Authenticating.verifyRegistered (username: representative)
```

### Roam.AddRepresentative#3

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 29.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 53.

```reaction
when Authenticating.verifyRegistered (username: representative), asked by Roam.AddRepresentative#2
where
  earlier, Sessioning.current (session, subject: organizer), asked by Roam.AddRepresentative
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  Exhibiting.addRepresentative (booth, organizer, representative)
```

### Roam.AddRepresentative#4

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 29.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 53.

```reaction
when Exhibiting.addRepresentative (booth, organizer, representative), asked by Roam.AddRepresentative#3
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  RequestBoundary.respond (booth, representative, requestId)
```

### Roam.ChangeCallMode

Authored path: `Roam.ChangeCallMode`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 66.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 123.

```reaction
when RequestBoundary.request (call, joinUrl, mode, path: "/calls/mode", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Calling._hostedBy (host: person) has (call, place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  Calling.changeMode (call, host: person, joinUrl, mode)
```

### Roam.ChangeCallMode#2

Authored path: `Roam.ChangeCallMode`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 66.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 123.

```reaction
when Calling.changeMode (call, host: person, joinUrl, mode), asked by Roam.ChangeCallMode
where
  earlier, RequestBoundary.request (call, joinUrl, mode, path: "/calls/mode", requestId, session)
then
  RequestBoundary.respond (call, mode, requestId)
```

### Roam.ChangeCallModeNoSession

Authored path: `Roam.ChangeCallModeNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 74.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 99.

```reaction
when RequestBoundary.request (call, joinUrl, mode, path: "/calls/mode", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.ChangeCallModeNotHost

Authored path: `Roam.ChangeCallModeNotHost`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 72.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 98.

```reaction
when RequestBoundary.request (call, joinUrl, mode, path: "/calls/mode", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Calling._isHost (call, host: person) has (hosting: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.ClaimInvitation

Authored path: `Roam.ClaimInvitation`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 190.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 220.

```reaction
when RequestBoundary.request (booth, path: "/calls/claim-invitation", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._inSpace (person, space) has (present: true)
  Queueing._invited (person, target: booth) has (invited: true)
  Calling._openAt (place: booth) has (call, mode: "INVITE_ONLY")
then
  Calling.join (call, person)
```

### Roam.ClaimInvitation#2

Authored path: `Roam.ClaimInvitation`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 190.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 220.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.ClaimInvitation
where
  earlier, RequestBoundary.request (booth, path: "/calls/claim-invitation", requestId, session)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.ClaimInvitationNotInvited

Authored path: `Roam.ClaimInvitationNotInvited`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 198.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 221.

```reaction
when RequestBoundary.request (booth, path: "/calls/claim-invitation", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._inSpace (person, space) has (present: true)
  Queueing._invited (person, target: booth) has (invited: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.CloseCall

Authored path: `Roam.CloseCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 38.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 121.

```reaction
when RequestBoundary.request (call, path: "/calls/close", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Calling._hostedBy (host: person) has (call, mode: "OPEN_GROUP")
then
  Calling.close (call, host: person)
```

### Roam.CloseCall#2

Authored path: `Roam.CloseCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 38.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 121.

```reaction
when Calling.close (call, host: person), asked by Roam.CloseCall
where
  earlier, RequestBoundary.request (call, path: "/calls/close", requestId, session)
then
  RequestBoundary.respond (closed: true, requestId)
```

### Roam.CloseCallNoSession

Authored path: `Roam.CloseCallNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 75.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 101.

```reaction
when RequestBoundary.request (call, path: "/calls/close", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.CloseCallNotHost

Authored path: `Roam.CloseCallNotHost`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 73.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 100.

```reaction
when RequestBoundary.request (call, path: "/calls/close", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Calling._isHost (call, host: person) has (hosting: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.CloseInviteCall

Authored path: `Roam.CloseInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 90.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 122.

```reaction
when RequestBoundary.request (call, path: "/calls/close", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Calling._hostedBy (host: person) has (call, mode: "INVITE_ONLY", place: booth)
then
  Calling.close (call, host: person)
```

### Roam.CloseInviteCall#2

Authored path: `Roam.CloseInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 90.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 122.

```reaction
when Calling.close (call, host: person, place: booth), asked by Roam.CloseInviteCall
then
  Queueing.close (target: booth)
```

### Roam.CloseInviteCall#3

Authored path: `Roam.CloseInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 90.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 122.

```reaction
when Queueing.close (target: booth), asked by Roam.CloseInviteCall#2
where
  earlier, RequestBoundary.request (call, path: "/calls/close", requestId, session)
then
  RequestBoundary.respond (closed: true, requestId)
```

### Roam.CreateBooth

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 45.

```reaction
when RequestBoundary.request (description, fair, footprint, meetingUrl, name, path: "/booths/create", requestId, session)
then
  Sessioning.current (session)
```

### Roam.CreateBooth#2

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 45.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.CreateBooth
where
  earlier, RequestBoundary.request (description, fair, footprint, meetingUrl, name, path: "/booths/create", requestId, session)
then
  Hosting.verifyOwner (fair, organizer)
```

### Roam.CreateBooth#3

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 45.

```reaction
when Hosting.verifyOwner (fair, organizer), asked by Roam.CreateBooth#2
where
  earlier, RequestBoundary.request (description, fair, footprint, meetingUrl, name, path: "/booths/create", requestId, session)
then
  Exhibiting.create (description, footprint, meetingUrl, name, organizer, space: fair)
```

### Roam.CreateBooth#4

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 45.

```reaction
when Exhibiting.create (description, footprint, meetingUrl, name, organizer, space: fair, booth), asked by Roam.CreateBooth#3
where
  earlier, RequestBoundary.request (description, fair, footprint, meetingUrl, name, path: "/booths/create", requestId, session)
then
  RequestBoundary.respond (booth, requestId)
```

### Roam.CreateFair

Authored path: `Roam.CreateFair`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 3.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 13.

```reaction
when RequestBoundary.request (name, path: "/fairs/create", requestId, session)
then
  Sessioning.current (session)
```

### Roam.CreateFair#2

Authored path: `Roam.CreateFair`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 3.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 13.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.CreateFair
where
  earlier, RequestBoundary.request (name, path: "/fairs/create", requestId, session)
then
  Hosting.create (name, organizer)
```

### Roam.CreateFair#3

Authored path: `Roam.CreateFair`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 3.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 13.

```reaction
when Hosting.create (name, organizer, code, fair), asked by Roam.CreateFair#2
where
  earlier, RequestBoundary.request (name, path: "/fairs/create", requestId, session)
then
  RequestBoundary.respond (code, fair, requestId)
```

### Roam.CreateSizedBooth

Authored path: `Roam.CreateSizedBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 46.

```reaction
when RequestBoundary.request (description, fair, meetingUrl, name, path: "/booths/create-sized", requestId, session, size)
then
  Sessioning.current (session)
```

### Roam.CreateSizedBooth#2

Authored path: `Roam.CreateSizedBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 46.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.CreateSizedBooth
where
  earlier, RequestBoundary.request (description, fair, meetingUrl, name, path: "/booths/create-sized", requestId, session, size)
then
  Hosting.verifyOwner (fair, organizer)
```

### Roam.CreateSizedBooth#3

Authored path: `Roam.CreateSizedBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 46.

```reaction
when Hosting.verifyOwner (fair, organizer), asked by Roam.CreateSizedBooth#2
where
  earlier, RequestBoundary.request (description, fair, meetingUrl, name, path: "/booths/create-sized", requestId, session, size)
then
  Exhibiting.createSized (description, meetingUrl, name, organizer, size, space: fair)
```

### Roam.CreateSizedBooth#4

Authored path: `Roam.CreateSizedBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 46.

```reaction
when Exhibiting.createSized (description, meetingUrl, name, organizer, size, space: fair, booth), asked by Roam.CreateSizedBooth#3
where
  earlier, RequestBoundary.request (description, fair, meetingUrl, name, path: "/booths/create-sized", requestId, session, size)
then
  RequestBoundary.respond (booth, requestId)
```

### Roam.DeleteBooth

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when RequestBoundary.request (booth, path: "/booths/delete", requestId, session)
then
  Sessioning.current (session)
```

### Roam.DeleteBooth#2

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.DeleteBooth
where
  earlier, RequestBoundary.request (booth, path: "/booths/delete", requestId, session)
then
  Exhibiting.verifyOwner (booth, organizer)
```

### Roam.DeleteBooth#3

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when Exhibiting.verifyOwner (booth, organizer), asked by Roam.DeleteBooth#2
then
  Calling.discardAt (place: booth)
```

### Roam.DeleteBooth#4

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when Calling.discardAt (place: booth), asked by Roam.DeleteBooth#3
then
  Queueing.discard (target: booth)
```

### Roam.DeleteBooth#5

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when Queueing.discard (target: booth), asked by Roam.DeleteBooth#4
where
  earlier, Sessioning.current (session, subject: organizer), asked by Roam.DeleteBooth
then
  Exhibiting.remove (booth, organizer)
```

### Roam.DeleteBooth#6

Authored path: `Roam.DeleteBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 51.

```reaction
when Exhibiting.remove (booth, organizer), asked by Roam.DeleteBooth#5
where
  earlier, RequestBoundary.request (booth, path: "/booths/delete", requestId, session)
then
  RequestBoundary.respond (deleted: true, requestId)
```

### Roam.DepartedGuestLeavesQueue

Authored path: `Roam.DepartedGuestLeavesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 143.

```reaction
when Navigating.leaveGuest (person)
where
  Queueing._targets (person) has (target)
then
  Queueing.leave (person, target)
```

### Roam.DepartedHostClosesCall

Authored path: `Roam.DepartedHostClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 129.

```reaction
when Navigating.leave (person)
where
  Calling._hostedBy (host: person) has (call, mode: "OPEN_GROUP")
then
  Calling.close (call, host: person)
```

### Roam.DepartedInviteHostPausesQueue

Authored path: `Roam.DepartedInviteHostPausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 132.

```reaction
when Navigating.leave (person)
where
  Calling._hostedBy (host: person) has (call, mode: "INVITE_ONLY", place: booth)
then
  Calling.suspend (call, host: person)
```

### Roam.DepartedInviteHostPausesQueue#2

Authored path: `Roam.DepartedInviteHostPausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 132.

```reaction
when Calling.suspend (call, host: person, place: booth), asked by Roam.DepartedInviteHostPausesQueue
then
  Queueing.pause (target: booth)
```

### Roam.DepartedVisitorLeavesQueue

Authored path: `Roam.DepartedVisitorLeavesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 141.

```reaction
when Navigating.leave (person)
where
  Queueing._targets (person) has (target)
then
  Queueing.leave (person, target)
```

### Roam.EditBooth

Authored path: `Roam.EditBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 25.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 47.

```reaction
when RequestBoundary.request (booth, description, name, path: "/booths/edit", requestId, session)
then
  Sessioning.current (session)
```

### Roam.EditBooth#2

Authored path: `Roam.EditBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 25.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 47.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.EditBooth
where
  earlier, RequestBoundary.request (booth, description, name, path: "/booths/edit", requestId, session)
then
  Exhibiting.edit (booth, description, name, organizer)
```

### Roam.EditBooth#3

Authored path: `Roam.EditBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 25.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 47.

```reaction
when Exhibiting.edit (booth, description, name, organizer), asked by Roam.EditBooth#2
where
  earlier, RequestBoundary.request (booth, description, name, path: "/booths/edit", requestId, session)
then
  RequestBoundary.respond (booth, requestId)
```

### Roam.EnterFair

Authored path: `Roam.EnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 3.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 22.

```reaction
when RequestBoundary.request (fair, path: "/fairs/enter", requestId, session)
where
  Hosting._exists (fair) has (exists: true)
then
  Sessioning.current (session)
```

### Roam.EnterFair#2

Authored path: `Roam.EnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 3.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 22.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.EnterFair
where
  earlier, RequestBoundary.request (fair, path: "/fairs/enter", requestId, session)
then
  Navigating.enter (person, position: (x: 0, y: 0), space: fair)
```

### Roam.EnterFair#3

Authored path: `Roam.EnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 3.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 22.

```reaction
when Navigating.enter (person, position: (x: 0, y: 0), space: fair), asked by Roam.EnterFair#2
where
  earlier, RequestBoundary.request (fair, path: "/fairs/enter", requestId, session)
then
  RequestBoundary.respond (position: (x: 0, y: 0), requestId)
```

### Roam.FairCodeNotFound

Authored path: `Roam.FairCodeNotFound`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 5.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 16.

```reaction
when RequestBoundary.request (code, path: "/fairs/by-code", requestId)
where
  Hosting._codeExists (code) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.FairNotFound

Authored path: `Roam.FairNotFound`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 10.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 15.

```reaction
when RequestBoundary.request (fair, path: "/fairs/page", requestId)
where
  Hosting._exists (fair) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.FreeHostExitsBoothClosesCall

Authored path: `Roam.FreeHostExitsBoothClosesCall`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 44.

```reaction
when Navigating.moveFree (person)
where
  Calling._hostedBy (host: person) has (call, mode: "OPEN_GROUP", place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  Calling.close (call, host: person)
```

### Roam.FreeHostExitsInviteBoothPausesQueue

Authored path: `Roam.FreeHostExitsInviteBoothPausesQueue`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 45.

```reaction
when Navigating.moveFree (person)
where
  Calling._hostedBy (host: person) has (call, mode: "INVITE_ONLY", place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  Calling.suspend (call, host: person)
```

### Roam.FreeHostExitsInviteBoothPausesQueue#2

Authored path: `Roam.FreeHostExitsInviteBoothPausesQueue`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 45.

```reaction
when Calling.suspend (call, host: person, place: booth), asked by Roam.FreeHostExitsInviteBoothPausesQueue
then
  Queueing.pause (target: booth)
```

### Roam.FreeReturnedRepresentativeResumesInviteCall

Authored path: `Roam.FreeReturnedRepresentativeResumesInviteCall`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 46.

```reaction
when Navigating.moveFree (person)
where
  Navigating._location (person) has (position, space)
  Exhibiting._at (position, space) has (booth)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Queueing._paused (target: booth) has (paused: true)
  Calling._suspendedAt (place: booth) has (suspended: true)
then
  Calling.resume (host: person, place: booth)
```

### Roam.FreeReturnedRepresentativeResumesInviteCall#2

Authored path: `Roam.FreeReturnedRepresentativeResumesInviteCall`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 46.

```reaction
when Calling.resume (host: person, place: booth, call), asked by Roam.FreeReturnedRepresentativeResumesInviteCall
then
  Queueing.resume (target: booth)
```

### Roam.GetBoothMeetingLink

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 49.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 97.

```reaction
when RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  Sessioning.current (session)
```

### Roam.GetBoothMeetingLink#2

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 49.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 97.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.GetBoothMeetingLink
where
  earlier, RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  Exhibiting.meetingLink (booth, person)
```

### Roam.GetBoothMeetingLink#3

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 49.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 97.

```reaction
when Exhibiting.meetingLink (booth, person, joinUrl), asked by Roam.GetBoothMeetingLink#2
where
  earlier, RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.GetBoothQueue

Authored path: `Roam.GetBoothQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 173.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 210.

```reaction
when RequestBoundary.request (booth, path: "/queues/booth", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  RequestBoundary.respond (queue: former "the waiting and invited visitors at (booth)" with (booth), requestId)
```

### Roam.GetBoothQueueNotRepresentative

Authored path: `Roam.GetBoothQueueNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 176.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 211.

```reaction
when RequestBoundary.request (booth, path: "/queues/booth", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._exists (booth) has (exists: true)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.GetFairPage

Authored path: `Roam.GetFairPage`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 8.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 14.

```reaction
when RequestBoundary.request (fair, path: "/fairs/page", requestId)
where
  Hosting._exists (fair) has (exists: true)
then
  RequestBoundary.respond (page: former "the fair page for (fair)" with (fair), requestId)
```

### Roam.GetMyQueueStatus

Authored path: `Roam.GetMyQueueStatus`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 166.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 208.

```reaction
when RequestBoundary.request (booth, path: "/queues/mine", requestId, session)
then
  Sessioning.current (session)
```

### Roam.GetMyQueueStatus#2

Authored path: `Roam.GetMyQueueStatus`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 166.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 208.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.GetMyQueueStatus
where
  earlier, RequestBoundary.request (booth, path: "/queues/mine", requestId, session)
then
  RequestBoundary.respond (requestId, status: former "the queue request of (person) at (booth)" with (booth, person))
```

### Roam.GetPresence

Authored path: `Roam.GetPresence`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 18.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 29.

```reaction
when RequestBoundary.request (fair, path: "/fairs/presence", requestId)
then
  RequestBoundary.respond (presence: former "the people in (fair)" with (fair), requestId)
```

### Roam.GroupCallClosesQueue

Authored path: `Roam.GroupCallClosesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 84.

```reaction
when Calling.open (host, mode: "OPEN_GROUP", place, call)
where
  Queueing._exists (target: place) has (exists: true)
then
  Queueing.close (target: place)
```

### Roam.GuestClaimInvitation

Authored path: `Roam.GuestClaimInvitation`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 191.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 222.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-claim-invitation", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, space)
  Queueing._invited (person, target: booth) has (invited: true)
  Calling._openAt (place: booth) has (call, mode: "INVITE_ONLY")
then
  Calling.join (call, person)
```

### Roam.GuestClaimInvitation#2

Authored path: `Roam.GuestClaimInvitation`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 191.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 222.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.GuestClaimInvitation
where
  earlier, RequestBoundary.request (booth, code, path: "/calls/guest-claim-invitation", requestId, token)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.GuestClaimInvitationNotInvited

Authored path: `Roam.GuestClaimInvitationNotInvited`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 199.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 223.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-claim-invitation", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, space)
  Queueing._invited (person, target: booth) has (invited: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.GuestEnterFair

Authored path: `Roam.GuestEnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 7.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 25.

```reaction
when RequestBoundary.request (fair, path: "/fairs/guest-enter", requestId, token)
where
  Hosting._exists (fair) has (exists: true)
then
  Navigating.enterGuest (space: fair, token)
```

### Roam.GuestEnterFair#2

Authored path: `Roam.GuestEnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 7.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 25.

```reaction
when Navigating.enterGuest (space: fair, token, person, position), asked by Roam.GuestEnterFair
where
  earlier, RequestBoundary.request (fair, path: "/fairs/guest-enter", requestId, token)
then
  RequestBoundary.respond (person, position, requestId)
```

### Roam.GuestEnterUnknownFair

Authored path: `Roam.GuestEnterUnknownFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 11.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 28.

```reaction
when RequestBoundary.request (fair, path: "/fairs/guest-enter", requestId, token)
where
  Hosting._exists (fair) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinCall

Authored path: `Roam.GuestJoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 35.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 109.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (call, mode: "OPEN_GROUP")
then
  Calling.join (call, person)
```

### Roam.GuestJoinCall#2

Authored path: `Roam.GuestJoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 35.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 109.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.GuestJoinCall
where
  earlier, RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.GuestJoinCallAbsent

Authored path: `Roam.GuestJoinCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 47.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 115.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestInSpace (space, token) has (present: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.GuestJoinCallClosed

Authored path: `Roam.GuestJoinCallClosed`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 45.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 113.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._isOpen (place: booth) has (open: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinCallInviteOnly

Authored path: `Roam.GuestJoinCallInviteOnly`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 41.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 110.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.GuestJoinCallOutside

Authored path: `Roam.GuestJoinCallOutside`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 46.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 114.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.GuestJoinCallUnknownFair

Authored path: `Roam.GuestJoinCallUnknownFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 43.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 111.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._codeExists (code) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinCallWrongBooth

Authored path: `Roam.GuestJoinCallWrongBooth`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 44.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 112.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinQueue

Authored path: `Roam.GuestJoinQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 162.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 205.

```reaction
when RequestBoundary.request (booth, code, path: "/queues/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, space)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  Queueing.join (person, target: booth)
```

### Roam.GuestJoinQueue#2

Authored path: `Roam.GuestJoinQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 162.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 205.

```reaction
when Queueing.join (person, target: booth, order), asked by Roam.GuestJoinQueue
where
  earlier, RequestBoundary.request (booth, code, path: "/queues/guest-join", requestId, token)
then
  RequestBoundary.respond (order, requestId)
```

### Roam.GuestLeaveFair

Authored path: `Roam.GuestLeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 10.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 27.

```reaction
when RequestBoundary.request (path: "/fairs/guest-leave", requestId, token)
then
  Navigating.leaveGuest (token)
```

### Roam.GuestLeaveFair#2

Authored path: `Roam.GuestLeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 10.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 27.

```reaction
when Navigating.leaveGuest (token, person), asked by Roam.GuestLeaveFair
where
  earlier, RequestBoundary.request (path: "/fairs/guest-leave", requestId, token)
then
  RequestBoundary.respond (left: true, requestId)
```

### Roam.GuestLeaveQueue

Authored path: `Roam.GuestLeaveQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 164.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 207.

```reaction
when RequestBoundary.request (booth, code, path: "/queues/guest-leave", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, space)
then
  Queueing.leave (person, target: booth)
```

### Roam.GuestLeaveQueue#2

Authored path: `Roam.GuestLeaveQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 164.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 207.

```reaction
when Queueing.leave (person, target: booth), asked by Roam.GuestLeaveQueue
where
  earlier, RequestBoundary.request (booth, code, path: "/queues/guest-leave", requestId, token)
then
  RequestBoundary.respond (left: true, requestId)
```

### Roam.GuestMove

Authored path: `Roam.GuestMove`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 8.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 26.

```reaction
when RequestBoundary.request (destination, path: "/fairs/guest-move", requestId, token)
where
  Navigating._guestLocation (token) has (person, position: previous, space)
  Exhibiting._walkable (from: previous, space, to: destination) has (walkable: true)
then
  Navigating.moveGuest (destination, token)
```

### Roam.GuestMove#2

Authored path: `Roam.GuestMove`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 8.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 26.

```reaction
when Navigating.moveGuest (destination, token, person, position), asked by Roam.GuestMove
where
  earlier, RequestBoundary.request (destination, path: "/fairs/guest-move", requestId, token)
then
  RequestBoundary.respond (person, position, requestId)
```

### Roam.GuestMoveBlocked

Authored path: `Roam.GuestMoveBlocked`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 34.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 51.

```reaction
when RequestBoundary.request (destination, path: "/fairs/guest-move", requestId, token)
where
  Navigating._guestLocation (token) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: false)
then
  RequestBoundary.respond (error: "INVALID_MOVE", requestId)
```

### Roam.GuestMoveFree

Authored path: `Roam.GuestMoveFree`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 27.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 55.

```reaction
when RequestBoundary.request (destination, path: "/fairs/guest-move-free", requestId, token)
where
  Navigating._guestLocation (token) has (person, position: previous, space)
  Exhibiting._walkable (from: previous, space, to: destination) has (walkable: true)
then
  Navigating.moveGuestFree (destination, token)
```

### Roam.GuestMoveFree#2

Authored path: `Roam.GuestMoveFree`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 27.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 55.

```reaction
when Navigating.moveGuestFree (destination, token, person, position), asked by Roam.GuestMoveFree
where
  earlier, RequestBoundary.request (destination, path: "/fairs/guest-move-free", requestId, token)
then
  RequestBoundary.respond (person, position, requestId)
```

### Roam.GuestMoveFreeBlocked

Authored path: `Roam.GuestMoveFreeBlocked`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 30.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 56.

```reaction
when RequestBoundary.request (destination, path: "/fairs/guest-move-free", requestId, token)
where
  Navigating._guestLocation (token) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: false)
then
  RequestBoundary.respond (error: "INVALID_MOVE", requestId)
```

### Roam.GuestMyQueueStatus

Authored path: `Roam.GuestMyQueueStatus`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 167.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 209.

```reaction
when RequestBoundary.request (booth, code, path: "/queues/guest-mine", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, space)
then
  RequestBoundary.respond (requestId, status: former "the queue request of (person) at (booth)" with (booth, person))
```

### Roam.HostExitsBoothClosesCall

Authored path: `Roam.HostExitsBoothClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 128.

```reaction
when Navigating.move (person)
where
  Calling._hostedBy (host: person) has (call, mode: "OPEN_GROUP", place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  Calling.close (call, host: person)
```

### Roam.HostExitsInviteBoothPausesQueue

Authored path: `Roam.HostExitsInviteBoothPausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 131.

```reaction
when Navigating.move (person)
where
  Calling._hostedBy (host: person) has (call, mode: "INVITE_ONLY", place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  Calling.suspend (call, host: person)
```

### Roam.HostExitsInviteBoothPausesQueue#2

Authored path: `Roam.HostExitsInviteBoothPausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 131.

```reaction
when Calling.suspend (call, host: person, place: booth), asked by Roam.HostExitsInviteBoothPausesQueue
then
  Queueing.pause (target: booth)
```

### Roam.InviteCallResumesQueue

Authored path: `Roam.InviteCallResumesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 83.

```reaction
when Calling.open (host, mode: "INVITE_ONLY", place, call)
where
  Queueing._exists (target: place) has (exists: true)
then
  Queueing.resume (target: place)
```

### Roam.InviteCallStartsQueue

Authored path: `Roam.InviteCallStartsQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 82.

```reaction
when Calling.open (host, mode: "INVITE_ONLY", place, call)
where
  Queueing._exists (target: place) has (exists: false)
then
  Queueing.open (target: place)
```

### Roam.InviteNext

Authored path: `Roam.InviteNext`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 186.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 217.

```reaction
when RequestBoundary.request (booth, path: "/queues/invite-next", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  Queueing.inviteNext (target: booth)
```

### Roam.InviteNext#2

Authored path: `Roam.InviteNext`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 186.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 217.

```reaction
when Queueing.inviteNext (target: booth, invitedUntil, person: visitor), asked by Roam.InviteNext
where
  earlier, RequestBoundary.request (booth, path: "/queues/invite-next", requestId, session)
then
  RequestBoundary.respond (invitedUntil, requestId, visitor)
```

### Roam.InviteNextNoSession

Authored path: `Roam.InviteNextNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 183.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 219.

```reaction
when RequestBoundary.request (booth, path: "/queues/invite-next", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.InviteNextNotRepresentative

Authored path: `Roam.InviteNextNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 180.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 218.

```reaction
when RequestBoundary.request (booth, path: "/queues/invite-next", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.JoinCall

Authored path: `Roam.JoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 34.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 107.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (call, mode: "OPEN_GROUP")
then
  Calling.join (call, person)
```

### Roam.JoinCall#2

Authored path: `Roam.JoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 34.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 107.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.JoinCall
where
  earlier, RequestBoundary.request (booth, path: "/calls/join", requestId, session)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.JoinCallAbsent

Authored path: `Roam.JoinCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 59.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 117.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._inSpace (person, space) has (present: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.JoinCallClosed

Authored path: `Roam.JoinCallClosed`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 60.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 118.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._isOpen (place: booth) has (open: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.JoinCallInviteOnly

Authored path: `Roam.JoinCallInviteOnly`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 40.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 108.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.JoinCallNoSession

Authored path: `Roam.JoinCallNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 64.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 120.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.JoinCallOutside

Authored path: `Roam.JoinCallOutside`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 58.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 116.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.JoinCallUnknownBooth

Authored path: `Roam.JoinCallUnknownBooth`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 62.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 119.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Exhibiting._exists (booth) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.JoinQueue

Authored path: `Roam.JoinQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 156.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 203.

```reaction
when RequestBoundary.request (booth, path: "/queues/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
  Navigating._inSpace (person, space) has (present: true)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  Queueing.join (person, target: booth)
```

### Roam.JoinQueue#2

Authored path: `Roam.JoinQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 156.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 203.

```reaction
when Queueing.join (person, target: booth, order), asked by Roam.JoinQueue
where
  earlier, RequestBoundary.request (booth, path: "/queues/join", requestId, session)
then
  RequestBoundary.respond (order, requestId)
```

### Roam.JoinQueueRepresentative

Authored path: `Roam.JoinQueueRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 160.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 204.

```reaction
when RequestBoundary.request (booth, path: "/queues/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.LeaveFair

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 24.

```reaction
when RequestBoundary.request (path: "/fairs/leave", requestId, session)
then
  Sessioning.current (session)
```

### Roam.LeaveFair#2

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 24.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.LeaveFair
then
  Navigating.leave (person)
```

### Roam.LeaveFair#3

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 24.

```reaction
when Navigating.leave (person), asked by Roam.LeaveFair#2
where
  earlier, RequestBoundary.request (path: "/fairs/leave", requestId, session)
then
  RequestBoundary.respond (left: true, requestId)
```

### Roam.LeaveQueue

Authored path: `Roam.LeaveQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 163.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 206.

```reaction
when RequestBoundary.request (booth, path: "/queues/leave", requestId, session)
then
  Sessioning.current (session)
```

### Roam.LeaveQueue#2

Authored path: `Roam.LeaveQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 163.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 206.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.LeaveQueue
where
  earlier, RequestBoundary.request (booth, path: "/queues/leave", requestId, session)
then
  Queueing.leave (person, target: booth)
```

### Roam.LeaveQueue#3

Authored path: `Roam.LeaveQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 163.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 206.

```reaction
when Queueing.leave (person, target: booth), asked by Roam.LeaveQueue#2
where
  earlier, RequestBoundary.request (booth, path: "/queues/leave", requestId, session)
then
  RequestBoundary.respond (left: true, requestId)
```

### Roam.ListPublicFairs

Authored path: `Roam.ListPublicFairs`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 10.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 18.

```reaction
when RequestBoundary.request (path: "/fairs/public", requestId)
then
  RequestBoundary.respond (directory: former "the public fair directory", requestId)
```

### Roam.ModeToGroupClosesQueue

Authored path: `Roam.ModeToGroupClosesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 89.

```reaction
when Calling.changeMode (call, host, mode: "OPEN_GROUP")
where
  Calling._hostedBy (host) has (call, place)
  Queueing._exists (target: place) has (exists: true)
then
  Queueing.close (target: place)
```

### Roam.ModeToInviteStartsQueue

Authored path: `Roam.ModeToInviteStartsQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 88.

```reaction
when Calling.changeMode (call, host, mode: "INVITE_ONLY")
where
  Calling._hostedBy (host) has (call, place)
then
  Queueing.open (target: place)
```

### Roam.Move

Authored path: `Roam.Move`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 4.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 23.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Navigating._location (person) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: true)
then
  Navigating.move (destination, person)
```

### Roam.Move#2

Authored path: `Roam.Move`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 4.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 23.

```reaction
when Navigating.move (destination, person), asked by Roam.Move
where
  earlier, RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
then
  RequestBoundary.respond (position: destination, requestId)
```

### Roam.MoveBlocked

Authored path: `Roam.MoveBlocked`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 33.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 49.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Navigating._location (person) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: false)
then
  RequestBoundary.respond (error: "INVALID_MOVE", requestId)
```

### Roam.MoveBooth

Authored path: `Roam.MoveBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 48.

```reaction
when RequestBoundary.request (booth, path: "/booths/move", position, requestId, session)
where
  Calling._isOpen (place: booth) has (open: false)
  Calling._suspendedAt (place: booth) has (suspended: false)
then
  Sessioning.current (session)
```

### Roam.MoveBooth#2

Authored path: `Roam.MoveBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 48.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.MoveBooth
where
  earlier, RequestBoundary.request (booth, path: "/booths/move", position, requestId, session)
then
  Exhibiting.move (booth, organizer, position)
```

### Roam.MoveBooth#3

Authored path: `Roam.MoveBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 48.

```reaction
when Exhibiting.move (booth, organizer, position), asked by Roam.MoveBooth#2
where
  earlier, RequestBoundary.request (booth, path: "/booths/move", position, requestId, session)
then
  RequestBoundary.respond (booth, requestId)
```

### Roam.MoveBoothDuringCall

Authored path: `Roam.MoveBoothDuringCall`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 37.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 49.

```reaction
when RequestBoundary.request (booth, path: "/booths/move", position, requestId, session)
where
  Sessioning._active (session) has (subject: organizer)
  Exhibiting._get (booth) has (organizer)
  Calling._isOpen (place: booth) has (open: true)
then
  RequestBoundary.respond (error: "PLACE_BUSY", requestId)
```

### Roam.MoveBoothWhilePaused

Authored path: `Roam.MoveBoothWhilePaused`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 38.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 50.

```reaction
when RequestBoundary.request (booth, path: "/booths/move", position, requestId, session)
where
  Sessioning._active (session) has (subject: organizer)
  Exhibiting._get (booth) has (organizer)
  Calling._suspendedAt (place: booth) has (suspended: true)
then
  RequestBoundary.respond (error: "PLACE_BUSY", requestId)
```

### Roam.MoveFree

Authored path: `Roam.MoveFree`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 26.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 52.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move-free", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Navigating._location (person) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: true)
then
  Navigating.moveFree (destination, person)
```

### Roam.MoveFree#2

Authored path: `Roam.MoveFree`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 26.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 52.

```reaction
when Navigating.moveFree (destination, person), asked by Roam.MoveFree
where
  earlier, RequestBoundary.request (destination, path: "/fairs/move-free", requestId, session)
then
  RequestBoundary.respond (position: destination, requestId)
```

### Roam.MoveFreeBlocked

Authored path: `Roam.MoveFreeBlocked`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 29.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 53.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move-free", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Navigating._location (person) has (position, space)
  Exhibiting._walkable (from: position, space, to: destination) has (walkable: false)
then
  RequestBoundary.respond (error: "INVALID_MOVE", requestId)
```

### Roam.MoveFreeNoSession

Authored path: `Roam.MoveFreeNoSession`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 31.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 54.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move-free", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.MoveNoSession

Authored path: `Roam.MoveNoSession`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 35.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 50.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.OpenCall

Authored path: `Roam.OpenCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 32.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 94.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  Calling.open (host: person, joinUrl, mode: "OPEN_GROUP", place: booth)
```

### Roam.OpenCall#2

Authored path: `Roam.OpenCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 32.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 94.

```reaction
when Calling.open (host: person, joinUrl, mode: "OPEN_GROUP", place: booth, call), asked by Roam.OpenCall
where
  earlier, RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
then
  RequestBoundary.respond (call, requestId)
```

### Roam.OpenCallAbsent

Authored path: `Roam.OpenCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 57.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 104.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._inSpace (person, space) has (present: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.OpenCallNoSession

Authored path: `Roam.OpenCallNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 63.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 106.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.OpenCallNotRepresentative

Authored path: `Roam.OpenCallNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 55.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 102.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._exists (booth) has (exists: true)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.OpenCallOutside

Authored path: `Roam.OpenCallOutside`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 56.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 103.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.OpenCallUnknownBooth

Authored path: `Roam.OpenCallUnknownBooth`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 61.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 105.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Exhibiting._exists (booth) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.OpenFairCode

Authored path: `Roam.OpenFairCode`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 4.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 15.

```reaction
when RequestBoundary.request (code, path: "/fairs/by-code", requestId)
where
  Hosting._byCode (code) has (fair)
then
  RequestBoundary.respond (fair, requestId)
```

### Roam.OpenInviteCall

Authored path: `Roam.OpenInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 81.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 95.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open-invite", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  Calling.open (host: person, joinUrl, mode: "INVITE_ONLY", place: booth)
```

### Roam.OpenInviteCall#2

Authored path: `Roam.OpenInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 81.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 95.

```reaction
when Calling.open (host: person, joinUrl, mode: "INVITE_ONLY", place: booth, call), asked by Roam.OpenInviteCall
where
  earlier, RequestBoundary.request (booth, joinUrl, path: "/calls/open-invite", requestId, session)
then
  RequestBoundary.respond (call, requestId)
```

### Roam.RemoveFromQueue

Authored path: `Roam.RemoveFromQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 175.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 215.

```reaction
when RequestBoundary.request (booth, path: "/queues/remove", requestId, session, visitor)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  Queueing.remove (person: visitor, target: booth)
```

### Roam.RemoveFromQueue#2

Authored path: `Roam.RemoveFromQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 175.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 215.

```reaction
when Queueing.remove (person: visitor, target: booth), asked by Roam.RemoveFromQueue
where
  earlier, RequestBoundary.request (booth, path: "/queues/remove", requestId, session, visitor)
then
  RequestBoundary.respond (removed: true, requestId)
```

### Roam.RemoveFromQueueNotRepresentative

Authored path: `Roam.RemoveFromQueueNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 177.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 216.

```reaction
when RequestBoundary.request (booth, path: "/queues/remove", requestId, session, visitor)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._exists (booth) has (exists: true)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Roam.RemoveRepresentative

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 30.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 54.

```reaction
when RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  Sessioning.current (session)
```

### Roam.RemoveRepresentative#2

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 30.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 54.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.RemoveRepresentative
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  Exhibiting.removeRepresentative (booth, organizer, representative)
```

### Roam.RemoveRepresentative#3

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 30.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 54.

```reaction
when Exhibiting.removeRepresentative (booth, organizer, representative), asked by Roam.RemoveRepresentative#2
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  RequestBoundary.respond (booth, representative, requestId)
```

### Roam.RemovedInviteRepresentativePausesQueue

Authored path: `Roam.RemovedInviteRepresentativePausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 127.

```reaction
when Exhibiting.removeRepresentative (booth, representative)
where
  Calling._openAt (place: booth) has (call, host: representative, mode: "INVITE_ONLY")
then
  Calling.suspend (call, host: representative)
```

### Roam.RemovedInviteRepresentativePausesQueue#2

Authored path: `Roam.RemovedInviteRepresentativePausesQueue`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 127.

```reaction
when Calling.suspend (call, host: representative, place: booth), asked by Roam.RemovedInviteRepresentativePausesQueue
then
  Queueing.pause (target: booth)
```

### Roam.RemovedRepresentativeClosesCall

Authored path: `Roam.RemovedRepresentativeClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 126.

```reaction
when Exhibiting.removeRepresentative (booth, representative)
where
  Calling._openAt (place: booth) has (call, host: representative, mode: "OPEN_GROUP")
then
  Calling.close (call, host: representative)
```

### Roam.ResumeInviteCall

Authored path: `Roam.ResumeInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 85.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 96.

```reaction
when RequestBoundary.request (booth, path: "/calls/resume-invite", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Queueing._paused (target: booth) has (paused: true)
  Calling._suspendedAt (place: booth) has (suspended: true)
then
  Calling.resume (host: person, place: booth)
```

### Roam.ResumeInviteCall#2

Authored path: `Roam.ResumeInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 85.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 96.

```reaction
when Calling.resume (host: person, place: booth, call), asked by Roam.ResumeInviteCall
then
  Queueing.resume (target: booth)
```

### Roam.ResumeInviteCall#3

Authored path: `Roam.ResumeInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 85.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 96.

```reaction
when Queueing.resume (target: booth), asked by Roam.ResumeInviteCall#2
where
  earlier, Calling.resume (host: person, place: booth, call), asked by Roam.ResumeInviteCall
  earlier, RequestBoundary.request (booth, path: "/calls/resume-invite", requestId, session)
then
  RequestBoundary.respond (call, requestId)
```

### Roam.ReturnedRepresentativeResumesInviteCall

Authored path: `Roam.ReturnedRepresentativeResumesInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 148.

```reaction
when Navigating.move (person)
where
  Navigating._location (person) has (position, space)
  Exhibiting._at (position, space) has (booth)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Queueing._paused (target: booth) has (paused: true)
  Calling._suspendedAt (place: booth) has (suspended: true)
then
  Calling.resume (host: person, place: booth)
```

### Roam.ReturnedRepresentativeResumesInviteCall#2

Authored path: `Roam.ReturnedRepresentativeResumesInviteCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 148.

```reaction
when Calling.resume (host: person, place: booth, call), asked by Roam.ReturnedRepresentativeResumesInviteCall
then
  Queueing.resume (target: booth)
```

### Roam.SetBoothMeetingLink

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 52.

```reaction
when RequestBoundary.request (booth, meetingUrl, path: "/booths/meeting-link/set", requestId, session)
then
  Sessioning.current (session)
```

### Roam.SetBoothMeetingLink#2

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 52.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.SetBoothMeetingLink
where
  earlier, RequestBoundary.request (booth, meetingUrl, path: "/booths/meeting-link/set", requestId, session)
then
  Exhibiting.setMeetingLink (booth, meetingUrl, organizer)
```

### Roam.SetBoothMeetingLink#3

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 52.

```reaction
when Exhibiting.setMeetingLink (booth, meetingUrl, organizer), asked by Roam.SetBoothMeetingLink#2
where
  earlier, RequestBoundary.request (booth, meetingUrl, path: "/booths/meeting-link/set", requestId, session)
then
  RequestBoundary.respond (booth, requestId)
```

### Roam.SetFairListing

Authored path: `Roam.SetFairListing`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 8.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 17.

```reaction
when RequestBoundary.request (fair, listed, path: "/fairs/listing", requestId, session)
then
  Sessioning.current (session)
```

### Roam.SetFairListing#2

Authored path: `Roam.SetFairListing`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 8.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 17.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.SetFairListing
where
  earlier, RequestBoundary.request (fair, listed, path: "/fairs/listing", requestId, session)
then
  Hosting.setListed (fair, listed, organizer)
```

### Roam.SetFairListing#3

Authored path: `Roam.SetFairListing`.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 8.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 17.

```reaction
when Hosting.setListed (fair, listed, organizer), asked by Roam.SetFairListing#2
where
  earlier, RequestBoundary.request (fair, listed, path: "/fairs/listing", requestId, session)
then
  RequestBoundary.respond (fair, listed, requestId)
```

### Roam.SetQueueAccepting

Authored path: `Roam.SetQueueAccepting`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 174.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 212.

```reaction
when RequestBoundary.request (accepting, booth, path: "/queues/accepting", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (mode: "INVITE_ONLY")
then
  Queueing.setAccepting (accepting, target: booth)
```

### Roam.SetQueueAccepting#2

Authored path: `Roam.SetQueueAccepting`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 174.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 212.

```reaction
when Queueing.setAccepting (accepting, target: booth), asked by Roam.SetQueueAccepting
where
  earlier, RequestBoundary.request (accepting, booth, path: "/queues/accepting", requestId, session)
then
  RequestBoundary.respond (accepting, requestId)
```

### Roam.SetQueueAcceptingNoSession

Authored path: `Roam.SetQueueAcceptingNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 182.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 214.

```reaction
when RequestBoundary.request (accepting, booth, path: "/queues/accepting", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.SetQueueAcceptingNotRepresentative

Authored path: `Roam.SetQueueAcceptingNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 179.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 213.

```reaction
when RequestBoundary.request (accepting, booth, path: "/queues/accepting", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: false)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Sessions.CurrentUser

Authored path: `Sessions.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 16.
- Covered by [Sessions](../design/compositions/Sessions.md), line 21.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Sessions.CurrentUser#2

Authored path: `Sessions.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 16.
- Covered by [Sessions](../design/compositions/Sessions.md), line 21.

```reaction
when Sessioning.current (session, subject: account), asked by Sessions.CurrentUser
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (account, requestId)
```

### Sessions.Register

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### Sessions.Register#2

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when Authenticating.register (password, username, account), asked by Sessions.Register
then
  Sessioning.start (subject: account)
```

### Sessions.Register#3

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.SignIn

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  Authenticating.authenticate (password, username)
```

### Sessions.SignIn#2

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Authenticating.authenticate (password, username, account), asked by Sessions.SignIn
then
  Sessioning.start (subject: account)
```

### Sessions.SignIn#3

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.SignIn#2
where
  earlier, RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.SignOut

Authored path: `Sessions.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 18.
- Covered by [Sessions](../design/compositions/Sessions.md), line 22.

```reaction
when RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  Sessioning.end (session)
```

### Sessions.SignOut#2

Authored path: `Sessions.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 18.
- Covered by [Sessions](../design/compositions/Sessions.md), line 22.

```reaction
when Sessioning.end (session, ended), asked by Sessions.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  RequestBoundary.respond (ended, requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/current` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/auth/sign-in` — requires `username`, `password`
- `/auth/sign-out` — requires `session`
- `/booths/create` — requires `session`, `fair`, `footprint`, `name`, `description`, `meetingUrl`
- `/booths/create-sized` — requires `session`, `fair`, `size`, `name`, `description`, `meetingUrl`
- `/booths/delete` — requires `session`, `booth`
- `/booths/edit` — requires `session`, `booth`, `name`, `description`
- `/booths/meeting-link` — requires `session`, `booth`
- `/booths/meeting-link/set` — requires `session`, `booth`, `meetingUrl`
- `/booths/move` — requires `session`, `booth`, `position`
- `/booths/representatives/add` — requires `session`, `booth`, `representative`
- `/booths/representatives/remove` — requires `session`, `booth`, `representative`
- `/calls/claim-invitation` — requires `session`, `booth`
- `/calls/close` — requires `session`, `call`
- `/calls/guest-claim-invitation` — requires `code`, `booth`, `token`
- `/calls/guest-join` — requires `code`, `booth`, `token`
- `/calls/join` — requires `session`, `booth`
- `/calls/mode` — requires `session`, `call`, `mode`, `joinUrl`
- `/calls/open` — requires `session`, `booth`, `joinUrl`
- `/calls/open-invite` — requires `session`, `booth`, `joinUrl`
- `/calls/resume-invite` — requires `session`, `booth`
- `/fairs/by-code` — requires `code`
- `/fairs/create` — requires `session`, `name`
- `/fairs/enter` — requires `session`, `fair`
- `/fairs/guest-enter` — requires `fair`, `token`
- `/fairs/guest-leave` — requires `token`
- `/fairs/guest-move` — requires `token`, `destination`
- `/fairs/guest-move-free` — requires `token`, `destination`
- `/fairs/leave` — requires `session`
- `/fairs/listing` — requires `session`, `fair`, `listed`
- `/fairs/move` — requires `session`, `destination`
- `/fairs/move-free` — requires `session`, `destination`
- `/fairs/page` — requires `fair`
- `/fairs/presence` — requires `fair`
- `/queues/accepting` — requires `session`, `booth`, `accepting`
- `/queues/booth` — requires `session`, `booth`
- `/queues/guest-join` — requires `code`, `booth`, `token`
- `/queues/guest-leave` — requires `code`, `booth`, `token`
- `/queues/guest-mine` — requires `code`, `booth`, `token`
- `/queues/invite-next` — requires `session`, `booth`
- `/queues/join` — requires `session`, `booth`
- `/queues/leave` — requires `session`, `booth`
- `/queues/mine` — requires `session`, `booth`
- `/queues/remove` — requires `session`, `booth`, `visitor`
- `/reservations/cancel` — requires `reservation`
- `/reservations/reserve` — requires `user`, `resource`
