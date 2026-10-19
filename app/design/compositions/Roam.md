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

A signed-in person [enters the fair](reaction:Roam.EnterFair) at {x: 0, y: 0}, may [move](reaction:Roam.Move), and may [leave](reaction:Roam.LeaveFair). An unsigned guest [enters](reaction:Roam.GuestEnterFair), [moves](reaction:Roam.GuestMove), and [leaves](reaction:Roam.GuestLeaveFair) using a private browser token. A [valid move](view:Roam.ReachableDestination) goes one cell horizontally or vertically and stays within the grid. People may share a cell and move through booth areas. The presence page includes both account names and guest pseudonyms. [Presence inside a booth](view:Roam.PresentAtBooth) is required for opening or joining its call. When a host moves outside the booth, [their open call closes](reaction:Roam.HostExitsBoothClosesCall). When a host leaves the fair, [their open call closes](reaction:Roam.DepartedHostClosesCall).

```endpoints
Roam.EnterFair at /fairs/enter
Roam.Move at /fairs/move
Roam.LeaveFair at /fairs/leave
Roam.GuestEnterFair at /fairs/guest-enter
Roam.GuestMove at /fairs/guest-move
Roam.GuestLeaveFair at /fairs/guest-leave
Roam.GuestEnterUnknownFair at /fairs/guest-enter
```

An assigned representative inside the booth [may open a call](view:Roam.RepresentativeMayOpenCall). [Opening a call](reaction:Roam.OpenCall) publishes its availability at the booth. A signed-in visitor inside that booth [joins an open call](reaction:Roam.JoinCall) to receive its external link. An unsigned guest with the fair code and an active presence inside the booth [gets the open call link](reaction:Roam.GuestJoinCall) without an account. Only its host [closes the call](reaction:Roam.CloseCall). The application cannot observe whether a person actually enters or leaves the external video meeting.

```endpoints
Roam.OpenCall at /calls/open
Roam.JoinCall at /calls/join
Roam.GuestJoinCall at /calls/guest-join
Roam.GuestJoinCallUnknownFair at /calls/guest-join
Roam.GuestJoinCallWrongBooth at /calls/guest-join
Roam.GuestJoinCallClosed at /calls/guest-join
Roam.GuestJoinCallOutside at /calls/guest-join
Roam.GuestJoinCallAbsent at /calls/guest-join
Roam.CloseCall at /calls/close
```

For P3, the same booth call has OPEN_GROUP and INVITE_ONLY modes. A host
switching from open group to invite-only must provide a fresh external meeting
link; earlier recipients may still use the old link outside Roam. Queueing
belongs to each booth and holds waiting requests and two-minute invitations,
but never a meeting link. A visitor may request one turn per booth, withdraw,
and keep exploring. An assigned representative cannot request a turn at their
own booth. The host may stop new requests while preserving the queue,
remove a visitor, or invite the next one to three in order. An invited visitor
may retrieve the current invite-only link while the invitation is valid and
they remain in the fair. Roam cannot verify entry into the external meeting or
revoke a link already shared. The public fair page shows queue availability
and count; a visitor sees only their own request, and an assigned
representative sees the ordered list. All link authorization occurs on the
server.

If the host leaves the booth or loses the representative assignment, the call
closes and the queue pauses for five minutes. An assigned representative can
resume it by opening an invite-only call at that booth; otherwise the queue
closes and its requests are cleared. Switching back to OPEN_GROUP also closes
the queue after warning the host. Deliberately closing an invite-only call
closes its queue; leaving the fair removes that visitor's requests. Server
time determines deadlines, and
expired states are refused even before cleanup runs.

```endpoints
Roam.ChangeCallMode at /calls/mode
Roam.JoinQueue at /queues/join
Roam.LeaveQueue at /queues/leave
Roam.MyQueueStatus at /queues/mine
Roam.BoothQueue at /queues/booth
Roam.SetQueueAccepting at /queues/accepting
Roam.RemoveFromQueue at /queues/remove
Roam.InviteNext at /queues/invite-next
Roam.ClaimInvitation at /calls/claim-invitation
```
