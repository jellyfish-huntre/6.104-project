# Application types

The Reservations tutorial uses guest names and tables. The current Roam slice
records a supplied organizer name with each fair.

```types
concrete Name
  The name a guest types in when reserving.

concrete Table
  A table at a certain time, such as friday-7pm-table-4.

concrete Person
  A person using Roam. The current Hosting endpoint records a supplied name;
  protected actions will require a verified identity.
```

```instances
instantiate Reserving with
  User is Name
  Resource is Table

instantiate Hosting with
  Person is Person
```
