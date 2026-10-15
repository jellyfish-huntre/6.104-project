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

- `open(host: Person, place: Place, joinUrl: String) : returns (call: Call)`
  - Refuses `INVALID_URL`: Enter a valid call link.
  - Refuses `PLACE_BUSY`: A call is already open here.
  - Refuses `HOST_BUSY`: This host already has an open call.
- `join(person: Person, call: Call) : returns (joinUrl: String)`
  - Refuses `NOT_FOUND`: That call is no longer open.
- `close(host: Person, call: Call) : returns ()`
  - Refuses `NOT_FOUND`: That call is not found.

#### Queries

- `_openAt(place: Place) : optional (call: Call, place: Place, host: Person)`
- `_hostedBy(host: Person) : optional (call: Call, place: Place)`
- `_isOpen(place: Place) : one (open: Flag)`

#### Instances

- `Calling` — instance of `Calling` — [Application types](../design/types.md), line 54.
  - `Person` is `Authenticating.Account` — [Application types](../design/types.md), line 55.
  - `Place` is `Exhibiting.Booth` — [Application types](../design/types.md), line 56.

### Exhibiting

Defined in [Exhibiting](../design/concepts/Exhibiting.md), line 1.

#### Actions

- `create(organizer: Person, space: Space, footprint: Footprint, name: String, description: String, meetingUrl: String) : returns (booth: Booth)`
  - Refuses `INVALID_NAME`: That booth name is not valid.
  - Refuses `INVALID_URL`: Enter a valid meeting link.
  - Refuses `INVALID_FOOTPRINT`: That booth area is not valid.
  - Refuses `AREA_OCCUPIED`: That booth area overlaps another booth.
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
- `leave(person: Person) : returns ()`
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `enterGuest(token: GuestToken, space: Space) : returns (person: Person, position: Position)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
- `moveGuest(token: GuestToken, destination: Position) : returns (person: Person, position: Position)`
  - Refuses `INVALID_GUEST_TOKEN`: Use a valid guest token.
  - Refuses `INVALID_MOVE`: Move one cell within the fair.
  - Refuses `NOT_PRESENT`: That person is not in a space.
- `leaveGuest(token: GuestToken) : returns ()`
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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 32.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 6.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 3.
- Covered by [Student discovery](../design/compositions/StudentDiscovery.md), line 21.

```former
Former "the fair page for (fair)" — inputs (fair); bindings (name, organizer, code, listed, booth, boothName, description, footprint, meetingLinkSaved, representative, call, host); promises exactly one record — forms:
  a record of
    where Hosting._get (fair) has (code, listed, name, organizer)
    booths: each Exhibiting._in (space: fair) has (booth, description, footprint, meetingLinkSaved, name: boothName)
      form a record of
        booth
        calls: each Calling._openAt (place: booth) has (call, host)
          form a record of
            call
            host
        description
        footprint
        meetingLinkSaved
        name: boothName
        representatives: each Exhibiting._representatives (booth) has (representative)
          form a record of
            representative
    code
    fair
    listed
    name
    organizer
```

### the people in (fair)

Authored path: `Roam.FairPresence`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 15.

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
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 35.

```reaction
when RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  Sessioning.current (session)
```

### Roam.AddRepresentative#2

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 35.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.AddRepresentative
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  Authenticating.verifyRegistered (username: representative)
```

### Roam.AddRepresentative#3

Authored path: `Roam.AddRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 35.

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
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 27.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 35.

```reaction
when Exhibiting.addRepresentative (booth, organizer, representative), asked by Roam.AddRepresentative#3
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/add", representative, requestId, session)
then
  RequestBoundary.respond (booth, representative, requestId)
```

### Roam.CloseCall

Authored path: `Roam.CloseCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 33.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 77.

```reaction
when RequestBoundary.request (call, path: "/calls/close", requestId, session)
then
  Sessioning.current (session)
```

### Roam.CloseCall#2

Authored path: `Roam.CloseCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 33.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 77.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.CloseCall
where
  earlier, RequestBoundary.request (call, path: "/calls/close", requestId, session)
then
  Calling.close (call, host: person)
```

### Roam.CloseCall#3

Authored path: `Roam.CloseCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 33.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 77.

```reaction
when Calling.close (call, host: person), asked by Roam.CloseCall#2
where
  earlier, RequestBoundary.request (call, path: "/calls/close", requestId, session)
then
  RequestBoundary.respond (closed: true, requestId)
```

### Roam.CreateBooth

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 32.

```reaction
when RequestBoundary.request (description, fair, footprint, meetingUrl, name, path: "/booths/create", requestId, session)
then
  Sessioning.current (session)
```

### Roam.CreateBooth#2

Authored path: `Roam.CreateBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 18.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 32.

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
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 32.

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
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 32.

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

### Roam.DepartedHostClosesCall

Authored path: `Roam.DepartedHostClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 82.

```reaction
when Navigating.leave (person)
where
  Calling._hostedBy (host: person) has (call)
then
  Calling.close (call, host: person)
```

### Roam.EditBooth

Authored path: `Roam.EditBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 25.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.

```reaction
when RequestBoundary.request (booth, description, name, path: "/booths/edit", requestId, session)
then
  Sessioning.current (session)
```

### Roam.EditBooth#2

Authored path: `Roam.EditBooth`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 25.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.

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
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 33.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 18.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 18.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 18.

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

### Roam.GetBoothMeetingLink

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 40.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 59.

```reaction
when RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  Sessioning.current (session)
```

### Roam.GetBoothMeetingLink#2

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 40.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 59.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.GetBoothMeetingLink
where
  earlier, RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  Exhibiting.meetingLink (booth, person)
```

### Roam.GetBoothMeetingLink#3

Authored path: `Roam.GetBoothMeetingLink`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 40.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 59.

```reaction
when Exhibiting.meetingLink (booth, person, joinUrl), asked by Roam.GetBoothMeetingLink#2
where
  earlier, RequestBoundary.request (booth, path: "/booths/meeting-link", requestId, session)
then
  RequestBoundary.respond (joinUrl, requestId)
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

### Roam.GetPresence

Authored path: `Roam.GetPresence`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 14.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 25.

```reaction
when RequestBoundary.request (fair, path: "/fairs/presence", requestId)
then
  RequestBoundary.respond (presence: former "the people in (fair)" with (fair), requestId)
```

### Roam.GuestEnterFair

Authored path: `Roam.GuestEnterFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 7.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 21.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 21.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 24.

```reaction
when RequestBoundary.request (fair, path: "/fairs/guest-enter", requestId, token)
where
  Hosting._exists (fair) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinCall

Authored path: `Roam.GuestJoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 31.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 66.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: true)
  Navigating._guestLocation (token) has (person, position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (call)
then
  Calling.join (call, person)
```

### Roam.GuestJoinCall#2

Authored path: `Roam.GuestJoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 31.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 66.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.GuestJoinCall
where
  earlier, RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.GuestJoinCallAbsent

Authored path: `Roam.GuestJoinCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 38.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 71.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 36.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 69.

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

### Roam.GuestJoinCallOutside

Authored path: `Roam.GuestJoinCallOutside`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 37.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 70.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 34.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 67.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._codeExists (code) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestJoinCallWrongBooth

Authored path: `Roam.GuestJoinCallWrongBooth`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 35.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 68.

```reaction
when RequestBoundary.request (booth, code, path: "/calls/guest-join", requestId, token)
where
  Hosting._byCode (code) has (fair: space)
  Exhibiting._inSpace (booth, space) has (inSpace: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GuestLeaveFair

Authored path: `Roam.GuestLeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 10.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 23.

```reaction
when RequestBoundary.request (path: "/fairs/guest-leave", requestId, token)
then
  Navigating.leaveGuest (token)
```

### Roam.GuestLeaveFair#2

Authored path: `Roam.GuestLeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 10.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 23.

```reaction
when Navigating.leaveGuest (token), asked by Roam.GuestLeaveFair
where
  earlier, RequestBoundary.request (path: "/fairs/guest-leave", requestId, token)
then
  RequestBoundary.respond (left: true, requestId)
```

### Roam.GuestMove

Authored path: `Roam.GuestMove`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 8.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 22.

```reaction
when RequestBoundary.request (destination, path: "/fairs/guest-move", requestId, token)
then
  Navigating.moveGuest (destination, token)
```

### Roam.GuestMove#2

Authored path: `Roam.GuestMove`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 8.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 22.

```reaction
when Navigating.moveGuest (destination, token, person, position), asked by Roam.GuestMove
where
  earlier, RequestBoundary.request (destination, path: "/fairs/guest-move", requestId, token)
then
  RequestBoundary.respond (person, position, requestId)
```

### Roam.HostExitsBoothClosesCall

Authored path: `Roam.HostExitsBoothClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 81.

```reaction
when Navigating.move (person)
where
  Calling._hostedBy (host: person) has (call, place: booth)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: false)
then
  Calling.close (call, host: person)
```

### Roam.JoinCall

Authored path: `Roam.JoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 30.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 65.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
  Calling._openAt (place: booth) has (call)
then
  Calling.join (call, person)
```

### Roam.JoinCall#2

Authored path: `Roam.JoinCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 30.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 65.

```reaction
when Calling.join (call, person, joinUrl), asked by Roam.JoinCall
where
  earlier, RequestBoundary.request (booth, path: "/calls/join", requestId, session)
then
  RequestBoundary.respond (joinUrl, requestId)
```

### Roam.JoinCallAbsent

Authored path: `Roam.JoinCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 50.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 73.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 51.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 74.

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

### Roam.JoinCallNoSession

Authored path: `Roam.JoinCallNoSession`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 55.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 76.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.JoinCallOutside

Authored path: `Roam.JoinCallOutside`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 49.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 72.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 53.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 75.

```reaction
when RequestBoundary.request (booth, path: "/calls/join", requestId, session)
where
  Exhibiting._exists (booth) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.LeaveFair

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 20.

```reaction
when RequestBoundary.request (path: "/fairs/leave", requestId, session)
then
  Sessioning.current (session)
```

### Roam.LeaveFair#2

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 20.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.LeaveFair
then
  Navigating.leave (person)
```

### Roam.LeaveFair#3

Authored path: `Roam.LeaveFair`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 5.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 20.

```reaction
when Navigating.leave (person), asked by Roam.LeaveFair#2
where
  earlier, RequestBoundary.request (path: "/fairs/leave", requestId, session)
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

### Roam.Move

Authored path: `Roam.Move`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 4.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 19.

```reaction
when RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
then
  Sessioning.current (session)
```

### Roam.Move#2

Authored path: `Roam.Move`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 4.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 19.

```reaction
when Sessioning.current (session, subject: person), asked by Roam.Move
where
  earlier, RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
then
  Navigating.move (destination, person)
```

### Roam.Move#3

Authored path: `Roam.Move`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 4.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 19.

```reaction
when Navigating.move (destination, person), asked by Roam.Move#2
where
  earlier, RequestBoundary.request (destination, path: "/fairs/move", requestId, session)
then
  RequestBoundary.respond (position: destination, requestId)
```

### Roam.OpenCall

Authored path: `Roam.OpenCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 28.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 58.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._active (session) has (subject: person)
  Exhibiting._isRepresentative (booth, representative: person) has (assigned: true)
  Exhibiting._get (booth) has (space)
  Navigating._location (person) has (position, space)
  Exhibiting._contains (booth, position) has (contains: true)
then
  Calling.open (host: person, joinUrl, place: booth)
```

### Roam.OpenCall#2

Authored path: `Roam.OpenCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 28.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 58.

```reaction
when Calling.open (host: person, joinUrl, place: booth, call), asked by Roam.OpenCall
where
  earlier, RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
then
  RequestBoundary.respond (call, requestId)
```

### Roam.OpenCallAbsent

Authored path: `Roam.OpenCallAbsent`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 48.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 62.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 54.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 64.

```reaction
when RequestBoundary.request (booth, joinUrl, path: "/calls/open", requestId, session)
where
  Sessioning._isActive (session) has (active: false)
then
  RequestBoundary.respond (error: "UNKNOWN_SESSION", requestId)
```

### Roam.OpenCallNotRepresentative

Authored path: `Roam.OpenCallNotRepresentative`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 46.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 60.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 47.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 61.

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
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 52.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 63.

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

### Roam.RemoveRepresentative

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 36.

```reaction
when RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  Sessioning.current (session)
```

### Roam.RemoveRepresentative#2

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 36.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.RemoveRepresentative
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  Exhibiting.removeRepresentative (booth, organizer, representative)
```

### Roam.RemoveRepresentative#3

Authored path: `Roam.RemoveRepresentative`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 28.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 36.

```reaction
when Exhibiting.removeRepresentative (booth, organizer, representative), asked by Roam.RemoveRepresentative#2
where
  earlier, RequestBoundary.request (booth, path: "/booths/representatives/remove", representative, requestId, session)
then
  RequestBoundary.respond (booth, representative, requestId)
```

### Roam.RemovedRepresentativeClosesCall

Authored path: `Roam.RemovedRepresentativeClosesCall`.
- Covered by [Roam calling](../design/compositions/RoamCalling.md), line 80.

```reaction
when Exhibiting.removeRepresentative (booth, representative)
where
  Calling._openAt (place: booth) has (call, host: representative)
then
  Calling.close (call, host: representative)
```

### Roam.SetBoothMeetingLink

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 34.

```reaction
when RequestBoundary.request (booth, meetingUrl, path: "/booths/meeting-link/set", requestId, session)
then
  Sessioning.current (session)
```

### Roam.SetBoothMeetingLink#2

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 34.

```reaction
when Sessioning.current (session, subject: organizer), asked by Roam.SetBoothMeetingLink
where
  earlier, RequestBoundary.request (booth, meetingUrl, path: "/booths/meeting-link/set", requestId, session)
then
  Exhibiting.setMeetingLink (booth, meetingUrl, organizer)
```

### Roam.SetBoothMeetingLink#3

Authored path: `Roam.SetBoothMeetingLink`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 26.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 34.

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
- `/booths/edit` — requires `session`, `booth`, `name`, `description`
- `/booths/meeting-link` — requires `session`, `booth`
- `/booths/meeting-link/set` — requires `session`, `booth`, `meetingUrl`
- `/booths/representatives/add` — requires `session`, `booth`, `representative`
- `/booths/representatives/remove` — requires `session`, `booth`, `representative`
- `/calls/close` — requires `session`, `call`
- `/calls/guest-join` — requires `code`, `booth`, `token`
- `/calls/join` — requires `session`, `booth`
- `/calls/open` — requires `session`, `booth`, `joinUrl`
- `/fairs/by-code` — requires `code`
- `/fairs/create` — requires `session`, `name`
- `/fairs/enter` — requires `session`, `fair`
- `/fairs/guest-enter` — requires `fair`, `token`
- `/fairs/guest-leave` — requires `token`
- `/fairs/guest-move` — requires `token`, `destination`
- `/fairs/leave` — requires `session`
- `/fairs/listing` — requires `session`, `fair`, `listed`
- `/fairs/move` — requires `session`, `destination`
- `/fairs/page` — requires `fair`
- `/fairs/presence` — requires `fair`
- `/reservations/cancel` — requires `reservation`
- `/reservations/reserve` — requires `user`, `resource`
