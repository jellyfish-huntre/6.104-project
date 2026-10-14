# Application types

Guests type their own name, and each reservation holds one table at one time.

```types
concrete Name
  The name a guest types in when reserving.

concrete Table
  A table at a certain time, such as friday-7pm-table-4.

concrete Person
  A person using Roam, identified by a server-held session for protected actions.

concrete Position
  An integer grid coordinate {x, y} in a fair. Both axes run from 0 through 9;
  {x: 0, y: 0} is the entrance.

concrete Footprint
  A rectangle {x, y, width, height} of grid cells. x and y are the top-left
  coordinate, and width and height are positive integers.
```

```instances
instantiate Reserving with
  User is Name
  Resource is Table

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
