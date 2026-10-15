# Navigating

## Purpose

Keep track of where people are in a shared space, so others can see who is present and where they have moved.

## Principle

A visitor enters a space at its entrance. As the visitor moves into a booth's area, their position changes for everyone viewing the space. When the visitor leaves, they no longer appear there. A person cannot enter again without first leaving.

## Types

```types
external Person
  The person moving through a space.

external Space
  The space the person enters.

external Position
  A location within the space; the application chooses its coordinate system and allowed moves.
```

## State

```state
a set of Presences with
  a unique person Person
  a space Space
  a position Position
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

leave(person: Person) : returns ()
  where person is present
  then
    remove the person's presence
    returns
  where person is not present
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
```
