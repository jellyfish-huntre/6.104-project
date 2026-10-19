# P3 plan: Roam beta

P3 is due **Monday, October 19, 2026, at 11:59 PM Eastern**. The goal is a deployed beta whose front end, back end, and stored data support the complete intended user journeys. This is a working plan, not a record of completed work. Keep P1 and P2 submissions unchanged; make P3 changes in the current application, specifications, and new P3 artifacts.

Sources: [P3 assignment](https://61040.github.io/fa26/assignments/p3/), [deployment guide](https://61040.github.io/fa26/resources/deploying-apps/), and the rubrics for [implementation](https://61040.github.io/fa26/rubrics/implementing-concepts/), [testing](https://61040.github.io/fa26/rubrics/testing-validating/), [interaction design](https://61040.github.io/fa26/rubrics/interaction-design/), [visual design](https://61040.github.io/fa26/rubrics/visual-design/), and [technical writing](https://61040.github.io/fa26/rubrics/technical-writing/).

## Current starting point

- P2 supports fairs, booths, shared presence, and open group calls. The original journey also promises waiting at a busy booth while exploring and receiving a private invitation; the P2 notebook reserves that work for P3.
- The current front end and backend run on separate local ports. Deployment needs an externally reachable UI, API, and health check through the class platform's configured port.
- P1 feedback identified four points to apply to **new P3 work**: make bad situations concrete; cover the open-group path with reactions; keep visuals consistent with supported concepts; and open the journey with the student's frustration while naming or numbering its visuals. Proofread the final writing.

## Implementation progress (October 19)

The P3 application now has an invite-only call mode and a booth queue alongside the existing open-group path. Visitors can request or leave a turn, keep exploring, see a two-minute invitation countdown, and retrieve the current link after authorization. Representatives can stop new requests, view waiting and invited visitors, remove either, and invite the next one to three visitors in order. Host departure pauses the queue for five minutes; a representative can resume it, while deliberate closure or a switch to open group clears it. The current specifications, generated contracts, local API flow, and browser flow have been checked. The individual notebook, visual study, deployment, recording, and submission evidence remain separate tasks in the checklist below.

## Execution plan

### 1. Define the complete beta journey and its invariants

- [ ] Trace two end-to-end tasks: (a) discover an unfamiliar booth and join an open group call; (b) find a busy booth, request a turn, keep exploring, receive an invitation, and enter a private call.
- [ ] Inventory the concept actions, reactions, views, formers, endpoints, UI states, and access rules each task needs. Update the current `app/design/` specifications before implementation; keep concepts independent and let reactions coordinate them.
- [ ] Decide and document queue order, duplicate requests, withdrawal, host departure, invitation replacement or expiration, and who may see or redeem a private link. Do not claim that Roam can observe entry into an external video call.
- [ ] Record the key design tradeoff in the private design notebook: the issue, options, chosen refinement, and why it makes the behavior simpler or more consistent. This is the best opportunity to demonstrate Expert implementation judgment.

### 2. Build and check in increments

- [ ] Implement the missing concept and composition behavior, then the corresponding front-end state and controls. Keep identity and authorization checks in the backend. Do not depend on hidden buttons to protect a private link.
- [ ] After each small increment, run `bun run check:design`, regenerate contracts as needed, run `bun run check`, and exercise the affected journey in the UI. Review generated or agent-written changes before building on them.
- [ ] Keep current specifications, linked API documentation, generated contracts, and actual requests and responses in agreement. Use Git history and brief notebook entries to show why significant changes were made.

### 3. Make the interaction explain itself

- [ ] In the booth view, distinguish an open group conversation, a busy booth, a waiting request, and a private invitation. Show the next useful action beside each state.
- [ ] Give immediate feedback for requesting or leaving a turn, opening or closing a call, receiving an invitation, and failures. Explain unavailable actions and recovery steps.
- [ ] Walk through the fair as a first-time visitor without relying on verbal instructions. Check empty, invalid, closed-call, and expired-invitation states as well as the happy path. The Expert interaction target is to remove the visitor's uncertainty about whether or when they may approach a representative.

### 4. Test behavior and consequential risks

- [ ] Extend Bun concept tests so every completed concept's operational principle and every action are exercised. Add meaningful variants, repeated actions, cancellations, and refusals. Assert the exact outcome and that rejected operations do not change success-only state.
- [ ] Set up a separate, clean test database. Prepare state through concept actions rather than direct inserts; save the test run's output and explain how to reproduce it in the README.
- [ ] Run both full journeys through the interface, backend, and persistent database. Include erroneous inputs and another user attempting to read or change restricted data.
- [ ] Target a subtle risk, such as a stale private invitation after call closure or two visitors competing for one turn. Document the diagnosis, correction or justified conclusion, and a regression check. This is the Expert testing opportunity.

### 5. Deploy early and verify the exact commit

- [ ] Follow the deployment guide's **Before you start** checks. Ensure the deployed start command serves the UI, `/api/*`, and `/health` through the configured public port; check `PUBLIC_ORIGIN`, `MONGODB_URL`, the Bun version, lockfile, and committed source. Do not put local secrets or a video file in the public repository.
- [ ] Deploy an early working commit to the personal-project app on 6.1040 Apps. Allow for the first setup and deployment time; save the second app slot for the team project.
- [ ] Redeploy the final submitted commit. At its live URL, check both journeys, sign-in if used, error and access-control behavior, and persistence after a reload. Confirm the platform reports that the same commit is running.

### 6. Create and apply the visual study

- [ ] Assemble **two slides** from a diverse range of visual media: one collage for typography and one for color. Annotate choices in the margins.
- [ ] Translate selected choices into a coherent type, spacing, layout, and color system. Use hierarchy to make booths, availability, waiting, invitations, primary actions, success, and errors easy to scan. Check contrast and readability at the screen sizes used for the app and recording.
- [ ] Annotate the slides again to say which choices reached Roam and why. The Expert visual target is a fair screen whose overall organization and important details are apparent at a glance, with character suited to a live campus event.

### 7. Prepare the submission evidence

- [ ] Write a new beta user journey that starts with the student's concrete difficulty and follows actions the submitted app actually supports. Name or number every referenced new visual; explain or remove placeholders. Do not revise the P1/P2 submissions.
- [ ] Record an updated **narrated screen recording of at most two minutes** from the submitted beta. Demonstrate a useful complete task and keep the recording consistent with the deployed version. Upload it to YouTube and check the link opens for graders.
- [ ] Keep brief, contemporaneous entries in the private individual repository's design notebook: issues, options, decisions, checks, and unresolved limitations. Link that notebook from the private repository's README.
- [ ] Link the code/specifications, saved test output and instructions, visual study, updated journey, and video from this public repository's README. Commit and push both repositories. Submit both repository URLs and commit hashes, the video link, and deployed app URL through Commons.

## Final rubric review

| Skill | Evidence to look for before submission |
| --- | --- |
| Implementing a concept-based application | Both intended journeys work without refreshing; specs and API contracts match code; concept boundaries and backend access control hold; one difficult design refinement is explained. |
| Testing and validating software | Every action, principle, important variant, and rejection is asserted; both journeys and restricted access are checked through the UI and stored data; one subtle risk has a regression check; output is saved. |
| Interaction design | A first-time visitor can tell when to enter an open call or wait, what happened after acting, and how to recover from a mistake. |
| Visual design | The two annotated slides inform a readable, coherent interface whose hierarchy makes live booth states easy to grasp. |
| Technical writing | Journey, notebook, README, and study are precise, concrete, easy to follow, and proofread; all claims match the submitted version. |

## Time and scope decision

Start deployment preparation and the first deployment before visual polish or recording. Reserve the final period for validating the live commit and packaging evidence. If private invitations cannot be made reliable, revise the **current P3 scope, journey, and specifications** to describe a working group-call beta honestly, and identify the limitation. That fallback may reduce the chance of Expert ratings, so complete the full intended path if it can be validated before submission.
