# Roam Hosting

An authenticated organizer [creates a fair](reaction:Roam.CreateFair) by
providing a name. Hosting gives the fair a unique code for visitors. The
organizer identity comes from the browser session, not
the request body. The [fair page](former:Roam.FairPage) reads the saved fair's
name, organizer, listing state, booths, and representatives.
[Opening a fair](reaction:Roam.GetFairPage) returns that page by its identity,
including after a browser reload.
An [unknown fair](reaction:Roam.FairNotFound) returns a not-found error.

```endpoints
Roam.CreateFair at /fairs/create
Roam.GetFairPage at /fairs/page
Roam.FairNotFound at /fairs/page
```

The [create-booth endpoint](reaction:Roam.CreateBooth) verifies fair ownership
through Hosting and accepts an optional saved meeting link as booth setup data.
The fair creator becomes the booth's first representative when it is created.
It accepts
only rectangles within the 10 by 10 grid that do not cover the entrance. The
Exhibiting concept refuses overlapping rectangles. A nonowner receives the
same not-found response as an unknown fair.
Only the booth's recorded organizer can [edit it](reaction:Roam.EditBooth),
[change its saved meeting link](reaction:Roam.SetBoothMeetingLink),
[assign a representative](reaction:Roam.AddRepresentative), or
[remove a representative](reaction:Roam.RemoveRepresentative). An assignment
requires an account that has already registered.

```endpoints
Roam.CreateBooth at /booths/create
Roam.EditBooth at /booths/edit
Roam.SetBoothMeetingLink at /booths/meeting-link/set
Roam.AddRepresentative at /booths/representatives/add
Roam.RemoveRepresentative at /booths/representatives/remove
```
