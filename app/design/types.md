# Application types

The Reservations tutorial still uses guest names and tables. Roam uses account
identities for organizers and representatives, with browser sessions proving
which account is acting.

```types
concrete Name
  The name a guest types in when reserving.

concrete Table
  A table at a certain time, such as friday-7pm-table-4.

concrete Position
  An integer grid coordinate {x, y} in a fair. Both axes run from 0 through 9;
  {x: 0, y: 0} is the entrance.

concrete Footprint
  A rectangle {x, y, width, height} of grid cells. x and y are the top-left
  coordinate, and width and height are positive integers.

concrete Participant
  A signed-in account or a pseudonymous guest in the shared fair map.

concrete GuestToken
  A private random browser token for guest presence, never published in the map.
```

```instances
instantiate Reserving with
  User is Name
  Resource is Table

instantiate Authenticating

instantiate Sessioning with
  Subject is Authenticating.Account

instantiate Hosting with
  Person is Authenticating.Account

instantiate Exhibiting with
  Person is Authenticating.Account
  Space is Hosting.Fair
  Position is Position
  Footprint is Footprint

instantiate Navigating with
  Person is Participant
  Space is Hosting.Fair
  Position is Position
  GuestToken is GuestToken

instantiate Calling with
  Person is Participant
  Place is Exhibiting.Booth

instantiate Queueing with
  Person is Participant
  Target is Exhibiting.Booth
```
