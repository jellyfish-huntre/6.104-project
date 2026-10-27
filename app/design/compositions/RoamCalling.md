# Roam calling

A signed-in person [enters a fair](reaction:Roam.EnterFair) at (0, 0),
[moves](reaction:Roam.Move) one orthogonal cell at a time, and
[leaves](reaction:Roam.LeaveFair). Navigating records their position.
The public fair-code lookup lets a guest browse the map without an account.
A guest [enters](reaction:Roam.GuestEnterFair) and
[moves](reaction:Roam.GuestMove) using a private browser token. Their public
pseudonym and position appear in fair presence. An inactive guest disappears
after 30 seconds. A guest may [leave](reaction:Roam.GuestLeaveFair).
An [unknown fair](reaction:Roam.GuestEnterUnknownFair) cannot be entered.
The guest can request an open-group booth call link using the fair code and token;
the server verifies that the guest is inside that booth. The same token
identifies that guest's own queue request and invitation, but is never included
in public fair data. A guest waiting for an invitation must keep an active
presence in the fair; the browser refreshes that presence while the fair is
open. An absent or expired guest cannot claim an invitation.
[Reading fair presence](reaction:Roam.GetPresence) returns the
[people and positions](former:Roam.FairPresence) currently in that fair.

```endpoints
Roam.EnterFair at /fairs/enter
Roam.Move at /fairs/move
Roam.LeaveFair at /fairs/leave
Roam.GuestEnterFair at /fairs/guest-enter
Roam.GuestMove at /fairs/guest-move
Roam.GuestLeaveFair at /fairs/guest-leave
Roam.GuestEnterUnknownFair at /fairs/guest-enter
Roam.GetPresence at /fairs/presence
```

A representative assigned to a booth may [open a call](reaction:Roam.OpenCall)
while standing inside its footprint. In OPEN_GROUP mode, a signed-in visitor
standing in that footprint may [join the open call](reaction:Roam.JoinCall) to
receive its external link. An unsigned guest may [get the open-group link](reaction:Roam.GuestJoinCall)
with the fair code and booth. The [fair page](former:Roam.FairPage) shows the
call host and mode without publishing its link. Only the host may
[close it](reaction:Roam.CloseCall). A visitor is not allowed to retrieve an
INVITE_ONLY link through these open-group endpoints.
[Signed-in](reaction:Roam.JoinCallInviteOnly) and
[guest](reaction:Roam.GuestJoinCallInviteOnly) requests for an invite-only
link through the group endpoints are refused.
An [unknown fair code](reaction:Roam.GuestJoinCallUnknownFair),
[booth outside that fair](reaction:Roam.GuestJoinCallWrongBooth), or
[closed call](reaction:Roam.GuestJoinCallClosed) yields no link for a guest.
A guest [outside the booth](reaction:Roam.GuestJoinCallOutside) or
[absent from the fair](reaction:Roam.GuestJoinCallAbsent) cannot get its link.
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

The call host may [change its mode](reaction:Roam.ChangeCallMode) without
creating a second booth call. Switching from OPEN_GROUP to INVITE_ONLY requires
a different external meeting URL. The old group URL may still work outside
Roam, so the host must close or restrict the old meeting with the video
provider. Opening directly in INVITE_ONLY mode also opens the booth queue.
An authenticated person who is not the host
[cannot change the mode](reaction:Roam.ChangeCallModeNotHost) or
[close the call](reaction:Roam.CloseCallNotHost).
An expired or missing session is [refused for a mode change](reaction:Roam.ChangeCallModeNoSession)
and [for call closure](reaction:Roam.CloseCallNoSession).
Switching to INVITE_ONLY opens the booth queue; switching back to
OPEN_GROUP closes that queue and cancels outstanding invitations, after the
host is warned that waiting visitors will lose their requests. The UI names
the mode "invite-only" rather than promising privacy that Roam cannot enforce
inside an external meeting.
An [invite-only call opens](reaction:Roam.OpenInviteCall) with a new
[queue](reaction:Roam.InviteCallStartsQueue), or
[resumes a paused queue](reaction:Roam.InviteCallResumesQueue). Opening a group
call [closes a paused queue](reaction:Roam.GroupCallClosesQueue).
An assigned representative inside the booth may [resume its suspended invite-only call](reaction:Roam.ResumeInviteCall)
with the retained link while the queue is paused. Roam resumes that queue at the
same time; the representative does not need to enter the link again.
[Changing to invite-only](reaction:Roam.ModeToInviteStartsQueue) opens a queue;
[changing to open group](reaction:Roam.ModeToGroupClosesQueue) closes it.
Deliberately [closing an invite-only call](reaction:Roam.CloseInviteCall)
also closes its queue.

```endpoints
Roam.OpenCall at /calls/open
Roam.OpenInviteCall at /calls/open-invite
Roam.ResumeInviteCall at /calls/resume-invite
Roam.GetBoothMeetingLink at /booths/meeting-link
Roam.ChangeCallModeNotHost at /calls/mode
Roam.ChangeCallModeNoSession at /calls/mode
Roam.CloseCallNotHost at /calls/close
Roam.CloseCallNoSession at /calls/close
Roam.OpenCallNotRepresentative at /calls/open
Roam.OpenCallOutside at /calls/open
Roam.OpenCallAbsent at /calls/open
Roam.OpenCallUnknownBooth at /calls/open
Roam.OpenCallNoSession at /calls/open
Roam.JoinCall at /calls/join
Roam.JoinCallInviteOnly at /calls/join
Roam.GuestJoinCall at /calls/guest-join
Roam.GuestJoinCallInviteOnly at /calls/guest-join
Roam.GuestJoinCallUnknownFair at /calls/guest-join
Roam.GuestJoinCallWrongBooth at /calls/guest-join
Roam.GuestJoinCallClosed at /calls/guest-join
Roam.GuestJoinCallOutside at /calls/guest-join
Roam.GuestJoinCallAbsent at /calls/guest-join
Roam.JoinCallOutside at /calls/join
Roam.JoinCallAbsent at /calls/join
Roam.JoinCallClosed at /calls/join
Roam.JoinCallUnknownBooth at /calls/join
Roam.JoinCallNoSession at /calls/join
Roam.CloseCall at /calls/close
Roam.CloseInviteCall at /calls/close
Roam.ChangeCallMode at /calls/mode
```

Removing a representative [closes their open-group call](reaction:Roam.RemovedRepresentativeClosesCall)
or [suspends their invite-only call and pauses the queue](reaction:Roam.RemovedInviteRepresentativePausesQueue).
If a host [moves outside the booth](reaction:Roam.HostExitsBoothClosesCall)
or [leaves the fair](reaction:Roam.DepartedHostClosesCall), their open-group
call closes. Moving out of an invite-only booth
[suspends its call and pauses the queue](reaction:Roam.HostExitsInviteBoothPausesQueue);
leaving the fair [does the same](reaction:Roam.DepartedInviteHostPausesQueue).
If it was invite-only, the booth queue pauses for five minutes. An assigned
representative standing at the booth may resume the suspended call with its
retained link or open an invite-only call with a different link. If nobody does so before the
deadline, the server closes the queue and clears its requests. The same rule
applies when the host loses their representative assignment. Timed expiration
is enforced by the server, and reads treat past deadlines as expired even if
cleanup has not yet run. If the host deliberately closes an invite-only call,
the queue closes immediately after a warning that waiting visitors will lose
their requests. [Leaving the fair removes](reaction:Roam.DepartedVisitorLeavesQueue)
that visitor's queue requests. An explicit
[guest departure](reaction:Roam.DepartedGuestLeavesQueue) also removes the
guest's requests. An expired guest presence makes an invitation ineligible.
The application cannot observe whether someone actually entered or left the
external video meeting.

When an assigned representative [moves back into a booth with a suspended invite-only call](reaction:Roam.ReturnedRepresentativeResumesInviteCall)
before the queue's pause deadline, Roam resumes the retained call and queue
automatically. A representative already standing there may use the resume
action instead.

## Waiting and invitations (P3 target)

The booth's Queueing state is separate from its Calling state. A visitor in
the fair, whether signed in or an active guest, may [request a turn](reaction:Roam.JoinQueue)
at an invite-only booth without remaining inside its footprint. The server
derives the visitor identity from the session or private guest token and
refuses a second request at the same booth. A representative assigned to that
booth [cannot request a turn there](reaction:Roam.JoinQueueRepresentative),
though they may request a turn at another booth. An unsigned guest uses the
[guest request](reaction:Roam.GuestJoinQueue) with their private token. The visitor may
[leave the queue](reaction:Roam.LeaveQueue) while waiting or invited. The
guest may [leave](reaction:Roam.GuestLeaveQueue) too. The visitor's own
[queue status](former:Roam.MyQueueStatus), opened through
[their status request](reaction:Roam.GetMyQueueStatus) or a
[guest status request](reaction:Roam.GuestMyQueueStatus), follows them while they
explore; the public fair page shows only whether the queue accepts requests,
whether it is paused, and how many people wait.

An assigned representative at the booth sees the ordered waiting and invited list through
[a host-only view](former:Roam.BoothQueue), opened by
[the booth-queue request](reaction:Roam.GetBoothQueue). The host may
[stop or resume new requests](reaction:Roam.SetQueueAccepting) without clearing
the list, and may [remove a waiting or invited visitor](reaction:Roam.RemoveFromQueue).
An unassigned person [cannot read the booth queue](reaction:Roam.GetBoothQueueNotRepresentative)
or [remove someone from it](reaction:Roam.RemoveFromQueueNotRepresentative).
An unassigned person also
[cannot stop requests](reaction:Roam.SetQueueAcceptingNotRepresentative) or
[invite a visitor](reaction:Roam.InviteNextNotRepresentative).
An expired or missing session is
[refused when changing queue acceptance](reaction:Roam.SetQueueAcceptingNoSession)
or [inviting](reaction:Roam.InviteNextNoSession).
Removal is visible to that visitor. It prevents any future link retrieval in
Roam but cannot retract a link already received. The host may
[invite the next one to three waiting visitors](reaction:Roam.InviteNext),
always in queue order. Each invitation lasts two minutes. The invite action
marks each selected request as invited; it does not reveal the link.

An invited visitor may [claim the link](reaction:Roam.ClaimInvitation), or
[claim as a guest](reaction:Roam.GuestClaimInvitation), while
the invitation is unexpired, the call is still INVITE_ONLY, and they remain
in the fair. The backend verifies their session or guest token and invitation
before calling Calling.join. They need not be inside the booth. The two-minute
timer limits link retrieval, not entry into the external meeting, which Roam
cannot detect. Expired invitations are cleared, and those visitors may request
a new turn. Queue and invitation status updates without a page reload.
[Signed-in](reaction:Roam.ClaimInvitationNotInvited) and
[guest](reaction:Roam.GuestClaimInvitationNotInvited) requests without a valid
invitation receive no link.

```endpoints
Roam.JoinQueue at /queues/join
Roam.JoinQueueRepresentative at /queues/join
Roam.GuestJoinQueue at /queues/guest-join
Roam.LeaveQueue at /queues/leave
Roam.GuestLeaveQueue at /queues/guest-leave
Roam.GetMyQueueStatus at /queues/mine
Roam.GuestMyQueueStatus at /queues/guest-mine
Roam.GetBoothQueue at /queues/booth
Roam.GetBoothQueueNotRepresentative at /queues/booth
Roam.SetQueueAccepting at /queues/accepting
Roam.SetQueueAcceptingNotRepresentative at /queues/accepting
Roam.SetQueueAcceptingNoSession at /queues/accepting
Roam.RemoveFromQueue at /queues/remove
Roam.RemoveFromQueueNotRepresentative at /queues/remove
Roam.InviteNext at /queues/invite-next
Roam.InviteNextNotRepresentative at /queues/invite-next
Roam.InviteNextNoSession at /queues/invite-next
Roam.ClaimInvitation at /calls/claim-invitation
Roam.ClaimInvitationNotInvited at /calls/claim-invitation
Roam.GuestClaimInvitation at /calls/guest-claim-invitation
Roam.GuestClaimInvitationNotInvited at /calls/guest-claim-invitation
```
