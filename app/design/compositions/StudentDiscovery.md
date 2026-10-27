# Student discovery

An organizer shares the eight-character code shown on the [fair page](former:Roam.FairPage).
A student enters that code to [open the fair](reaction:Roam.OpenFairCode).
The lookup does not require an account. An [unknown code](reaction:Roam.FairCodeNotFound)
returns a not-found error. Fair names can repeat because the code identifies the fair.
Fairs created before codes were introduced receive one when the backend starts.
An organizer may [list or unlist a fair](reaction:Roam.SetFairListing).
Only listed fairs appear in the [public fair directory](former:Roam.PublicFairs),
which anyone may [browse](reaction:Roam.ListPublicFairs) and open without a code.
New and older fairs are unlisted until their organizer chooses to list them.
An unlisted fair remains accessible through its code or direct link.

```endpoints
Roam.OpenFairCode at /fairs/by-code
Roam.FairCodeNotFound at /fairs/by-code
Roam.SetFairListing at /fairs/listing
Roam.ListPublicFairs at /fairs/public
```

The [fair page](former:Roam.FairPage) already contains booth footprints,
descriptions, and representatives. The student view lays those footprints on
the fair's current grid extent, initially 10 by 10; selecting any cell occupied by a booth reveals that
booth's details. Empty cells remain visible, including the entrance at (0, 0).
A walking avatar starts at the entrance. Arrow keys or WASD move it smoothly
through fractional cell positions. Signed-in people [walk](reaction:Roam.MoveFree)
and guests [walk](reaction:Roam.GuestMoveFree) around the solid footprint of
plants and furniture. Each booth's stable visual variant supplies the visible
furniture positions and the matching collision shapes. [Blocked signed-in moves](reaction:Roam.MoveFreeBlocked),
[blocked guest moves](reaction:Roam.GuestMoveFreeBlocked), and
[unsigned movement](reaction:Roam.MoveFreeNoSession) receive explicit errors.
The older one-cell movement endpoints remain available, with
[blocked signed-in steps](reaction:Roam.MoveBlocked),
[blocked guest steps](reaction:Roam.GuestMoveBlocked), and
[unsigned steps](reaction:Roam.MoveNoSession) handled explicitly. Entering a booth's area
shows its details. Navigating records both guests and signed-in people so their
colored avatars are visible to others in the fair.
A guest's private token stays in their browser; the public map shows only a
pseudonym. Guest presence expires after inactivity. Existing fair links still
open directly.
When the avatar moves out of a booth, that booth is no longer highlighted and
its details panel closes. Moving into another booth selects that booth instead.
When a host walks out of a booth, an open group call
[closes](reaction:Roam.FreeHostExitsBoothClosesCall), an invite-only call
[pauses](reaction:Roam.FreeHostExitsInviteBoothPausesQueue), and a returning
representative [resumes it](reaction:Roam.FreeReturnedRepresentativeResumesInviteCall).

```endpoints
Roam.MoveBlocked at /fairs/move
Roam.MoveNoSession at /fairs/move
Roam.GuestMoveBlocked at /fairs/guest-move
Roam.MoveFree at /fairs/move-free
Roam.MoveFreeBlocked at /fairs/move-free
Roam.MoveFreeNoSession at /fairs/move-free
Roam.GuestMoveFree at /fairs/guest-move-free
Roam.GuestMoveFreeBlocked at /fairs/guest-move-free
```
