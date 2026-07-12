# Boostless Maps Plan

Overview:
Custom leaderboards can be flagged as "boostless" (no boosts allowed). On such maps every submission must include the number of boosts used. Ranking is by fewest boosts first, then fastest time — 1 boost in 5 seconds is still worse than 0 boosts in 10 hours.

## Core design decisions

- `isBoostless: Boolean` (default false) lives on `CustomLeaderboardModel` and is set once at creation via the admin form. Steam leaderboards (`LeaderboardModel`) are untouched — this is a custom-map-only feature.
- Entries on boostless maps get a `boosts: Number` field (required, integer >= 0, enforced in the controller — the schema field itself stays optional because the entry schema is shared with non-boostless custom maps).
- `MotwSubmissionModel` entries also get an optional `boosts` field, since a boostless custom map can be featured as MOTW.
- One canonical comparator, implemented once on the backend and once on the frontend:
  - `compareEntries(a, b, isBoostless)`: if `isBoostless`, compare `boosts` ascending first (missing boosts treated as 0 — cannot happen for new submissions because validation requires it), then `time` ascending. If not boostless, compare `time` only (current behavior, unchanged).
  - "Is the new score better?" = strictly better under the comparator: fewer boosts, OR equal boosts and lower time. Equal boosts + slower/equal time is rejected the same way slower times are rejected today.
- Since boostless maps can only be created with the flag, there are no legacy entries to migrate.

## Full inventory of what needs to change

### Backend

- `models/CustomLeaderboardModel.js`
  - Add `isBoostless` (Boolean, default false) to the schema.
  - Add `boosts` (Number, optional) to the entries subschema.
- `models/MotwSubmissionModel.js`
  - Add `boosts` (Number, optional) to the entries subschema.
- `controllers/leaderboard/mapUtils.js` (or `shared.js`)
  - Add `compareEntries(a, b, isBoostless)` and `isBetterEntry(candidate, existing, isBoostless)` helpers.
  - `withMapKey` needs no change (`isBoostless` passes through automatically).
- `controllers/leaderboard/customController.js`
  - `createCustomLeaderboard`: accept `isBoostless` from the body, coerce to boolean, persist it.
- `controllers/leaderboard/submissionController.js`
  - `createOrEditEntry`: validate `boosts` when `map.isBoostless` (required, integer >= 0, 400 otherwise); strip `boosts` from the body for non-boostless maps so stray values are not persisted.
  - `createMotwEntry`: same validation; `shouldUpdateNormalEntry` currently compares only times (`submittedTime < currentBestTime`) — switch to `isBetterEntry`.
- `controllers/leaderboard/shared.js`
  - `persistLeaderboardEntry`: the "Posting slower time" check (`entries[i].time <= body.time`) becomes `!isBetterEntry(...)`; pass `isBoostless` in; make sure `boosts` lands on the stored entry (the body spread already carries it); adjust the rejection message (e.g. "Posting a worse score...").
  - `persistMotwSubmissionEntry`: same comparator change; copy `boosts` onto the stored MOTW entry; needs `isBoostless` passed in from the controller.
  - `buildWrContext`: WR detection reduces by `time` only — switch the reduce and the `isNewWr` check to the comparator; needs the submitted `boosts` and `isBoostless` as inputs.
  - `buildComputedMapPointsForLeaderboard`: the `.sort((a, b) => a.time - b.time)` that decides placements (and therefore points) must use the comparator; thread `isBoostless` through from all callers (`submissionController`, `publicController.changeMapDifficultyBonus`, `adminController.logMapPointsForLeaderboard` / `recomputeMapPointsAdmin`). `calculatePoints` itself is unchanged — only the placement order changes.
  - `sendDiscordPbMessage` / `requestToDiscordPayload`: include boosts for boostless maps (e.g. a `**Boosts:** \`N\`` line under the PB/WR time) so a 0-boost WR announcement makes sense.
- `controllers/leaderboard/publicController.js`
  - `getEntriesByUser`: per-map entry sort (`a.time - b.time`) must use the comparator so the reported `pos` is correct on boostless maps.
  - `getMOTW`: no change needed (`isBoostless` flows through `withMapKey`).
- `controllers/leaderboard/adminController.js`
  - No logic change beyond passing `isBoostless`/entries through to the shared recompute helpers (see shared.js item).

### Frontend

- `src/utils/` — add a small entry-comparator util mirroring the backend (`compareEntries(a, b, isBoostless)`), used everywhere entries are sorted for display.
- `src/pages/AdminCustomLeaderboardCreate.js`
  - Add a "Boostless map" checkbox to the form; send `isBoostless` in the create payload.
- `src/components/CreateEntryForm.js`
  - New prop `isBoostless` (passed from the map). When true, render an additional required "Boosts" number input (min 0, step 1) and include `boosts: Number(...)` in the submission payload for both normal and MOTW modes.
- `src/pages/MapDetails.js`
  - Pass `isBoostless={map?.isBoostless}` to `CreateEntryForm`.
  - Entry list sort switches from `a.time - b.time` to the shared comparator.
  - Show the boost count per entry on boostless maps (extra column/span next to the time).
  - Optional: a small "Boostless" badge in the map hero next to the difficulty bonus.
- `src/pages/MapOfTheWeek.js`
  - Same three changes as MapDetails (form prop, `motwEntries` sort, boost display).
- `src/pages/UserDetails.js` / `src/pages/Home.js` / `LatestSubmissionsTicker`
  - Positions come pre-sorted from the backend, so no sorting change needed. Optionally display boosts next to times where entries are rendered.
- `public/mock-api/`
  - Extend fixtures with boostless examples: `leaderboards-custom-create.json` (isBoostless), `leaderboards-by-steamid.json` or a boostless variant with `boosts` on entries, `leaderboards-entry-update.json`, `leaderboards-motw*.json`.

## Phases

Phase 1 — Models + shared comparator (backend)
- Schema additions (CustomLeaderboard.isBoostless, entries.boosts, MotwSubmission entries.boosts).
- `compareEntries` / `isBetterEntry` helpers with the boosts-then-time ordering.

Phase 2 — Backend submission flow
- Creation endpoint accepts `isBoostless`.
- Submission validation, persistence comparisons, WR context, MOTW flow, Discord message.

Phase 3 — Backend ranking/points
- Points placement sort, `getEntriesByUser` sort, verify admin recompute/log endpoints behave.

Phase 4 — Frontend
- Admin create checkbox, submit form boosts input, comparator util, sorting + boost display on MapDetails and MapOfTheWeek.

Phase 5 — Mocks + verification
- Mock API fixtures, frontend production build, backend module load check, manual end-to-end pass (create boostless map → submit 1 boost fast → submit 0 boosts slow from second user → verify order, points, Discord payload, MOTW when featured).

## Edge cases to keep in mind

- 0 boosts in 10h beats 1 boost in 5s (the whole point) — verify explicitly in Phase 5.
- Same user resubmits with equal boosts but slower time → rejected as a worse score.
- Same user resubmits with more boosts but faster time → rejected (boosts dominate).
- Non-boostless maps must ignore a stray `boosts` value in the payload (strip it server-side).
- WR Discord message on a boostless map where the time got slower but boosts dropped: the `-%TIMEDIFF%` improvement string would be negative/nonsense — guard it (only show the diff when the time actually improved).

Last updated: 2026-07-12
