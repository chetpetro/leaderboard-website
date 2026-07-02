# Phase 4 Plan: Audit Usages & Document Changes

## Goal
Map every place that assumes `steamID`, document how it must change for custom leaderboards, and produce a clear migration path for phase 5.

## Scope
- Backend routes and controllers
- Shared helpers and Discord message builders
- User map point storage and MOTW flow
- Frontend API clients, pages, and links
- Mock API data used by the frontend

## Audit checklist
1. Find every `steamID`-based assumption.
2. Classify each usage as:
   - identifier only
   - URL construction
   - database query key
   - Discord / external message content
   - UI route / navigation
3. Note whether the code also depends on:
   - `featured`
   - `colour`
   - `mapSteamID`
   - `Leaderboard`-only fields
4. Record the minimum change required to support both leaderboard types.

## Files and areas to review
- `backend/routes/leaderboard.js`
- `backend/controllers/leaderboard/*`
- `backend/controllers/cronController.js`
- `backend/models/LeaderboardModel.js`
- `backend/models/MotwSubmissionModel.js`
- `backend/models/userModel.js`
- `frontend/src/api/leaderboardsApi.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/pages/MapDetails.js`
- `frontend/src/pages/MapOfTheWeek.js`
- `frontend/src/pages/Home.js`
- `frontend/src/components/LeaderboardPreview.js`
- `frontend/src/components/RecentMaps.js`
- `frontend/src/components/RandomMapSuggester.js`
- `frontend/src/components/CreateEntryForm.js`
- `frontend/src/components/LatestSubmissionsTicker.js`
- `frontend/src/components/ChangeDifficultyBonusForm.js`
- mock API files under `frontend/public/mock-api/`

## Expected outputs
- A written inventory of each `steamID` dependency
- A note for each location describing the future `mapKey` / polymorphic identifier change
- A short migration plan for:
  - shared map lookup
  - URL patterns
  - MOTW handling
  - Discord link generation
  - map point storage

## Outcome

- Inventory and migration notes completed in `backend/CUSTOM_LEADERBOARD_PHASE4_AUDIT.md`
- Recommended canonical identifier: `mapKey`
- Recommended primary route: `/leaderboards/:mapKey`

## Open questions to resolve
- Should the canonical identifier be `mapKey`, `mapID`, or something else?
- Should `/leaderboards/:mapKey` become the primary route, or should `/custom-leaderboard/:id` remain separate?
- Can custom leaderboards ever be selected for MOTW?
- Should `User.mapPoints.mapSteamID` be migrated now or deferred?
- How should Discord links represent custom maps and legacy Steam maps?
- What should happen if a custom `id` collides with a Steam leaderboard identifier?

## Milestone notes
- First pass: collect all usages and sort them by change type.
- Second pass: write the migration notes and identify implementation order for phase 5.
