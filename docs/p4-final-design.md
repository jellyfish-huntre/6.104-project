# Roam: Final Design

## The encounter I wanted to make possible

At an online club or career fair, a student has limited time and incomplete information. A directory says who is there, but it rarely says whether someone is ready to talk. Opening video links one by one can lead to an empty room or a conversation the student does not want to interrupt. Booking a slot helps when they already know whom to meet; it does little for an organization they discover during the event.

I built Roam for that unplanned encounter. A visitor can explore a small fair, notice an unfamiliar booth, see what is happening there, and either join a conversation or request a turn while continuing to look around. Representatives can manage interest without keeping everyone in a video room. An organizer can set up the fair without assigning map coordinates or scheduling each conversation. My [P1 problem framing](https://github.com/jellyfish-huntre/6.104-project/blob/b0db400/docs/design.md) describes the missed encounter and the workarounds in more detail.

## What people do

An organizer creates a fair, shares its code, and may list it publicly. They name each booth, write a description, and choose Small, Medium, or Large. Roam places booths with room between them and expands the hall when it becomes crowded. The organizer can move or delete booths and assign registered representatives.

A visitor can enter without an account and walk through the shared hall. Booths show their descriptions, representatives, and conversation state before the visitor opens an external meeting. In an **open group** call, the visitor enters the booth and opens its video link. In an **invite-only** call, they request a turn and keep exploring. The representative sees the waiting order and can invite up to three people at once. An invitation lasts two minutes. The [P3 beta journey](https://github.com/jellyfish-huntre/6.104-project/blob/21ea269/docs/p3-user-journey.md) follows both paths from a visitor’s point of view.

## The boundaries that keep this consistent

The seven concepts each own one concern: [Hosting](../app/design/concepts/Hosting.md) owns fairs; [Exhibiting](../app/design/concepts/Exhibiting.md) owns booths and representatives; [Navigating](../app/design/concepts/Navigating.md) owns presence and position; [Calling](../app/design/concepts/Calling.md) owns an active call and its link; [Queueing](../app/design/concepts/Queueing.md) owns requests and invitations; and [Authenticating](../app/design/concepts/Authenticating.md) and [Sessioning](../app/design/concepts/Sessioning.md) establish who is acting. [Roam’s composition](../app/design/compositions/Roam.md) combines their results for a task, rather than having one concept read another’s state.

I kept the meeting link in Calling, not in an invitation. Queueing decides whose turn it is, but an invitation only grants access to the *current* invite-only call. If the host closes the call or switches it to open group, an old invitation cannot retrieve a private link. This also lets one booth keep a waiting order when an invite-only host steps away. The call and queue pause together; an assigned representative can return within five minutes. An open group call instead closes when its host leaves. These rules make a person’s position in the fair matter, while the server checks identity, representative assignment, presence, and invitation status before releasing any link.

## What changed from the earlier designs

My [P1 design](https://github.com/jellyfish-huntre/6.104-project/blob/b0db400/docs/design.md) centered on movement and open conversations. It did not give a visitor a good next step when a representative was busy. Queueing and invite-only calls address that case without forcing the visitor to stay in a meeting or book in advance. The authorization rule above came from asking what should happen to an invitation after the underlying call changes.

Booth setup changed too. Asking organizers for coordinates, width, and height made them do map bookkeeping before they could describe an organization. Now they choose a size and Roam finds a spaced location; they can still move the booth afterward. A booth cannot move during a live or paused call, because doing so could move it out from under its host. The directory starts with collapsed booth rows so descriptions and organizer controls do not crowd the map.

The [P3 visual direction](https://github.com/jellyfish-huntre/6.104-project/blob/21ea269/app/design/visual-direction.md) explored a fairground that felt like a place rather than a form of grid cells. The final hall uses Kenney furniture and avatars, varied booth rugs and layouts, continuous floor tiles, and fractional walking around visible objects. It retains cells for booth placement, but the floor has no fixed paths for booths to cover. A minimap shows booths, people, and the visible part of the hall when the map expands.

## What the checks establish

I tested concept behavior against MongoDB and followed both conversation paths through HTTP and the browser. The checks include refused host actions, an expired invitation, a previously valid invitation after a call changes, booth moves and deletion, and walking collisions. [P4 testing and validation](p4-test-results.md) records the commands, results, and limits of that evidence, including which checks were local.

Roam controls access to a meeting link through its own app. Once someone has received the URL, Roam cannot remove them from the external meeting or revoke a copied link; the host must use the meeting provider’s controls for that.
