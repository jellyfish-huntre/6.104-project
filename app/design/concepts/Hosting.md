# Hosting

## Purpose

Let organizers create fairs for organizations and visitors to share

## Principle

an organizer creates a fair with a name and can change details as the event takes shape

## Types

```types
external Person
  The person who creates or participates in the fair.
```

## State

```state
a set of Fairs with
  a name String
  an organizer Person
  a unique code String
  a listed Flag
```

## Actions

```actions
create(organizer: Person, name: String) : returns (fair: Fair, code: String)
  where name is nonempty
  then
    adds a new unlisted fair with organizer, name, and a unique eight-character code
    returns fair, code
  where name is empty
  then
    refuses INVALID_NAME "That name is not valid."

edit(organizer: Person, fair: Fair, name: String): returns ()
  where fair exists and organizer owns it and name is nonempty
  then
    changes the fair's name
    returns
  where name is nonempty and (fair doesn't exist or organizer doesn't own it)
  then
    refuses NOT_FOUND "That fair is not found"
  where name is empty
  then
    refuses INVALID_NAME "That name is not valid."

verifyOwner(organizer: Person, fair: Fair) : returns ()
  where fair exists and organizer owns it
  then
    returns
  where fair does not exist or organizer does not own it
  then
    refuses NOT_FOUND "That fair is not found."

setListed(organizer: Person, fair: Fair, listed: Flag) : returns ()
  where fair exists and organizer owns it
  then
    changes whether the fair appears in the public directory
    returns
  where fair does not exist or organizer does not own it
  then
    refuses NOT_FOUND "That fair is not found."
```

## Queries

```queries
_get(fair: Fair) : optional (fair: Fair, name: String, organizer: Person, code: String, listed: Flag)
  Gets the fair corresponding to the fair id, and no rows when the fair does not exist.

_exists(fair: Fair) : one (exists: Flag)
  Answers true when the fair exists and false otherwise.

_owns(fair: Fair, organizer: Person) : one (owns: Flag)
  Answers true when this organizer owns the fair and false otherwise.

_byCode(code: String) : optional (fair: Fair)
  Gets the fair with this code, and no row when the code is unknown.

_codeExists(code: String) : one (exists: Flag)
  Answers true when a fair has this code and false otherwise.

_public() : many (fair: Fair, name: String, organizer: Person)
  Gets listed fairs for public discovery, without their access codes.
```
