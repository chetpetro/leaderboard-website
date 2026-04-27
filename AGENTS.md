# Agent Guidance for `leaderboard-website`

## Project overview
- This is a Pogostuck leaderboard site.
- Community-made custom maps act as the leaderboard content, since the game has no built-in community map leaderboards.
- The app is split into:
  - `frontend/`: React app for browsing maps, submitting runs, and viewing player pages.
  - `backend/`: Express/Mongoose API that stores leaderboards, users, admin actions, and cron jobs.
- A Vercel cron job rotates the weekly **Map of the Week (MOTW)** via `backend/controllers/cronController.js` and `backend/vercel.json`.

## Before making changes
- Check these files first when working in unfamiliar areas:
  - `frontend/package.json`
  - `backend/package.json`
  - `backend/vercel.json`
  - `backend/env_template.txt`
- Inspect the relevant controller, route, model, or page before editing.
- Prefer minimal, targeted changes that preserve the current structure.

## Backend conventions
- Backend code uses CommonJS (`require` / `module.exports`).
- Keep cron and admin side effects in the backend, not the frontend.
- Environment variables are defined by `backend/env_template.txt` and typically include:
  - `PORT`
  - `MONGODB_URI`
  - `SECRET`
  - `STEAM_API_KEY`
  - `DISCORD_TOKEN`
- Be careful with weekly MOTW behavior:
  - The current featured map is unset.
  - A new random featured map is selected.
  - Discord notifications may be sent.
  - User MOTW participation records may be updated.

## Frontend conventions
- Frontend code uses React with modern ES modules.
- Keep data fetching in the existing API layer and hooks where possible.
- `frontend/public/mock-api/` contains mock responses used for local development/testing paths.
- UI wording should stay aligned with the project theme: Pogostuck, maps, runs, leaderboard placements, and MOTW.

## Working rules for agents
- If a change touches MOTW, cron, or Discord posting, verify the weekly rotation flow end-to-end.
- If a change touches auth or admin actions, check the relevant middleware first.
- If a change touches run submission or leaderboard display, confirm the frontend and backend data shapes still match.
- Keep documentation and comments short, accurate, and specific to this repository.

