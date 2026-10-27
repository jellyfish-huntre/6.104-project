# P4 handoff

This page is the entry point for the current P4 work. The [final design summary](p4-final-design.md) explains the problem, user journeys, concept boundaries, reactions, and design changes. It links the active concept specifications; the [composition](../app/design/compositions/Roam.md) records their reactions, and the [type bindings](../app/design/types.md) describe shared terms. Earlier P1 and P2 documents remain in the repository as historical submissions.

The [testing and validation record](p4-test-results.md) links the commands, local results, and saved visual evidence for call access, invitations, booth placement, and walking. The [live app](https://roam.mit-sdg.dev/) is the demo entry point.

## Before submitting

- Check the deployed commit separately: account creation, a public seeded fair, both call modes, booth placement and movement, walking and collisions, access refusals, and persistence after reload. Record the live result in the testing document. Its current results are local.
- Record the final narrated demo video and link it from the README.
- Make sure the design summary, test record, evidence, specs, and deployed app all describe the same commit.
- Commit and push the intended files, then use that commit hash in the course submission form. The [course guide](https://61040.github.io/fa26/guide/) describes this submission step.

The current [testing document](p4-test-results.md) states what the local checks establish and what still needs a live check. A saved screenshot or a passing local script does not establish the behavior of the deployed commit.
