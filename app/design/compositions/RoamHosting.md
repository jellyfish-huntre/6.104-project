# Roam Hosting

An organizer [creates a fair](reaction:Roam.CreateFair) by providing a name.
The [fair page](former:Roam.FairPage) reads the saved fair's name and organizer.
[Opening a fair](reaction:Roam.GetFairPage) returns that page by its identity,
including after a browser reload.
An [unknown fair](reaction:Roam.FairNotFound) returns a not-found error.

```endpoints
Roam.CreateFair at /fairs/create
Roam.GetFairPage at /fairs/page
Roam.FairNotFound at /fairs/page
```
