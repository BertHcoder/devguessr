# DevGuessr — Project Guidelines

GeoGuessr-style multiplayer guessing game. See [README.md](../README.md) for the full overview.

## Architecture

- npm **workspaces** monorepo: `server` (Node + Express + Socket.IO) and `client` (Vite + React).
- The **server is authoritative** for round timers, reveals, and scoring. Never trust client-sent scores or timing; the client only sends the player's choice.
- Answers must never reach the client mid-round: send `PublicQuestion` (answer/bugLine stripped), not `Question`. See `toPublicQuestion` in [server/src/rooms.ts](../server/src/rooms.ts).

## Conventions

- **ESM everywhere** (`"type": "module"`). Server imports use explicit `.js` extensions on relative paths (e.g. `import { getRoom } from './rooms.js'`) even though the source is `.ts`. Keep this.
- Shared types are **duplicated** in [server/src/types.ts](../server/src/types.ts) and [client/src/types.ts](../client/src/types.ts) — when you change one, update the other to match.
- Game content (questions, logos, answer pools) lives only in [server/src/gameData.ts](../server/src/gameData.ts). Multiple-choice options are generated from each category's answer pool — add entries there, don't hardcode options.
- Client connects to the server via the shared `socket` from [client/src/socket.ts](../client/src/socket.ts) (origin in prod, `:3001` in dev). Don't create new socket instances.

## Build and Run

Run from the repo root:

- `npm run dev` — server (:3001) + client (:5173) in watch mode
- `npm run build` — type-checks and builds both packages; run before considering work done
- Target a single package with `--workspace server` or `--workspace client`
