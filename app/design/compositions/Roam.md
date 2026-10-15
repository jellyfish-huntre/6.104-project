# Roam

The server gets the acting Person from the current session for protected requests. A request cannot choose its own organizer or representative identity. An organizer [creates a fair](reaction:Roam.CreateFair), and the [fair page](former:Roam.FairPage) gathers the fair, its booths, representative assignments, and open-call status without exposing call links. [Opening the fair page](reaction:Roam.GetFairPage) uses that former.

```endpoints
Roam.CreateFair at /fairs/create
Roam.GetFairPage at /fairs/page
```

The fair uses a 10 by 10 integer grid. Its entrance is at {x: 0, y: 0}. A booth occupies a rectangle {x, y, width, height} of cells. The fair owner [may manage booths](view:Roam.OrganizerOwnsFair). A [valid booth area](view:Roam.AvailableBoothArea) has positive integer dimensions, lies entirely inside the grid, excludes the entrance, and does not overlap another booth. People may stand within a booth's area, including when another booth is created. These checks gate [creating a booth](reaction:Roam.CreateBooth), which assigns the fair creator as its first representative; ownership also gates [editing its details](reaction:Roam.EditBooth), [adding a representative](reaction:Roam.AddRepresentative), and [removing a representative](reaction:Roam.RemoveRepresentative). The booth actions also require the actor to be the booth's recorded organizer. When a representative is removed, [their open call at that booth closes](reaction:Roam.RemovedRepresentativeClosesCall).

```endpoints
Roam.CreateBooth at /booths/create
Roam.EditBooth at /booths/edit
Roam.AddRepresentative at /booths/representatives/add
Roam.RemoveRepresentative at /booths/representatives/remove
```

A person [enters the fair](reaction:Roam.EnterFair) at {x: 0, y: 0}, may [move](reaction:Roam.Move), and may [leave](reaction:Roam.LeaveFair). A [valid move](view:Roam.ReachableDestination) goes one cell horizontally or vertically and stays within the grid. People may share a cell and move through booth areas. [Presence inside a booth](view:Roam.PresentAtBooth) is required for opening or joining its call. When a host moves outside the booth, [their open call closes](reaction:Roam.HostExitsBoothClosesCall). When a host leaves the fair, [their open call closes](reaction:Roam.DepartedHostClosesCall).

```endpoints
Roam.EnterFair at /fairs/enter
Roam.Move at /fairs/move
Roam.LeaveFair at /fairs/leave
```

An assigned representative inside the booth [may open a call](view:Roam.RepresentativeMayOpenCall). [Opening a call](reaction:Roam.OpenCall) publishes its availability at the booth. A signed-in visitor inside that booth [joins an open call](reaction:Roam.JoinCall) to receive its external link. An unsigned guest with the fair code [gets the open call link](reaction:Roam.GuestJoinCall) without an account; the guest browser offers it while their avatar is inside the booth. Only its host [closes the call](reaction:Roam.CloseCall). The application cannot observe whether a person actually enters or leaves the external video meeting.

```endpoints
Roam.OpenCall at /calls/open
Roam.JoinCall at /calls/join
Roam.GuestJoinCall at /calls/guest-join
Roam.GuestJoinCallUnknownFair at /calls/guest-join
Roam.GuestJoinCallWrongBooth at /calls/guest-join
Roam.GuestJoinCallClosed at /calls/guest-join
Roam.CloseCall at /calls/close
```

This MVP supports open group calls. Queueing and private invitations belong to a later increment.
