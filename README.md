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
- **Server** Node.js + Express + Socket.IO (authoritative round timers & scoring)
- Logos rendered via the [Simple Icons](https://simpleicons.org) CDN

```
guessr/
├─ server/   # Socket.IO game server (rooms, questions, scoring)
└─ client/   # React front-end
```

## Getting started

From the project root:

```bash
npm install        # installs root + server + client dependencies
npm run dev        # starts the server (:3001) and client (:5173) together
```

Then open **http://localhost:5173**. To play with others on your network, share your
machine's LAN URL (Vite prints it) they connect to the same server.

> The client talks to the server at `http://localhost:3001` by default. Override with a
> `VITE_SERVER_URL` env var when deploying.

## Deployment

The game runs as a single Node web service on [Render](https://render.com) (see
[`render.yaml`](render.yaml)): the server serves both the Socket.IO API and the built client
at `devguessr.onrender.com`.

**https://devguessr.itaanhuys.com** is a small Cloudflare Worker ([`cloudflare/`](cloudflare))
on a custom domain that forwards every request, WebSockets included, to that Render service.
Cloudflare manages the DNS record and certificate. Game changes only need a Render deploy; the
Worker only needs redeploying if [`cloudflare/worker.js`](cloudflare/worker.js) changes:

```bash
npx wrangler deploy --config cloudflare/wrangler.jsonc
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run client + server in watch mode |
| `npm run build` | Type-check and build both packages |
| `npm test` | Build the server and run content, serialization, and gameplay regression tests |
| `npm start` | Run the built server |

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

---

## Support

If this saved you time or you just like it, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/dirtymasterchief)

---
