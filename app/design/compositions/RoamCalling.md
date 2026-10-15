# Roam calling

A signed-in person [enters a fair](reaction:Roam.EnterFair) at (0, 0),
[moves](reaction:Roam.Move) one orthogonal cell at a time, and
[leaves](reaction:Roam.LeaveFair). Navigating records their position.
The public fair-code lookup lets a guest browse the map without an account.
An anonymous guest can request the link for an open booth call using that
fair's code. The browser offers this action when the guest's avatar is inside
the booth. The server verifies the code, booth, and open call; a guest's
browser-only position is not verified by the server.
[Reading fair presence](reaction:Roam.GetPresence) returns the
[people and positions](former:Roam.FairPresence) currently in that fair.

```endpoints
Roam.EnterFair at /fairs/enter
Roam.Move at /fairs/move
Roam.LeaveFair at /fairs/leave
Roam.GetPresence at /fairs/presence
```

A representative assigned to a booth may [open a call](reaction:Roam.OpenCall)
while standing inside its footprint. A signed-in visitor standing in that
footprint may [join the open call](reaction:Roam.JoinCall) to receive its
external link. An unsigned guest may [get the open call link](reaction:Roam.GuestJoinCall)
with the fair code and booth. The [fair page](former:Roam.FairPage) shows the open call and
host without publishing its link. Only the host may [close it](reaction:Roam.CloseCall).
An [unknown fair code](reaction:Roam.GuestJoinCallUnknownFair),
[booth outside that fair](reaction:Roam.GuestJoinCallWrongBooth), or
[closed call](reaction:Roam.GuestJoinCallClosed) yields no link for a guest.
An organizer may save a meeting link during booth setup. An organizer or
assigned representative may [retrieve that saved link](reaction:Roam.GetBoothMeetingLink)
to open a call with it. The booth page uses the saved link when opening a call;
a representative supplies a link only when the booth has none saved. Saving
the link alone does not open a call, and the
public fair page shows only whether one is saved.
A person who is not assigned to the booth
[cannot open its call](reaction:Roam.OpenCallNotRepresentative). A representative
[outside the booth](reaction:Roam.OpenCallOutside) or
[outside the fair](reaction:Roam.OpenCallAbsent) is also refused.
Someone [outside the booth](reaction:Roam.JoinCallOutside) or
[outside the fair](reaction:Roam.JoinCallAbsent) cannot get the link;
[a closed call](reaction:Roam.JoinCallClosed) has no link to return.
An [unknown booth on open](reaction:Roam.OpenCallUnknownBooth) or
[unknown booth on join](reaction:Roam.JoinCallUnknownBooth) returns not found.
An [expired session on open](reaction:Roam.OpenCallNoSession) or
[expired session on join](reaction:Roam.JoinCallNoSession) requires sign-in.

```endpoints
Roam.OpenCall at /calls/open
Roam.GetBoothMeetingLink at /booths/meeting-link
Roam.OpenCallNotRepresentative at /calls/open
Roam.OpenCallOutside at /calls/open
Roam.OpenCallAbsent at /calls/open
Roam.OpenCallUnknownBooth at /calls/open
Roam.OpenCallNoSession at /calls/open
Roam.JoinCall at /calls/join
Roam.GuestJoinCall at /calls/guest-join
Roam.GuestJoinCallUnknownFair at /calls/guest-join
Roam.GuestJoinCallWrongBooth at /calls/guest-join
Roam.GuestJoinCallClosed at /calls/guest-join
Roam.JoinCallOutside at /calls/join
Roam.JoinCallAbsent at /calls/join
Roam.JoinCallClosed at /calls/join
Roam.JoinCallUnknownBooth at /calls/join
Roam.JoinCallNoSession at /calls/join
Roam.CloseCall at /calls/close
```

Removing a representative [closes their booth call](reaction:Roam.RemovedRepresentativeClosesCall).
If a host [moves outside the booth](reaction:Roam.HostExitsBoothClosesCall)
or [leaves the fair](reaction:Roam.DepartedHostClosesCall), the call closes.
The application cannot observe whether someone actually entered or left the
external video meeting.
