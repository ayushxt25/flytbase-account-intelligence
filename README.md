# FlytBase Account Intelligence

An evidence-first Sales Intelligence CRM for a sales manager reviewing Questathon accounts. It presents only source-backed facts, distinguishes reported claims from verified evidence, and keeps material unknowns visible.

## Architecture

Next.js App Router supplies the dashboard and four Vercel-compatible route handlers. A server-only JSON-RPC MCP client calls the Questathon Streamable HTTP endpoint. Upstash Redis stores raw MCP responses, the derived state, signal history, and a shared 65-second atomic cooldown reservation. Browser polling reads only `/api/state`; `/api/sync` decides whether an upstream call is eligible.

The first permitted sync fetches `get_my_accounts`; the next permitted sync fetches `get_all_paperwork`; later eligible syncs request `get_signals`. This deliberately obeys the one-upstream-request-per-token-per-minute contract. No request is made during builds.

## Setup

1. Copy `.env.example` to `.env.local` and fill in all values.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Click **Start secure ingestion**. Wait 65 seconds between the first and second ingestion requests.

Required variables:

- `AQ_TOKEN` — server-side Questathon bearer token.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — persistent cache and distributed lock.
- `ADMIN_SECRET` — required as `x-admin-secret` on `POST /api/notes`.

## API

- `GET /api/state`: safe cached dashboard state.
- `POST /api/sync`: performs a conditional, cooldown-protected synchronization.
- `POST /api/notes`: authenticated MCP `write_note` pass-through.
- `GET /api/health`: configuration-safe service status.

## Evidence and security

The normalization layer preserves source IDs and raw source records. The intelligence module counts a value only if it is verified and not merely an identified opportunity. All other values display as **Not substantiated**. Derived action priority is deterministic: source deadlines/blockers, evidence-ready moves, financial evidence gaps, then discovery.

MCP credentials are read only in server modules and never sent in responses. The write route requires the admin secret, reserves the shared cooldown before the upstream write, and does not mutate cached outcomes. During an outage the UI retains and labels stale cached state. If Redis is absent, it reports configuration failure rather than manufacturing data.

## Deployment

Deploy to Vercel, add the four environment variables in the project’s server environment, then call `/api/health`. Use a real Upstash instance shared across Vercel functions; in-memory state is intentionally not used.
