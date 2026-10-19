# Queueing

## Purpose

Let visitors ask for a turn at a busy place and continue exploring while a host chooses whom to invite.

## Principle

A host opens a queue for a place. A visitor joins once and can leave at any time. The host invites the next waiting visitor, or up to three by repeating that action. An invitation lasts two minutes and permits its recipient to request the current call link through the application. The host can stop new requests without discarding existing ones, or remove a waiting visitor. If no representative is available, the queue pauses for five minutes; it resumes if an eligible representative returns with an invite-only call, and otherwise closes. Queueing never stores or returns a meeting link.

## Types

```types
external Person
  A visitor waiting for or holding an invitation.

external Target
  The place for which people wait.
```

## State

```state
a set of Queues with
  a unique target Target
  an accepting Flag
  an optional pausedUntil String

a set of Requests with
  a person Person
  a target Target
  an order Number
  an optional invitedUntil String
  unique person and target

Rule: Waiting requests are offered in increasing order. An invited request still occupies the person's one slot at this target until they leave, are removed, or expire.
```

## Actions

```actions
open(target: Target) : returns ()
  where no queue exists at target
  then
    create an accepting, unpaused queue with no requests
    returns
  where a queue already exists
  then
    refuses ALREADY_OPEN "This queue is already open."

setAccepting(target: Target, accepting: Flag) : returns ()
  where an unpaused queue exists
  then
    change whether new visitors may join; preserve existing requests
    returns
  where the queue does not exist or is paused
  then
    refuses QUEUE_UNAVAILABLE "This queue is not accepting changes."

join(person: Person, target: Target) : returns (order: Number)
  where the queue does not exist, is paused, or is not accepting
  then
    refuses QUEUE_CLOSED "This booth is not taking new requests."
  where person already has a waiting or invited request at target
  then
    refuses ALREADY_WAITING "You already have a request at this booth."
  where the queue is accepting and person has no request at target
  then
    add a waiting request after all existing requests
    returns order

leave(person: Person, target: Target) : returns ()
  where person has a waiting or invited request at target
  then
    remove that request
    returns
  where person has no request at target
  then
    refuses NOT_WAITING "You have no request at this booth."

inviteNext(target: Target) : returns (person: Person, invitedUntil: String)
  where the queue is unpaused and has a waiting visitor
  then
    mark the earliest waiting request invited until two minutes after server time
    returns person, invitedUntil
  where no unpaused queue or waiting visitor exists
  then
    refuses NO_ONE_WAITING "No visitor is waiting for an invitation."

remove(person: Person, target: Target) : returns ()
  where person has a waiting or invited request at target
  then
    remove that request
    returns
  where person has no request at target
  then
    refuses NOT_WAITING "That visitor has no request at this booth."

pause(target: Target) : returns ()
  where a queue exists and is not paused
  then
    pause invitations and new requests until five minutes after server time; retain the queue and its requests
    returns
  where no queue exists
  then
    refuses NOT_FOUND "That queue is not found."

resume(target: Target) : returns ()
  where the queue is paused and server time is before pausedUntil
  then
    resume the queue with its previous accepting setting
    returns
  where the pause deadline has passed or no queue exists
  then
    refuses NOT_FOUND "That queue has closed."

expire(target: Target) : returns ()
  where a queue exists and its pause deadline has passed
  then
    close the queue and remove all its requests
    returns
  where a queue exists and its pause deadline has not passed
  then
    remove invitations whose two-minute deadline has passed, leaving those visitors free to request another turn
    returns
  where no queue exists
  then
    returns

close(target: Target) : returns ()
  where a queue exists
  then
    remove the queue and all its requests
    returns
  where no queue exists
  then
    refuses NOT_FOUND "That queue is not found."
```

## Queries

```queries
_status(target: Target) : optional (accepting: Flag, pausedUntil: String, waiting: Number)
  Gets the queue's public status and waiting count without names or invitations. pausedUntil is empty when unpaused. A queue past its pause deadline appears closed.

_mine(person: Person, target: Target) : optional (order: Number, invitedUntil: String)
  Gets only this person's waiting or unexpired invited request, and no row if it is absent or expired. invitedUntil is empty for a waiting request.

_waiting(target: Target) : many (person: Person, order: Number)
  Gets waiting visitors in order for an authorized representative; excludes invited or expired requests.

_requests(target: Target) : many (person: Person, order: Number, invitedUntil: String)
  Gets waiting and invited visitors in order for an authorized representative. invitedUntil is empty for a waiting request.

_invited(person: Person, target: Target) : one (invited: Flag)
  Answers whether this person has an unexpired invitation at this target.

_exists(target: Target) : one (exists: Flag)
  Answers whether a queue exists at this target, including a paused queue before its deadline.

_paused(target: Target) : one (paused: Flag)
  Answers whether the queue is paused and its five-minute deadline has not passed.

_targets(person: Person) : many (target: Target)
  Gets the places where this person has a waiting or invited request.
```
