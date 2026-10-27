# Roam

Roam is a small online club and career fair that visitors can explore together. Booths show who is available to talk; visitors can join an open video conversation or request a turn at a busy booth without booking ahead. [Open the public app](https://roam.mit-sdg.dev/).

## Run locally

You need [Bun 1.4.2](https://bun.sh/) and Podman with Compose support. From a fresh clone:

```sh
bun install --frozen-lockfile
bun run --cwd app up
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). `up` builds the front end and back end, starts MongoDB, and waits for the app health check. On macOS, start your Podman machine first if it is stopped. To stop the containers while keeping local data, run `bun run --cwd app down`.

## Check the design and code

From the repository root:

```sh
bun run --cwd app check:design
bun run --cwd app generate
bun run --cwd app check
```

With the local containers running, use the MongoDB test database for concept and geometry tests:

```sh
cd app
MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/roam_test?authSource=admin' bun test src/concepts src/map-geometry.test.ts
```

The [P4 validation record](docs/p4-test-results.md) has the HTTP and browser journey commands, their saved results, and the limits of the local checks. Browser checks need Playwright Chromium; install it with `bunx playwright install chromium` if necessary. The scripts create uniquely named test accounts and unlisted fairs.

## Project materials

| Start here | What it contains |
| --- | --- |
| [Final design](docs/p4-final-design.md) | The problem, key design decisions, and changes since P1 and P3. |
| [P4 testing and validation](docs/p4-test-results.md) | Tests, commands, results, and evidence. |
| [Demo outline](docs/p4-demo-outline.md) | A narrated walkthrough of the public app, capped at three minutes. |
| [Concept specifications](docs/p4-final-design.md#the-boundaries-that-keep-this-consistent) and [composition](app/design/compositions/Roam.md) | The active concepts and reactions behind Roam. |
| [Type bindings](app/design/types.md) and [visual direction](app/design/visual-direction.md) | Shared design details. |

Earlier milestones: [P1 design](docs/design.md), [P2 MVP journey](docs/p2.md) and [recording](https://youtu.be/pUZtNpgzewI), [P3 beta journey](docs/p3-user-journey.md), [P3 test record](docs/p3-test-results.md), and [P3 recording](https://youtu.be/6scuKE0KmRM).
