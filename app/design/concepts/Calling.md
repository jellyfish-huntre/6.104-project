# Calling

## Purpose

Let a host offer an external call for visitors to join, so visitors can find a live conversation without arranging a time in advance.

## Principle

A representative opens an external group call at a booth. A visitor sees that the call is open and asks for its link. When the representative closes the call, another visitor can no longer get the link through this concept. A representative cannot host two open calls at once.

## Types

```types
external Person
  The host or visitor of a call.

external Place
  The place where a call is offered.
```

## State

```state
a set of Calls with
  a unique place Place
  a unique host Person
  a joinUrl String
```

## Actions

```actions
open(host: Person, place: Place, joinUrl: String) : returns (call: Call)
  where joinUrl is not a valid HTTP or HTTPS URL
  then
    refuses INVALID_URL "Enter a valid call link."
  where joinUrl is valid and a call is already open at place
  then
    refuses PLACE_BUSY "A call is already open here."
  where joinUrl is valid and no call is open at place and host has another open call
  then
    refuses HOST_BUSY "This host already has an open call."
  where joinUrl is valid and no call is open at place and host has no other open call
  then
    add a new call with host, place, and joinUrl
    returns call

join(person: Person, call: Call) : returns (joinUrl: String)
  where call exists
  then
    returns joinUrl
  where call does not exist
  then
    refuses NOT_FOUND "That call is no longer open."

close(host: Person, call: Call) : returns ()
  where call exists and host opened it
  then
    remove the call
    returns
  where call does not exist or host did not open it
  then
    refuses NOT_FOUND "That call is not found."
```

## Queries

```queries
_openAt(place: Place) : optional (call: Call, place: Place, host: Person)
  Gets the open call at a place without its link, and no row when there is none.

_hostedBy(host: Person) : optional (call: Call, place: Place)
  Gets the host's open call, and no row when the host has none.

_isOpen(place: Place) : one (open: Flag)
  Answers whether a call is open at the place.
```
