<!-- Generated from the Roam assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Roam — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Hosting

Defined in [Hosting](../design/concepts/Hosting.md), line 1.

#### Actions

- `create(organizer: Person, name: String) : returns (fair: Fair)`
  - Refuses `INVALID_NAME`: That name is not valid.
- `edit(organizer: Person, fair: Fair, name: String) : returns ()`
  - Refuses `NOT_FOUND`: That fair is not found
  - Refuses `INVALID_NAME`: That name is not valid.

#### Queries

- `_get(fair: Fair) : optional (fair: Fair, name: String, organizer: Person)`
- `_exists(fair: Fair) : one (exists: Flag)`

#### Instances

- `Hosting` — instance of `Hosting` — [Application types](../design/types.md), line 23.
  - `Person` is `Person` — [Application types](../design/types.md), line 24.

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

- `Reserving` — instance of `Reserving` — [Application types](../design/types.md), line 19.
  - `Resource` is `Table` — [Application types](../design/types.md), line 21.
  - `User` is `Name` — [Application types](../design/types.md), line 20.

## Application types

Concrete types:

- `Name` — [Application types](../design/types.md), line 7.
- `Person` — [Application types](../design/types.md), line 13.
- `Table` — [Application types](../design/types.md), line 10.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the fair page for (fair)

Authored path: `Roam.FairPage`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 4.

```former
Former "the fair page for (fair)" — inputs (fair); bindings (name, organizer); promises exactly one record — forms:
  a record of
    where Hosting._get (fair) has (name, organizer)
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

### Roam.CreateFair

Authored path: `Roam.CreateFair`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 3.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 10.

```reaction
when RequestBoundary.request (name, organizer, path: "/fairs/create", requestId)
then
  Hosting.create (name, organizer)
```

### Roam.CreateFair#2

Authored path: `Roam.CreateFair`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 3.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 10.

```reaction
when Hosting.create (name, organizer, fair), asked by Roam.CreateFair
where
  earlier, RequestBoundary.request (name, organizer, path: "/fairs/create", requestId)
then
  RequestBoundary.respond (fair, requestId)
```

### Roam.FairNotFound

Authored path: `Roam.FairNotFound`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 7.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 12.

```reaction
when RequestBoundary.request (fair, path: "/fairs/page", requestId)
where
  Hosting._exists (fair) has (exists: false)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### Roam.GetFairPage

Authored path: `Roam.GetFairPage`.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 5.
- Covered by [Roam Hosting](../design/compositions/RoamHosting.md), line 11.

```reaction
when RequestBoundary.request (fair, path: "/fairs/page", requestId)
where
  Hosting._exists (fair) has (exists: true)
then
  RequestBoundary.respond (page: former "the fair page for (fair)" with (fair), requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/fairs/create` — requires `organizer`, `name`
- `/fairs/page` — requires `fair`
- `/reservations/cancel` — requires `reservation`
- `/reservations/reserve` — requires `user`, `resource`
