---
name: verify
description: How to build, run, and drive this app to verify frontend changes end-to-end.
---

# Verifying changes in leaderboard-website

## Build check
```bash
cd frontend && npm run build   # CRA, ~30s, catches compile/lint errors
```

## Run the app without the real backend
The frontend has a built-in mock API (`frontend/src/api/mockApi.js`) backed by
JSON fixtures in `frontend/public/mock-api/`. Start with:

```bash
cd frontend
BROWSER=none PORT=3111 REACT_APP_USE_MOCK_API=true npm start
```

Server is up when `curl localhost:3111` returns 200 (~20s). Without the mock
flag the frontend talks to the production API at
`https://leaderboard-website-api.vercel.app/api`.

**Gotcha:** `frontend/.env` sets `REACT_APP_USE_MOCK_API=true`, so mock mode
is ON by default — pass `REACT_APP_USE_MOCK_API=false` on the command line to
override it (shell env beats .env in CRA). Verify which mode the served bundle
has: `curl -s localhost:3111/static/js/bundle.js | grep -o 'USE_MOCK_API = [^;]*'`.

## Run the real backend locally
`REACT_APP_API_BASE_URL` overrides the API base URL. Full stack:

```bash
podman run -d --name verify-mongo -p 27017:27017 docker.io/library/mongo:7
# seed via a node script requiring backend/models/*.js with
# MONGODB_URI=mongodb://127.0.0.1:27017/pogotest
# launch: node script that requires backend/api/index.js (exports the express
# app, no listen call) and calls app.listen(4111); set MONGODB_URI + SECRET first
cd frontend
BROWSER=none PORT=3111 REACT_APP_USE_MOCK_API=false \
  REACT_APP_API_BASE_URL=http://localhost:4111/api npm start
# cleanup: podman rm -f verify-mongo
```

Mock data notes: `leaderboards.json` has 6 maps covering difficultyBonus > 0,
one `isBoostless: true` map, and varying entry counts — good for filter/sort
flows.

## Driving it
No system chromium/geckodriver. Install Playwright in the scratchpad:

```bash
cd <scratchpad> && npm init -y && npm i playwright && npx playwright install chromium-headless-shell
```

Then drive with a plain Playwright script (screenshots + console-error
capture). Gotchas:
- Map cards animate in; wait ~800ms after navigation before screenshots.
- The mobile nav drawer is `#mobile-nav`, opened via `.hamburger`.
- Kill the server afterwards: `fuser -k 3111/tcp`.
