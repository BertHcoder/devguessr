# DevGuessr 🎮

[devGuessr](https://devguessr.onrender.com/)

A **guess game for developers**. Each round shows you something visual a syntax-highlighted
code snippet or a mystery brand logo — and you race your friends to guess the right answer
across three categories:

- **`</>` Language** — name the programming language from a code snippet
- **`⚙` Framework** — identify the framework/library from characteristic code
- **`★` Company** — unmask the company/brand from its logo silhouette

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
machine's LAN URL (Vite prints it) — they connect to the same server.

> The client talks to the server at `http://localhost:3001` by default. Override with a
> `VITE_SERVER_URL` env var when deploying.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run client + server in watch mode |
| `npm run build` | Type-check and build both packages |
| `npm start` | Run the built server |

## Adding questions

All content lives in [`server/src/gameData.ts`](server/src/gameData.ts). Add an entry to the
`languages`, `frameworks`, or `companies` arrays — multiple-choice options are generated
automatically from each category's answer pool. Company logos use a
[Simple Icons](https://simpleicons.org) `slug`.

---

## Support

If this saved you time or you just like it, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/dirtymasterchief)

---
