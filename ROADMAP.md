# claude-fitbit Roadmap
> Tag key: `[Code]` = Claude Code · `[Cowork]` = Claude Cowork · `[Human]` = Charles must act

## 🔄 In Progress
<!-- nothing active right now -->

## 🔲 Backlog
- [ ] `[Human]` Create Fitbit developer app at dev.fitbit.com → run `node src/authorize.js` to authorize Charles
- [ ] `[Human]` Set GitHub secrets: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, NAS_SSH_PASSWORD, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
- [ ] `[Human]` Create NAS directory: mkdir -p /volume1/docker/claude-fitbit and place docker-compose.yml

## ✅ Completed
<!-- dated entries go here -->
- 2026-04-24 — Initial scaffold
- [x] `[Code]` 2026-04-25 — Define project game plan — CLAUDE.md, ROADMAP.md, README.md (features, tech stack, usage, MCP tool contracts)
- [x] `[Code]` 2026-04-25 — Implement Fitbit OAuth2 flow — `src/auth.js` (refresh + exchange), `src/tokenStore.js` (file-backed per-user tokens), `src/authorize.js` (CLI: opens browser, runs local callback server on :8770, saves token to tokens.json)
- [x] `[Code]` 2026-04-25 — Implement Fitbit API client — `src/api.js`: getSteps, getHeartRate, getSleep, getActivity hitting Fitbit v1/v1.2 endpoints; auto-refresh on every call via auth.refreshIfNeeded
- [x] `[Code]` 2026-04-25 — Define MCP tools: get_steps, get_heart_rate, get_sleep, get_activity, trend_summary — `src/server.js` (McpServer with zod schemas, default user via FITBIT_DEFAULT_USER, default date = today)
- [x] `[Code]` 2026-04-25 — Wire brian-mem integration — `src/memory.js`: storeMemory POSTs to ${BRIAN_MEM_URL}/memory with basic auth; trend_summary writes a tagged summary on every call
- [x] `[Code]` 2026-04-25 — Write unit tests for core logic — `tests/unit/api.test.js`: 4 tests covering getSteps/getHeartRate/getSleep/getActivity payload shaping (jest ESM with mocked axios + auth)
- [x] `[Code]` 2026-04-25 — Write integration tests for end-to-end flows — `tests/integration/server-dispatch.test.js`: 8 tests wiring createServer() to a Client over InMemoryTransport; covers all 5 MCP tools, default-user/date fallback, trend_summary aggregation + brian-mem write, per-day API failure resilience, and tool listing. All 12 tests pass.
- [x] `[Code]` 2026-04-25 — Fix Windows-incompatible `npm test` script — replaced `node_modules/.bin/jest` (unix shell wrapper) with `node_modules/jest/bin/jest.js` so tests run on both platforms

## 🚫 Blocked
<!-- log blockers here -->
