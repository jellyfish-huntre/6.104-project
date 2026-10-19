# Calling

## Purpose

Let a host offer one external call at a place, either open to visitors or offered only to people invited by the application.

## Principle

A representative opens a group call at a booth. Visitors can request its link. The representative may switch the same booth call to invite-only access, supplying a fresh external meeting link so people who received the group link are not automatically given the invite-only link. The application checks invitations before asking Calling for that link. The representative may switch back to an open group call or close the call. When an invite-only host leaves, Calling suspends that call and retains its link for an assigned representative to resume. A representative cannot host two active calls at once. Calling controls link and mode, not queue order or invitations.

"Invite-only" describes who receives a link through Roam. Roam cannot observe entry into the external meeting or revoke a link already disclosed. The representative must use the video provider's access controls to keep a meeting private.

## Types

```types
external Person
  The host or visitor of a call.

external Place
  The place where a call is offered.

Mode is OPEN_GROUP or INVITE_ONLY
```

## State

```state
a set of Calls with
  a unique place Place
  a unique host Person
  a joinUrl String
  a mode Mode

a set of SuspendedCalls with
  a unique place Place
  a joinUrl String
```

## Actions

```actions
open(host: Person, place: Place, joinUrl: String, mode: Mode) : returns (call: Call)
  where joinUrl is not a valid HTTP or HTTPS URL
  then
    refuses INVALID_URL "Enter a valid call link."
  where mode is neither OPEN_GROUP nor INVITE_ONLY
  then
    refuses INVALID_MODE "Choose open group or invite-only access."
  where joinUrl is valid and a call is already open at place
  then
    refuses PLACE_BUSY "A call is already open here."
  where joinUrl is valid and no call is open at place and host has another open call
  then
    refuses HOST_BUSY "This host already has an open call."
  where joinUrl is valid and no call is open at place and host has no other open call
  then
    add a new call with host, place, joinUrl, and mode
    remove any suspended call at place
    returns call

resume(host: Person, place: Place) : returns (call: Call)
  where no suspended call exists at place
  then
    refuses NOT_FOUND "There is no invite-only call to resume."
  where a call is already open at place
  then
    refuses PLACE_BUSY "A call is already open here."
  where host has another open call
  then
    refuses HOST_BUSY "This host already has an open call."
  where a suspended call exists, no call is open at place, and host has no other open call
  then
    open an INVITE_ONLY call at place with the retained link
    remove the suspended call
    returns call

changeMode(host: Person, call: Call, mode: Mode, joinUrl: String) : returns ()
  where call does not exist or host did not open it
  then
    refuses NOT_FOUND "That call is not found."
  where mode is neither OPEN_GROUP nor INVITE_ONLY
  then
    refuses INVALID_MODE "Choose open group or invite-only access."
  where joinUrl is not a valid HTTP or HTTPS URL
  then
    refuses INVALID_URL "Enter a valid call link."
  where call is OPEN_GROUP and mode is INVITE_ONLY and joinUrl equals the old link
  then
    refuses LINK_NOT_ROTATED "Use a fresh meeting link for invite-only access."
  where call exists, host opened it, and the inputs are valid
  then
    replace the mode and link on the same call
    returns

join(person: Person, call: Call) : returns (joinUrl: String)
  where call exists
  then
    returns joinUrl
  where call does not exist
  then
    refuses NOT_FOUND "That call is no longer open."

close(host: Person, call: Call) : returns (place: Place, mode: Mode)
  where call exists and host opened it
  then
    remove the call
    returns place, mode
  where call does not exist or host did not open it
  then
    refuses NOT_FOUND "That call is not found."

suspend(host: Person, call: Call) : returns (place: Place)
  where an INVITE_ONLY call exists and host opened it
  then
    retain its link as a suspended call at its place and remove the active call
    returns place
  where no such call exists
  then
    refuses NOT_FOUND "That call is not found."
```

## Queries

```queries
_openAt(place: Place) : optional (call: Call, place: Place, host: Person, mode: Mode)
  Gets the call and mode at a place without its link, and no row when there is none.

_hostedBy(host: Person) : optional (call: Call, place: Place, mode: Mode)
  Gets the host's open call, and no row when the host has none.

_isOpen(place: Place) : one (open: Flag)
  Answers whether a call is open at the place.

_suspendedAt(place: Place) : one (suspended: Flag)
  Answers whether an invite-only link is retained at the place without returning it.
```
