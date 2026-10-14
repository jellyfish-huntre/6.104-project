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
```

## Actions

```actions
create(organizer: Person, name: String) : returns (fair: Fair)
  where name is nonempty
  then
    adds a new fair with organizer and name
    returns fair
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
```

## Queries

```queries
_get(fair: Fair) : optional (fair: Fair, name: String, organizer: Person)
  Gets the fair corresponding to the fair id, and no rows when the fair does not exist.
```
