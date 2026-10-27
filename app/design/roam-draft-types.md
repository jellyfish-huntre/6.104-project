# Planned full Roam types

This is the target type map for the later movement and call slices. The active
bindings for identity, fairs, and booths are already in `types.md`; this copy
lets the full draft be checked independently.

```types
concrete Position
  An integer grid coordinate {x, y} in a fair. Both axes start at 0 and extend to the current hall bounds;
  {x: 0, y: 0} is the entrance.

concrete Footprint
  A rectangle {x, y, width, height} of grid cells. x and y are the top-left
  coordinate, and width and height are positive integers.

concrete Participant
  A signed-in account or a pseudonymous guest in the shared fair map.

concrete GuestToken
  A private random browser token for guest presence.
```

```instances
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
