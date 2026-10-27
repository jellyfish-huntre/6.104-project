# Navigating

## Purpose

Keep track of where people are in a shared space, so others can see who is present and where they have moved.

## Principle

A visitor enters a space at its entrance. As the visitor moves into a booth's area, their position changes for everyone viewing the space. Signed-in people use their account identity. Guests use a private random token, which Navigating turns into a public pseudonym. Guest presence expires after 30 seconds without a refresh; the token itself is never returned in the public presence list.

Free walking uses fractional cell coordinates. Each update is limited by distance and elapsed time. The composition checks the path against the current hall boundary and obstacles. The original one-cell action remains for older clients.

## Types

```types
external Person
  The person moving through a space.

external Space
  The space the person enters.

external Position
  A location within the space; the application chooses its coordinate system and allowed moves.

external GuestToken
  A private, random browser token used to recognize a guest without an account.
```

## State

```state
a set of Presences with
  a unique person Person
  a space Space
  a position Position
  an optional guestSeenAt String
  an optional movedAt String

Rule: Guest presences are visible for 30 seconds after their most recent enter or move.
Rule: movedAt bounds the rate of free-walking updates; older presences can begin free walking.
```

## Actions

```actions
enter(person: Person, space: Space, position: Position) : returns ()
  where person is already present
  then
    refuses ALREADY_PRESENT "That person is already in a space."
  where person is not present
  then
    add a presence with person, space, and position
    returns

move(person: Person, destination: Position) : returns ()
  where person is present and destination is outside the space's grid or not one orthogonal step away
  then
    refuses INVALID_MOVE "Move one cell within the fair."
  where person is present and destination is one orthogonal step away within the grid
  then
    changes the person's position to destination
    returns
  where person is not present
  then
    refuses NOT_PRESENT "That person is not in a space."

moveFree(person: Person, destination: Position) : returns ()
  where person is present and destination is within the map and reachable at walking speed
  then
    change the person's position and update the last movement time
    returns
  where person is present and destination has a negative coordinate or is too far for elapsed time
  then
    refuses INVALID_MOVE "That movement is too far or outside the fair."
  where person is not present
  then
    refuses NOT_PRESENT "That person is not in a space."

leave(person: Person) : returns ()
  where person is present
  then
    remove the person's presence
    returns
  where person is not present
  then
    refuses NOT_PRESENT "That person is not in a space."

enterGuest(token: GuestToken, space: Space) : returns (person: Person, position: Position)
  where token is invalid
  then
    refuses INVALID_GUEST_TOKEN "Use a valid guest token."
  where the guest is already active in space
  then
    refresh the guest's presence without changing its position
    returns person, position
  where the guest is absent or in another space
  then
    record the guest at the entrance of space
    returns person, position

moveGuest(token: GuestToken, destination: Position) : returns (person: Person, position: Position)
  where token is invalid
  then
    refuses INVALID_GUEST_TOKEN "Use a valid guest token."
  where the guest is active and destination is one orthogonal step away within the grid
  then
    change the guest's position and refresh its presence
    returns person, position
  where the guest is active and destination is not a valid step
  then
    refuses INVALID_MOVE "Move one cell within the fair."
  where the guest is absent or expired
  then
    refuses NOT_PRESENT "That person is not in a space."

moveGuestFree(token: GuestToken, destination: Position) : returns (person: Person, position: Position)
  where token identifies an active guest and destination is within the map and reachable at walking speed
  then
    change the guest's position, refresh its presence, and update the last movement time
    returns person, position
  where token is invalid
  then
    refuses INVALID_GUEST_TOKEN "Use a valid guest token."
  where token identifies an active guest and destination is outside the map or too far for elapsed time
  then
    refuses INVALID_MOVE "That movement is too far or outside the fair."
  where the guest is absent or expired
  then
    refuses NOT_PRESENT "That person is not in a space."

leaveGuest(token: GuestToken) : returns (person: Person)
  where token is invalid
  then
    refuses INVALID_GUEST_TOKEN "Use a valid guest token."
  where the guest is active
  then
    remove the guest's presence
    returns person
  where the guest is absent
  then
    refuses NOT_PRESENT "That person is not in a space."
```

## Queries

```queries
_location(person: Person) : optional (person: Person, space: Space, position: Position)
  Gets the person's current space and position, and no row when they are absent.

_present(space: Space) : many (person: Person, position: Position)
  Gets everyone in a space and their positions, and no rows when the space is empty.

_inSpace(person: Person, space: Space) : one (present: Flag)
  Answers whether the person is currently in the space.

_guestLocation(token: GuestToken) : optional (person: Person, space: Space, position: Position)
  Gets the active guest's location from its private token, and no row when absent or expired.

_guestInSpace(token: GuestToken, space: Space) : one (present: Flag)
  Answers whether the guest token has an active presence in the space.
```
