# P4 testing and validation

## Consequential risk: an old invitation discloses a private link

An invited visitor may keep Roam open while a representative closes an invite-only call or switches the booth back to an open group call. A stale invitation must not retrieve the old private link, even if the visitor previously claimed it. This is easy to miss in a happy-path demonstration because the invitation is valid before either change.

The [HTTP regression](../app/scripts/check-invitations.ts) creates the fair, booth, call, queue, and invitation through public actions. It confirms the invited visitor can claim the link while the call is active. After the host closes the call, the script checks that the call and queue are absent and that signed-in and guest claims return **403**. It then switches a new invite-only call back to open group and checks that the queue is absent and another old claim returns **403**. An unrelated visitor's claim is also refused before closure; the intended visitor can still claim afterward, showing that the refusal did not consume the valid invitation.

The server's `ClaimInvitation` reactions require both an unexpired invitation for the acting person and a currently open `INVITE_ONLY` call. Queue closure removes requests, so an old invitation no longer satisfies that gate. No application change was needed for this risk; the new API assertions detect a regression in either the queue cleanup or link gate.

## Booth placement and organizer edits

The organizer chooses Small (2 × 2), Medium (3 × 2), or Large (4 × 3) when creating a booth. Roam ranks open positions to distribute booths around the hall, keeps a one-cell gap and expands a crowded hall by four cells on each axis before placing another booth. The expanded bounds persist and appear in the fair page. The database's unique cell index prevents overlaps, including concurrent attempts. The organizer can move a booth later by choosing its top-left map cell; the move retains its size. Invalid or overlapping moves leave the saved position unchanged. Roam also refuses a move during a live or paused call, so the host's presence remains consistent with the booth's location.

The directory starts with compact, collapsed booth rows. Opening a row reveals its description and map action; organizers can open a separate Manage booth section for editing. Deletion requires an inline confirmation. The organizer may delete an idle, live, or paused booth; Roam removes its representative assignments, call state, queue, and invitations. A stale call join attempt for that booth is refused.

The [concept test](../app/src/concepts/Exhibiting.test.ts) checks automatic positions and dimensions, spacing even when two organizers create booths concurrently, ownership, overlaps, map bounds, a successful move, and deletion. [Calling](../app/src/concepts/Calling.test.ts) and [Queueing](../app/src/concepts/Queueing.test.ts) test deletion cleanup for active and paused state. The [HTTP check](../app/scripts/check-booth-placement.ts) exercises the public endpoints, checks refused moves during live and paused calls, deletes idle, live, and paused booths, and verifies the saved fair page. The [browser check](../app/scripts/check-booth-ui.cjs) checks collapsed rows, moves a booth, and confirms deletion. Visual evidence: [collapsed booth directory](p4-evidence/booth-directory.png).

## Free walking and collision

The booth layout starts as a 10 by 10 grid and can grow as booths are added, while visitors now walk through fractional positions with held arrow keys or WASD. The browser animates movement between server updates, and the server limits each update by distance and elapsed time. Both free-walking and older one-cell endpoints check a shared set of plant and furniture collision shapes. Three stable booth variants change rug color, table and chair arrangement, and whether a potted plant appears. The browser and server derive the same furniture positions from the booth ID. Chair shapes follow the Kenney sprites inside their layout boxes; table shapes follow the visible rectangles; plant collision follows the pot rather than its leaves. No hitbox control or collision outline appears in the visitor interface. The avatar has a ground shadow without a visible collision circle. The map is square, so a grid cell has equal width and height. Booth membership also uses fractional positions, including for call access and host exit.

The [hall expansion browser check](../app/scripts/check-map-expansion.cjs) fills the original hall, adds another booth, then checks the larger fair page, map rendering, minimap booth markers, and click-to-pan viewport. The [geometry test](../app/src/map-geometry.test.ts) checks obstacle crossing, stable booth variants, corresponding collision shapes, and escape when a booth is moved onto a visitor. The [free-walking HTTP check](../app/scripts/check-free-walking.ts) checks speed limits, signed-in and guest moves, plant collision on both endpoint types, and closing a host call on booth exit. The [browser check](../app/scripts/check-free-walking-ui.cjs) samples a two-second key hold, checks for forward progress without snap-back, verifies server position and square cells, then makes rapid key taps and confirms no routine movement correction appears as a red error. It also confirms no hitbox control is shown. Visual evidence: [walking in the hall](p4-evidence/free-walking.png) and [two booth layouts](p4-evidence/booth-variants.png).

## Hall expansion check on October 27, 2026

The Exhibiting concept test passed with the new full-hall case: the hall expanded from 10 × 10 to 14 × 14, accepted a booth beyond the original bounds, allowed walking in the new area, and kept its extent when the concept was reloaded. The local browser check passed for the expanded fair page, map size, minimap markers, and click-to-pan. The booth directory and free-walking browser checks also passed after the change. `bun run check:design`, `bun run generate`, `bun run check`, and `git diff --check` passed.

## Checks run on October 26, 2026

- [Concept and geometry results](p4-evidence/concepts.txt): **43 passed, 0 failed, 238 assertions** across eight concepts and the shared map geometry. Calling checks call cleanup, Queueing checks paused invitation cleanup, Exhibiting checks organizer-only deletion and freed map cells, and geometry checks stable booth variants and their collision shapes.
- [Invitation and access-control HTTP results](p4-evidence/invitations-http.txt): the complete invite-only flow passed, including the stale-invitation regression, another visitor's denied claim, denied representative controls with unchanged state, and `401` for missing sessions.
- [Open-group HTTP results](p4-evidence/calling-http.txt) and [public-directory HTTP results](p4-evidence/public-fairs-http.txt): both passed, including call-link access and organizer-only listing changes.
- [Browser and storage results](p4-evidence/browser-journeys.txt): both visitor journeys passed in the local app. The script checks UI state, opened call URLs, reload persistence, MongoDB records, expired-invitation feedback, and desktop/mobile panel reachability. Saved screenshots: [open group](p4-evidence/open-group.png), [invitation](p4-evidence/invite-only.png), and [mobile host panel](p4-evidence/mobile-host.png).
- [Booth placement HTTP results](p4-evidence/booth-placement-http.txt) and [booth placement browser results](p4-evidence/booth-placement-ui.txt): size, move, collapsed directory, and confirmed delete flows passed locally, including overlap and ownership refusals.
- [Free-walking HTTP results](p4-evidence/free-walking-http.txt) and [free-walking browser results](p4-evidence/free-walking-ui.txt): continuous movement and shared collision checks passed locally.
- `bun run check:design`, `bun run generate`, `bun run check`, and `git diff --check` passed after the authorization and test changes.

## Reproduce locally

From the repository root, run `bun install --frozen-lockfile` and `bun run --cwd app up`. Then, from `app/`:

```sh
bun run check:design
bun run generate
bun run check
MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/roam_test?authSource=admin' bun test src/concepts src/map-geometry.test.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-calling.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-invitations.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-public-fairs.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-booth-placement.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-free-walking.ts
APP_URL=http://127.0.0.1:8080 bun scripts/check-booth-ui.cjs
APP_URL=http://127.0.0.1:8080 bun scripts/check-free-walking-ui.cjs
APP_URL=http://127.0.0.1:8080 bun scripts/check-map-expansion.cjs
SCREENSHOT_DIR=../docs/p4-evidence bun scripts/check-browser-journeys.cjs
```

The browser script requires Playwright Chromium. Test scripts create uniquely named, unlisted local fairs and accounts. Concept tests use temporary databases and remove them afterward. The browser script intercepts `meet.example` links to check that Roam opens the authorized URL; it cannot verify entry into the external meeting or revoke a URL already copied. These are **local** results. The final deployed commit still needs a separate live check of persistence, access control, and errors.

## October 27 deployment and regression follow-up

The first deployment of `b22f89725` built and started both processes, but the course platform reported that `/health` on port 3000 did not return HTTP 2xx. Its saved output shows the front end listening on port 3000 and the back end ready on port 4000. The exact failed response was not included in the saved logs, so the underlying database or proxy error cannot be identified from that attempt alone. The MongoDB binding now appears in settings as `MONGODB_URL`, the name Roam reads. Retrying the **same commit** with the current settings succeeded, and the platform marked it Live. This rules out a build failure and a permanent port mismatch; it does not prove which transient setting or database condition caused the first failure. The next commit logs the error *type* once when the database health probe fails, then logs recovery, without printing the connection string. It also caps each worker's MongoDB pool at four connections against the platform's ten-connection allowance.

The latest local run passed `bun run check:design`, `bun run generate`, `bun run check`, and 45 concept/geometry tests with 250 assertions. The booth management browser test passed, including positive feedback for a moved and deleted booth. The full host/visitor browser journey passed with both call modes, an invitation after reload, and an expired invitation. That journey now uses a 2 × 2 booth; a fixed-duration walk into a 1 × 1 booth was timing-sensitive in one run. The browser journey uses MongoDB assertions locally and the public API plus browser reload when run against a deployed URL. Bun loads the local `.env` automatically, so the script ignores its MongoDB URL when `APP_URL` points to a public host.

## Live checks on October 27, 2026

The platform marked `b22f89725` Live before these runs. With `API_URL=https://roam.mit-sdg.dev/api`, the invitation HTTP check passed, including unauthorized host controls, refused outsider claims, guest departure, pause/resume, mode switch, and stale-invitation denial. The booth-placement HTTP check passed, including automatic placement, moves refused during live or paused calls, ownership, and deletion cleanup. With `APP_URL=https://roam.mit-sdg.dev`, the host/visitor browser journey passed both call modes, an invitation after reload, an expired invitation, and mobile panel reachability. The map expansion check passed its larger fair page, minimap markers, and click-to-pan; the free-walking browser check passed square cells, smooth movement, server position sync, and the absence of hitbox controls. Each script made uniquely named, unlisted public test fairs and accounts.

The first live browser run stopped just outside a booth at position `(0, 0.463)`; the booth begins at `y = 0.5`. Increasing the simulated key hold to 700 ms for the 2 × 2 test booth let the deployed server confirm entry. A later run reached the invitation but accidentally compared live behavior with **local** MongoDB because Bun had loaded `.env`; the script now restricts direct MongoDB inspection to localhost. The final live run passed using the public UI and API. These were test-harness defects, not evidence that booth access or invitation persistence failed in Roam.

For the final live validation, set `APP_URL=https://roam.mit-sdg.dev` and `API_URL=https://roam.mit-sdg.dev/api` when running the HTTP and browser scripts above. Wait until the deployment page identifies the intended commit as Live before running them. Save the command output and record the exact commit here. These scripts create unlisted test fairs and accounts in the public database. The new health/feedback commit `cc16ffc` needs its own live check once deployed; the results above establish `b22f89725`.
