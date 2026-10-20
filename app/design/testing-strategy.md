# P3 testing strategy

Concept tests use a fresh named MongoDB database per test file and construct ordinary state through concept actions. Each Roam concept needs checks for its main principle, each action, meaningful repeated or refused operations, and the resulting state. In particular, a duplicate request must not change queue order, closing a queue must remove its requests, a denied link must stay private, and ending or expiring a session must prevent reuse.

The source tree also contains the older Reserving concept. Test its current reserve/cancel behavior here for source-wide coverage without editing earlier assignment submissions.

The complete local journeys begin from a new organizer and booth. One visitor discovers the booth and opens an open group call. In the other journey, visitors wait while moving through the fair, a representative invites them in order, one visitor opens the invite-only call, and another account cannot claim that link. Browser-visible results are checked alongside the persistent records. Test data uses unique names and does not alter earlier assignment submissions.
