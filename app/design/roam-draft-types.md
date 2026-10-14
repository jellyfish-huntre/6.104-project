# Planned Roam types

These bindings are for the planned booth, movement, and call slices. They move
into types.md when those implementations are registered.

```types
concrete Person
  A person using Roam, identified by a verified server-held session for protected actions.

concrete Position
  An integer grid coordinate {x, y} in a fair. Both axes run from 0 through 9;
  {x: 0, y: 0} is the entrance.

concrete Footprint
  A rectangle {x, y, width, height} of grid cells. x and y are the top-left
  coordinate, and width and height are positive integers.
```

```instances
instantiate Hosting with
  Person is Person

instantiate Exhibiting with
  Person is Person
  Space is Hosting.Fair
  Position is Position
  Footprint is Footprint

instantiate Navigating with
  Person is Person
  Space is Hosting.Fair
  Position is Position

instantiate Calling with
  Person is Person
  Place is Exhibiting.Booth
```
