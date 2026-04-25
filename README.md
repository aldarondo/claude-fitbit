# claude-fitbit

MCP server that pulls activity, heart rate, sleep, and body data from Fitbit and stores it in brian-mem for use by family health skills.

## Features

- **`get_steps`** — daily step count, active minutes, floors, distance
- **`get_heart_rate`** — resting heart rate, zone minutes (fat burn / cardio / peak)
- **`get_sleep`** — sleep duration, efficiency, stage breakdown (deep/light/REM/awake)
- **`get_activity`** — calories burned, active calories, exercise minutes
- **`trend_summary`** — multi-day aggregate across all metrics, written to brian-mem

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 (ESM) |
| MCP SDK | @modelcontextprotocol/sdk |
| HTTP | Express.js + axios |
| Auth | OAuth 2.0 with per-user auto-refresh |
| Container | Docker + docker-compose + GHCR |
| Memory | brian-mem (POST /memory) |

## Getting Started

### 1. Create a Fitbit Developer App

1. Go to [dev.fitbit.com](https://dev.fitbit.com/apps/new)
2. Create a **Personal** app
3. Set OAuth 2.0 Callback URL to `http://localhost:8770/callback` (local) or your NAS URL
4. Note the **Client ID** and **Client Secret**

### 2. Configure environment

```bash
cp .env.example .env
# fill in FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET
```

### 3. Authorize a user

```bash
npm install
node src/authorize.js
# Opens browser → Fitbit login → saves token to tokens.json
```

### 4. Run locally

```bash
npm start        # stdio MCP (for Claude Code)
npm run serve    # HTTP/SSE server (for NAS deployment)
npm test         # run unit tests
```

### 5. Deploy to NAS

```bash
docker compose up -d
```

The GitHub Actions workflow auto-deploys to the NAS on every push to main.

## MCP Tools

### `get_steps`
```json
{ "user": "charles", "date": "2026-04-24" }
```
Returns step count, active minutes, floors, and distance for the day.

### `get_heart_rate`
```json
{ "user": "charles", "date": "2026-04-24" }
```
Returns resting HR and time in each zone (fat burn, cardio, peak).

### `get_sleep`
```json
{ "user": "charles", "date": "2026-04-24" }
```
Returns total sleep time, efficiency %, and stage durations.

### `get_activity`
```json
{ "user": "charles", "date": "2026-04-24" }
```
Returns total calories, active calories, and exercise minutes.

### `trend_summary`
```json
{ "user": "charles", "days": 7 }
```
Aggregates all metrics over the past N days and writes a summary to brian-mem.

## Project Status

Early development. See [ROADMAP.md](ROADMAP.md) for what's planned.

---
**Publisher:** Xity Software, LLC
