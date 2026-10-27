# Roam Hosting

An authenticated organizer [creates a fair](reaction:Roam.CreateFair) by
providing a name. Hosting gives the fair a unique code for visitors. The
organizer identity comes from the browser session, not
the request body. The [fair page](former:Roam.FairPage) reads the saved fair's
name, organizer, listing state, hall extent, booths, and representatives.
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
only rectangles within the current hall extent that do not cover the entrance. The
Exhibiting concept refuses overlapping rectangles. A nonowner receives the
same not-found response as an unknown fair.
Only the booth's recorded organizer can [edit it](reaction:Roam.EditBooth),
[move it](reaction:Roam.MoveBooth),
[delete it](reaction:Roam.DeleteBooth),
[change its saved meeting link](reaction:Roam.SetBoothMeetingLink),
[assign a representative](reaction:Roam.AddRepresentative), or
[remove a representative](reaction:Roam.RemoveRepresentative). An assignment
requires an account that has already registered.
The organizer-facing creation form offers small (2 by 2), medium (3 by 2),
and large (4 by 3) sizes. [Sized creation](reaction:Roam.CreateSizedBooth)
finds an open map position automatically, spreading new booths apart when
space allows and expanding the hall when no position remains. The organizer can change the
position after creation without changing the booth's size.
[Moving during a live call](reaction:Roam.MoveBoothDuringCall) and
[moving while a call is paused](reaction:Roam.MoveBoothWhilePaused) are
refused, so the host's saved presence cannot be separated from that call.
Deleting a booth checks ownership, ends any live or paused call, clears its
queue and invitations, and removes its representative assignments. Visitors
cannot claim a link from a deleted booth.

```endpoints
Roam.CreateBooth at /booths/create
Roam.CreateSizedBooth at /booths/create-sized
Roam.EditBooth at /booths/edit
Roam.MoveBooth at /booths/move
Roam.MoveBoothDuringCall at /booths/move
Roam.MoveBoothWhilePaused at /booths/move
Roam.DeleteBooth at /booths/delete
Roam.SetBoothMeetingLink at /booths/meeting-link/set
Roam.AddRepresentative at /booths/representatives/add
Roam.RemoveRepresentative at /booths/representatives/remove
```
