# claude-fitbit Roadmap
> Tag key: `[Code]` = Claude Code · `[Cowork]` = Claude Cowork · `[Human]` = Charles must act

## 🔄 In Progress
- [ ] `[Code]` Define project game plan

## 🔲 Backlog
- [ ] `[Human]` Create Fitbit developer app at dev.fitbit.com → run `node src/authorize.js` to authorize Charles
- [ ] `[Code]` Implement Fitbit OAuth2 flow — auth.js + tokenStore.js + authorize.js CLI
- [ ] `[Code]` Implement Fitbit API client — steps, heart rate, sleep, activity endpoints (api.js)
- [ ] `[Code]` Define MCP tools: get_steps, get_heart_rate, get_sleep, get_activity, trend_summary (server.js)
- [ ] `[Code]` Wire brian-mem integration — write health records on tool call (memory.js)
- [ ] `[Code]` Write unit tests for core logic
- [ ] `[Code]` Write integration tests for end-to-end flows
- [ ] `[Human]` Set GitHub secrets: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, NAS_SSH_PASSWORD, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
- [ ] `[Human]` Create NAS directory: mkdir -p /volume1/docker/claude-fitbit and place docker-compose.yml

## ✅ Completed
<!-- dated entries go here -->
- 2026-04-24 — Initial scaffold

## 🚫 Blocked
<!-- log blockers here -->
