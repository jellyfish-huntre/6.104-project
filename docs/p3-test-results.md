# P3 queue and calling checks

Run these from `app/` with the local MongoDB service and API running. The integration scripts create unlisted test fairs and fresh test accounts.

```sh
bun run db:up
bun run check:design
bun run generate
bun run check
bun test src/concepts
PORT=4000 bun src/main.ts
# In another terminal:
bun scripts/check-calling.ts
bun scripts/check-invitations.ts
```

On October 19, 2026, the design and application checks passed. The full concept suite reported **27 pass, 0 fail, 132 assertions**. The existing open-group HTTP flow passed. The invitation HTTP flow passed with FIFO ordering, duplicate refusal, refusal of a representative's request at their own booth, host-only roster access, link refusal before invitation, group-route bypass refusal, signed-in link claim, accepting toggle, removal of an invited guest, deliberate closure, both mode switches, and removal of a guest's request on fair departure. After a representative left and returned to the booth, Roam automatically resumed the paused call and queue without a new link; an invited visitor received the original link. A focused Calling test also covers link retention, resumption by another host, and explicit close.

In the local browser, a representative switched an open-group call to invite-only, requested a turn, saw the persistent waiting request, sent an invitation, saw the countdown and invited roster state, and retrieved the link. After the representative restriction was added, the booth view showed host controls without a request button. The interface was also inspected at the fair map and selected booth. The API flow separately checked the guest path and cross-user restrictions.

The two-minute deadline controls retrieval through Roam. Roam cannot determine whether someone actually joins or leaves the external video meeting or revoke a link that was already copied.
