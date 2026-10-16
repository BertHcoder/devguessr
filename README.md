# DevGuessr 🎮

[devGuessr](https://devguessr.itaanhuys.com/)

A **guess game for developers**. Each round shows you something visual a syntax-highlighted
code snippet or a mystery brand logo and you race your friends to guess the right answer
across seven categories:

- **`</>` Language** name the programming language from a code snippet
- **`⚙` Framework** identify the framework/library from characteristic code
- **`★` Company** unmask the company/brand from its logo silhouette
- **Spot the bug** identify the broken line in a code snippet
- **Name the ritual** recognize developer habits and phenomena
- **Production incident** diagnose a symptom using a short log and deployed code diff
- **AI, models & agents** identify model families, agent patterns, protocols, and practical AI concepts

Production incidents use scenario-specific root-cause choices. The 15-second reveal explains
the fix and why a tempting alternative does not fit the evidence. Incident evidence stays
readable during progressive reveal; optional smoke power-ups still apply.

AI questions also stay readable during progressive reveal and have a 10-second review.
The category includes MCP, A2A, Agent Skills, RAG, tool execution, prompt injection,
evaluation, open weights, distillation, and model families. Time-sensitive catalog
questions explicitly include their snapshot date instead of making undated "latest"
or "best model" claims.

Points reward both **accuracy and speed**, with **streak bonuses** for consecutive correct
answers, live standings, confetti, and a final podium.

## Play together

Create a room, share the 4-letter code, and everyone answers the same questions in real time.
You can also play **solo** (just start a room by yourself) to practice.

## Tech stack

- **Client** Vite + React + TypeScript, `react-syntax-highlighter`, `canvas-confetti`
- **Server** Cloudflare Worker + one SQLite-backed Durable Object per room
- **Multiplayer** Native WebSockets with hibernation, persisted game state, and authoritative alarm-based timers & scoring
- Logos rendered via the [Simple Icons](https://simpleicons.org) CDN

```
guessr/
├─ server/          # Worker, Durable Object rooms, questions, scoring, tests
├─ client/          # React front-end
└─ wrangler.jsonc   # Static assets + multiplayer, deployed together
```

## Getting started

From the project root:

```bash
npm install        # installs root + server + client dependencies
npm run dev        # builds initial assets, then starts Wrangler (:3001) + Vite (:5173)
```

Then open **http://localhost:5173**. To play with others on your network, share your
machine's LAN URL (Vite prints it); they connect to the same server.

The client always uses the website's own origin. Vite proxies `/api` (including WebSockets)
and `/health` to Wrangler locally, so LAN clients work without a separate server URL.
Node.js 22 or later is required for development.

## Deployment

The entire application runs on **Cloudflare** at **https://devguessr.itaanhuys.com**:

- Workers Static Assets serves the built client directly.
- `/api/rooms/new` creates a room over a native WebSocket; `/api/rooms/CODE` joins one.
- Each room has its own Durable Object, sharing state across players and Cloudflare locations.
- Room state is saved before events are sent. Hibernating WebSockets retain their player IDs.
- Durable Object alarms advance rounds and reveals, including extended freeze deadlines.
- The last player's departure deletes the room's state and alarm. Unclaimed rooms expire.
- `/health` reports Worker availability. Unknown API paths return errors, never the SPA.

Cloudflare manages the custom domain's DNS record and certificate. There is no separate
game-server host, proxy origin, container, or server URL environment variable.
Unlike a static-only site, multiplayer uses Durable Objects and is subject to Cloudflare's
Workers/Durable Objects plan limits and pricing.

From the repository root, authenticate once and deploy both parts together:

```sh
npx wrangler login
npm run check
npm test
npm run deploy
```

[`wrangler.jsonc`](wrangler.jsonc) includes the SQLite Durable Object migration. Keep applied
migration tags intact in future updates. Local state lives in the ignored `.wrangler/` directory;
it is neither committed nor uploaded. Worker types are generated locally by Wrangler.

The [deployment workflow](.github/workflows/deploy.yml) checks and tests pull requests, then
deploys pushes to `main`. Configure the repository secrets `CLOUDFLARE_API_TOKEN` (Workers
deployment permissions) and `CLOUDFLARE_ACCOUNT_ID` before relying on automatic deployment.
Local OAuth login does not configure GitHub Actions secrets.

Hibernation preserves a connected game. An actual network disconnect removes that player
and transfers host ownership if needed; the client returns home with an error and retries
server availability. Rejoin while the room is still in the lobby, or start a new room.
Live connections may disconnect during deployments, so deploy between games.

## Scripts

| Command          | Description |
| ---------------- | ----------- |
| `npm run dev`    | Run Vite + the local Cloudflare runtime in watch mode |
| `npm run check`  | Generate Worker types and type-check both packages |
| `npm run build`  | Type-check and build both packages |
| `npm test`       | Build and run content + real Cloudflare-runtime multiplayer tests |
| `npm start`      | Build and serve the complete app locally on port 3001 |
| `npm run deploy` | Build and deploy the complete app to Cloudflare |

## Adding questions

All content lives in [`server/src/gameData.ts`](server/src/gameData.ts). Add an entry to the
`languages`, `frameworks`, or `companies` arrays multiple-choice options are generated
automatically from each category's answer pool. Company logos use a
[Simple Icons](https://simpleicons.org) `slug`.

Production incident questions live in the `incidents` array in the same file. Include a
symptom in `prompt`, `incident.logs`, `incident.diff`, an `answer`, and three plausible
`distractors`. Choices are shuffled per game; the `fact` explains the root cause, fix,
and why the tempting wrong answer fails. Answers, authored distractor metadata, and
facts stay server-side until the answer and fact are sent at reveal.

### Content review

The question bank was manually reviewed on **2026-10-16**. The review checked prompts,
answers, bug-line locations, explanations, legacy API context, and logo availability.
Corrections include the cancelled Figma acquisition, the Python scope and shallow-copy
answers, the Zig newline escape, Svelte 5 syntax, Remix v2 context, and unsupported
popularity and licensing claims. Logo questions for OpenAI, Slack, and Heroku were
removed because their icons are absent from the installed Simple Icons catalog.
All 69 retained logo URLs also returned SVG responses from the live CDN during
the review; future CDN changes can still affect availability.

`CONTENT_REVIEWED_ON` and each exported question's `reviewedOn` record the review date.
New AI questions and new framework examples retain primary-source URLs in `sources`.
Those URLs and review metadata are server-only: they must not reveal answers mid-round.
Recheck dated model questions against their linked catalogs before changing their date.
The remaining bank mixes historical facts with current concepts, not just new releases.

`npm test` exercises every question's generated choices and public serialization,
checks packaged logo availability and review metadata, and verifies AI scoring,
replay variety, and 50/50 behavior. It also executes the JavaScript bug demonstrations
before and after their indicated repairs. Other languages were reviewed manually;
this is not a compilation test of every language or a live CDN availability check.

The Cloudflare integration tests use Wrangler's local Workers runtime, including the real
Durable Object binding and static-asset routing. They cover room isolation, host permissions,
capacity, malformed messages, hibernation, scoring, timed reveals, freeze extensions, game
completion, restart, host transfer, and empty-room cleanup.

---

## Support

If this saved you time or you just like it, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/dirtymasterchief)

---
