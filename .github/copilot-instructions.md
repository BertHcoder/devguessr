# DevGuessr — Project Guidelines

GeoGuessr-style multiplayer guessing game. See [README.md](../README.md) for the full overview.

## Architecture

- npm **workspaces** monorepo: `server` (Cloudflare Worker + Durable Objects) and `client` (Vite + React).
- Deploy both parts together using the root `wrangler.jsonc`. Each game room has one SQLite-backed Durable Object; persist state before broadcasting and use alarms for deadlines.
- The **server is authoritative** for round timers, reveals, and scoring. Never trust client-sent scores or timing; the client only sends the player's choice.
- Answers must never reach the client mid-round: send `PublicQuestion` (answer/bugLine stripped), not `Question`. See `toPublicQuestion` in [server/src/rooms.ts](../server/src/rooms.ts).

## Conventions

- **ESM everywhere** (`"type": "module"`). Server imports use explicit `.js` extensions on relative paths (e.g. `import { getRoom } from './rooms.js'`) even though the source is `.ts`. Keep this.
- Shared types are **duplicated** in [server/src/types.ts](../server/src/types.ts) and [client/src/types.ts](../client/src/types.ts) — when you change one, update the other to match.
- Game content (questions, logos, answer pools) lives only in [server/src/gameData.ts](../server/src/gameData.ts). Multiple-choice options are generated from each category's answer pool — add entries there, don't hardcode options.
- Client connects through the shared native WebSocket transport in [client/src/socket.ts](../client/src/socket.ts). Always use the same origin; Vite proxies to Wrangler on `:3001` in dev. Don't add external server URLs or additional socket instances.

## Build and Run

Run from the repo root:

- `npm run dev` — server (:3001) + client (:5173) in watch mode
- `npm run build` — type-checks and builds both packages; run before considering work done
- `npm run check` — generates Cloudflare types and type-checks both packages
- `npm test` — builds and runs content regressions plus real Cloudflare-runtime multiplayer tests
- `npm run deploy` — builds and deploys the complete app to Cloudflare
- Target a single package with `--workspace server` or `--workspace client`
