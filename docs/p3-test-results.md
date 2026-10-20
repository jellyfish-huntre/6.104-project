# P3 testing and validation

## Reproduce the checks

From the repository root, run `bun install --frozen-lockfile` and `bun run --cwd app up` to start the local app and MongoDB. Then run these commands from `app/`:

```sh
bun run check:design
bun run generate
bun run check
MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/roam_test?authSource=admin' bun test src/concepts
API_URL=http://127.0.0.1:8080/api bun scripts/check-calling.ts
API_URL=http://127.0.0.1:8080/api bun scripts/check-invitations.ts
SCREENSHOT_DIR=../docs/p3-evidence bun scripts/check-browser-journeys.cjs
```

The browser script needs Playwright's Chromium browser. If it is not installed, run `bunx playwright install chromium` once. Concept tests create a unique temporary database for each file and drop it afterward. The HTTP and browser checks create uniquely named, unlisted test fairs and accounts in the local app database.

## Results on October 19, 2026

- **Concepts:** [35 tests passed, 0 failed, 182 assertions](p3-evidence/concepts.txt) across all eight concept source files. The added cases cover account verification refusal, ended and expired sessions, invalid call changes, rejected suspension and resume by a busy host, queue closure with stale invitations, simultaneous invitations, leaving then rejoining at the back of a queue, and reservation refusal and cancellation. Failed operations are followed by state checks where they could otherwise change a call, queue, or reservation.
- **HTTP:** The [open-group flow](p3-evidence/open-group-http.txt) and [invite-only flow](p3-evidence/invitations-http.txt) passed through the public API. They check the representative and visitor roles, host-only roster access, link privacy, duplicate and blocked requests, queue order, guest departure, host departure and return, call closure, and both mode changes.
- **Browser and storage:** The [browser run](p3-evidence/browser-journeys.txt) passed both complete attendee paths. An organizer signed in, entered the fair, walked into a booth, and opened each call mode. An attendee rejected an invalid fair code, entered the fair, walked into the booth, and opened the group video call. The attendee then requested a private turn, walked away while waiting, received an invitation after the representative stopped new requests, reloaded the page, and opened the private video call. Another attendee saw that the closed queue would not accept a new request. After the call check, the script advanced the attendee's local clock to confirm that an expired invitation is labeled and disabled. It checked the resulting call, queue, and invitation records directly in MongoDB. It also checked that the booth panel fits the desktop and mobile viewports and that the representative can scroll to the invitation control on mobile. Screenshots show the [group-call state](p3-evidence/open-group.png), [invitation state](p3-evidence/invite-only.png), and [mobile representative panel](p3-evidence/mobile-host.png).

The video provider is outside Roam, so the browser test intercepts the two `meet.example` URLs and verifies that the opened tab has the authorized URL. Roam cannot determine whether someone joins or leaves the external meeting, nor revoke a link already copied. The temporary test fairs remain unlisted in the local database because the app does not offer fair deletion.
