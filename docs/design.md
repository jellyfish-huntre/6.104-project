# Problem Framing and Stakeholders

## Domain

At a campus fair, students explore organizations they may want to join or employers they may want to work for. They usually arrive with incomplete information: a student may know a few names, but a short conversation can reveal what a club actually does, what a role involves, or whether an organization is a good fit. Representatives answer questions, introduce their organizations, and hope to meet students who might not have sought them out otherwise. Organizers bring these groups together for a limited time and try to make it possible for attendees to discover them.

In an online fair, the organizer must give attendees a way to find organizations and reach their representatives. A small fair might distribute a directory of descriptions and video-call links. A larger fair might use scheduled one-to-one sessions, group sessions, or virtual booths. The focus here is the _exploratory, live part_ of such events: a student moves among organizations, decides whom to approach, has a brief conversation, and then continues exploring. It applies to both club and career fairs, though a career conversation can have higher stakes and may require more privacy.

## Bad situations

A student joins an online club fair with an hour to explore. They recognize two organizations in the directory and open one of their calls. The representatives are already talking with other attendees, so the student cannot tell whether to interrupt or wait. They leave and open another link, which leads to an empty room. After several such attempts, they return to the familiar organizations and leave the event. A club they might have liked was present, but the student never found a comfortable moment to ask what it does. The club's representatives also miss a potential member. The harm is the loss of a useful encounter during a short event.

A career fair can produce a related situation. A student learns of an employer during the event and wants to ask whether a role fits their interests. The relevant one-to-one sessions were booked earlier, while a group presentation does not give the student a clear chance to ask a personal question. The student may leave with only the information already available on the employer's website, and the employer never learns of the student's interest. This scenario does not imply that all career-fair platforms work this way; it identifies the kind of missed encounter the project would need to prevent.

Visitors cannot be spontaneous in their conversations with hosts and booths. Especially when visitors greatly outnumbers representatives, it is hard to get a conversation without booking a slot in advance, which causes additional friction.

## Corroboration

There is evidence that live interaction matters in career events, alongside important limits on what that evidence proves. A [National Association of Colleges and Employers report](https://www.naceweb.org/uploadedFiles/files/2021/publication/nace-2021-succeeding-in-the-new-normal-student-attitudes-and-effective-virtual-recruiting.pdf) found that students in its pre-pandemic research rated virtual recruitment events poorly as a source of job information. In focus groups across 14 universities, students who had attended virtual fairs repeatedly identified the inability to engage one-to-one with employers as a major dissatisfaction. The report supports the importance of meaningful conversation.

## Workarounds and comparables

With a directory of Zoom or Google Meet links, attendees can open rooms one by one or message an organizer for direction. This is simple for a small event, but a link alone cannot tell candidates who is available to talk, what conversation is underway, or whether joining is welcome. Organizers can publish a schedule or ask representatives to post status updates, but that adds work during a brief event.

Existing products cover substantial parts of this problem. [Handshake virtual fairs](https://support.joinhandshake.com/hc/en-us/articles/360051394454-Signing-Up-for-Managing-Virtual-Fair-Sessions) support scheduled group and one-to-one employer sessions and are useful when attendees plan whom to meet in advance. However, this project focuses on what happens to an attendee who discovers an unfamiliar organization during the fair and has no booked conversation. [Zoom Events Expo](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067819) offers some functionality with booths and live sessions. The remaining opportunity is a simpler way for fairs and events to show which representatives are ready for a short conversation and help an attendee enter one without interrupting or committing to a schedule in advance.

## Solution sketch

A possible solution is a small virtual fairground where attendees move avatars among organization booths. From outside a booth, a student could see whether representatives are present and whether a conversation is open, then approach, listen or ask a question, and move on without arranging a meeting in advance. This could make exploratory conversations easier to discover and enter during a short fair. This sketch depends on validating the missed-encounter scenario with real attendees and organizers.

## Stakeholders

- **Attendees:** Students exploring clubs or employers and deciding where to spend their limited time and attention.
- **Organization representatives:** Club members or employer staff who explain opportunities and meet potential members or applicants.
- **Event organizers:** Career-center staff, student leaders, or other hosts who recruit organizations, arrange the event, and help attendees navigate it.

# Application Pitch

**Roam** is a virtual fairground for small online career and club fairs. Students should be able to discover an unfamiliar organization, see when its representatives are ready to talk, and begin a short conversation without booking a meeting beforehand. Roam helps turn a directory of names and links into an event people can explore together.

**Explore.** Attendees move avatars through a shared space of organization booths. They can notice booths they did not already know to search for and move between them as their interests change. This gives students more chances to discover a fitting club or employer, while giving representatives a chance to meet visitors outside their existing audience.

**Read the room.** Each booth makes its current activity visible before a visitor enters: whether a representative is present and whether a conversation is open to newcomers. Students can choose where to spend their limited time without repeatedly entering empty rooms or interrupting a discussion. Representatives can signal when they are ready to welcome someone, and organizers can see where attendees may need help finding a conversation.

**Approach.** A visitor can join an open discussion or signal interest at a busy booth. When a representative is ready, they can welcome the visitor for a short conversation or invite several interested visitors to hear an answer together. Attendees get a clear way to make contact, and representatives can give attention to waiting visitors without requiring everyone to reserve a slot in advance. Visitors can then leave and keep exploring the fair.

# Concept Specifications and Reactions

## Navigating

```text
concept Navigating [Person, Space, Position]
purpose let users move around a shared space/event and know where they are
principle a user enters the space at a starting position,
  moves around the open area and up to booths, then leaves when done

state
  a set of present Persons with
    a Space
    a Position

actions
  enter(person: Person, space: Space)
    where person is not already present
    then records person in space at its starting position

  move(person: Person, destination: Position)
    where person is present and destination is reachable from
      their current position
    then changes person's position to destination

  leave(person: Person)
    where person is present
    then removes person's space and position
```

## Exhibiting

```text
concept Exhibiting [Person, Space, Position]
purpose let organizations set up booths for visitors to find them
principle an organizer sets up a booth with a description and representatives;
  visitors can find the booth and see who is ready to talk

state
  a set of Booths with
    a Space
    a Position
    a name String
    a description String
    an organizer Person
    a representatives set of Person
    a readyRepresentatives set of Person
    Rule: readyRepresentatives must also be representatives

actions
  create(organizer: Person, space: Space, position: Position,
    name: String, description: String): returns (booth: Booth)
    where no booth exists at position in space
    then creates and returns a booth with the given organizer, space,
      position, name, and description; its representative sets are empty

  edit(organizer: Person, booth: Booth, name: String, description: String)
    where booth exists and organizer owns it
    then changes the booth's name and description

  addRepresentative(organizer: Person, booth: Booth, representative: Person)
    where booth exists and organizer owns it
    then adds representative to the booth

  removeRepresentative(organizer: Person, booth: Booth, representative: Person)
    where booth exists and organizer owns it and representative belongs to it
    then removes representative from the booth and from its ready set

  setReady(representative: Person, booth: Booth, ready: Flag)
    where booth exists and representative belongs to it
    then adds representative to the ready set if ready is true,
      or removes them if ready is false
```

## Queueing

```text
concept Queueing [Person, Target]
purpose let visitors get a turn to talk when a target is busy
principle a visitor joins the queue for a target; when someone is ready,
  the first waiting visitor is called, or the visitor leaves the queue

state
  a seq of Requests with
    a person Person
    a target Target
    unique person and target

actions
  join(person: Person, target: Target)
    where person is not already waiting for target
    then adds person to the end of the queue for target

  leave(person: Person, target: Target)
    where person is waiting for target
    then removes person from the queue for target

  callNext(target: Target): returns (person: Person)
    where someone is waiting for target
    then removes and returns the first person waiting for target
```

## Conversing

```text
concept Conversing [Person, Place]
purpose let people have short one-to-one or group conversations
principle a host starts an open group or private one-to-one conversation;
  people join when welcome, then leave when done

types
  Mode is OPEN_GROUP or PRIVATE_ONE_TO_ONE

state
  a set of Conversations with
    a Place
    a host Person
    a mode Mode
    a members set of Person
    an optional invited Person

actions
  start(host: Person, place: Place, mode: Mode):
    returns (conversation: Conversation)
    where host is not already in a conversation
    then creates a conversation with host as its first member and returns it

  invite(host: Person, conversation: Conversation, person: Person)
    where conversation exists, host started it, mode is PRIVATE_ONE_TO_ONE,
      and only the host is a member
    then records person as invited, replacing any earlier invitation

  join(person: Person, conversation: Conversation)
    where conversation exists, person is not already in any conversation,
      and either mode is OPEN_GROUP or person is invited
    then adds person as a member and clears their invitation if present

  leave(person: Person, conversation: Conversation)
    where conversation exists, person is a member, and person is not the host
    then removes person from its members

  end(host: Person, conversation: Conversation)
    where conversation exists and host started it
    then removes the conversation
```

## Reactions

`Requesting.callNext` below is a representative's request. `Queueing.callNext`
is run only after the request passes the checks in the first reaction.

```text
when Requesting.callNext(representative, booth)
where Exhibiting: representative is ready at booth
  and Conversing: representative is not in a conversation
  and Queueing: someone is waiting for booth
then Queueing.callNext(booth): (visitor)
     Conversing.start(representative, booth, PRIVATE_ONE_TO_ONE):
       (conversation)
     Conversing.invite(representative, conversation, visitor)

when Conversing.start(representative, booth, PRIVATE_ONE_TO_ONE):
  (conversation)
where Exhibiting: representative belongs to booth
then Exhibiting.setReady(representative, booth, false)

when Navigating.leave(person)
where Queueing: person is waiting for target
then Queueing.leave(person, target)

when Navigating.leave(person)
where Conversing: person is a member but not the host of conversation
then Conversing.leave(person, conversation)

when Navigating.leave(person)
where Conversing: person hosts conversation
then Conversing.end(person, conversation)
```

After ending a private conversation, a representative can mark themselves ready
again when they want to take another visitor.

## How the concepts fit together

Roam uses the same `Person`, `Space`, and `Position` across its concepts. A
`Space` is the fairground, and `Exhibiting` places booths at positions in it.
`Navigating` lets people move through the fair, while `Exhibiting` tells visitors
what each booth is and which representatives are ready to talk.

A booth is the `Target` in `Queueing` and the `Place` in `Conversing`. A visitor
can wait for a booth while continuing to explore because the queue does not
depend on their position. When a representative calls the next visitor, a
reaction starts a private conversation and invites that visitor. Visitors can
also join an open group conversation directly. Reactions update readiness when
a private conversation starts and remove people from queues and conversations
when they leave the fair.

# UI Sketches

## General Space

![Top-down view with booths and availability](sketches/general-space.png)

The shared map puts booths around a main path. Users can see booth names and
whether conversations are open.

## Booth view

![A space within the larger map where you can interact with reps](sketches/booth-view.png)

The booth view where you actually interact with reps and see setup resources. Resume drops and other features can live here.

## Misc

![A side panel for booths and notifications for queues](sketches/misc.png)

Pop ups and panels that display relevant information for the user.

# User Journey

Adam Sun has an hour to explore an online club fair. He enters Roam and moves his avatar around the map. He can read club descriptions and their availability to talk.

Chinese Students Club (CSC) catches his attention. A rep is hosting an open group conversation, so Adam joins, listens to another student’s question, and asks what events the club does. He then leaves the conversation and continues exploring.

At another booth, the rep is busy. Adam Sun joins its queue and visits other booths while he waits. When the representative calls him, he joins a short private conversation and asks a question specific to his interests. He leaves with more information about the clubs, including ones he had not known about before the fair.
