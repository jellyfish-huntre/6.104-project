# Exhibiting

## Purpose

Let organizers place booths in a space and assign people to represent them, so visitors can find the organizations and people taking part.

## Principle

An organizer creates a booth spanning several cells and becomes its first representative. The organizer can add other representatives. A visitor can stand inside the booth, read its description, and see who represents it. The organizer can correct the description or remove a representative later. Another booth cannot overlap its area.

## Types

```types
external Person
  The organizer or representative identified outside this concept.

external Space
  The space in which a booth is placed.

external Position
  A location used to find which booth contains a person.

external Footprint
  A rectangular area described by a top-left coordinate, width, and height.
```

## State

```state
a set of Booths with
  a space Space
  a footprint Footprint
  a name String
  a description String
  an organizer Person
  a meetingUrl String

Rule: An empty meetingUrl means no link is saved; saving one does not open a call.

Rule: Booth footprints in the same space do not overlap.

a set of Assignments with
  a booth Booth
  a representative Person
  unique booth and representative
```

## Actions

```actions
create(organizer: Person, space: Space, footprint: Footprint, name: String, description: String, meetingUrl: String) : returns (booth: Booth)
  where name is empty
  then
    refuses INVALID_NAME "That booth name is not valid."
  where name is nonempty and meetingUrl is neither empty nor a valid HTTP or HTTPS URL
  then
    refuses INVALID_URL "Enter a valid meeting link."
  where name is nonempty and footprint has nonpositive width or height
  then
    refuses INVALID_FOOTPRINT "That booth area is not valid."
  where name is nonempty and footprint has positive width and height and overlaps another booth in space
  then
    refuses AREA_OCCUPIED "That booth area overlaps another booth."
  where name is nonempty and footprint has positive width and height and does not overlap another booth in space
  then
    add a new booth with organizer, space, footprint, name, description, and meetingUrl
    add an assignment with booth and organizer as representative
    returns booth

edit(organizer: Person, booth: Booth, name: String, description: String) : returns ()
  where name is empty
  then
    refuses INVALID_NAME "That booth name is not valid."
  where name is nonempty and booth exists and organizer owns it
  then
    changes the booth's name and description
    returns
  where name is nonempty and (booth does not exist or organizer does not own it)
  then
    refuses NOT_FOUND "That booth is not found."

addRepresentative(organizer: Person, booth: Booth, representative: Person) : returns ()
  where booth does not exist or organizer does not own it
  then
    refuses NOT_FOUND "That booth is not found."
  where booth exists and organizer owns it and representative is already assigned
  then
    refuses ALREADY_ASSIGNED "That person already represents this booth."
  where booth exists and organizer owns it and representative is not assigned
  then
    add an assignment with booth and representative
    returns

removeRepresentative(organizer: Person, booth: Booth, representative: Person) : returns ()
  where booth does not exist or organizer does not own it
  then
    refuses NOT_FOUND "That booth is not found."
  where booth exists and organizer owns it and representative is not assigned
  then
    refuses NOT_ASSIGNED "That person does not represent this booth."
  where booth exists and organizer owns it and representative is assigned
  then
    remove the assignment with booth and representative
    returns

setMeetingLink(organizer: Person, booth: Booth, meetingUrl: String) : returns ()
  where meetingUrl is neither empty nor a valid HTTP or HTTPS URL
  then
    refuses INVALID_URL "Enter a valid meeting link."
  where meetingUrl is valid or empty and booth exists and organizer owns it
  then
    changes the booth's saved meeting link
    returns
  where meetingUrl is valid or empty and (booth does not exist or organizer does not own it)
  then
    refuses NOT_FOUND "That booth is not found."

meetingLink(person: Person, booth: Booth) : returns (joinUrl: String)
  where booth exists, person organizes or represents it, and a meeting link is saved
  then
    returns joinUrl
  where booth does not exist, person is not its organizer or representative, or no meeting link is saved
  then
    refuses NOT_FOUND "That meeting link is not found."
```

## Queries

```queries
_get(booth: Booth) : optional (booth: Booth, space: Space, footprint: Footprint, name: String, description: String, organizer: Person, meetingLinkSaved: Flag)
  Gets the booth, and no row when it does not exist.

_in(space: Space) : many (booth: Booth, space: Space, footprint: Footprint, name: String, description: String, organizer: Person, meetingLinkSaved: Flag)
  Gets the booths in a space, and no rows when there are none.

_at(space: Space, position: Position) : optional (booth: Booth)
  Gets the booth whose footprint contains the position, and no row when it is outside all booths.

_representatives(booth: Booth) : many (representative: Person)
  Gets the booth's representatives, and no rows when there are none or the booth does not exist.

_isRepresentative(booth: Booth, representative: Person) : one (assigned: Flag)
  Answers true when the person represents the booth and false otherwise.

_contains(booth: Booth, position: Position) : one (contains: Flag)
  Answers whether the position is inside the booth's footprint.

_exists(booth: Booth) : one (exists: Flag)
  Answers whether the booth exists.

_inSpace(booth: Booth, space: Space) : one (inSpace: Flag)
  Answers whether the booth belongs to the given space.
```
