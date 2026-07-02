# Phase 4 Audit: `steamID` Dependencies

## Summary

`steamID` is still the primary identifier across the existing leaderboard stack. Custom leaderboards already use `id`, so phase 5 needs a shared `mapKey` abstraction that can resolve both shapes without breaking the current Steam-based flow.

## Inventory

| Area | Current assumption | Change type | `mapKey` impact |
| --- | --- | --- | --- |
| `backend/routes/leaderboard.js` | Classic leaderboards live at `/:steamID`; custom leaderboards already use `/custom/:id` | URL construction | Make `:mapKey` the common lookup param and keep legacy route aliases during transition. |
| `backend/controllers/leaderboard/publicController.js` | Leaderboard reads, MOTW lookup, difficulty bonus updates, and Steam workshop creation all key off `steamID` | DB query key + URL construction | Replace direct `steamID` lookups with a shared resolver; keep Steam URL generation only for Steam maps. |
| `backend/controllers/leaderboard/submissionController.js` | Entry submission and MOTW submission both use `steamID` to find the target map and recompute points | DB query key + persistence | Submission helpers should accept a polymorphic map object instead of raw `steamID`. |
| `backend/controllers/leaderboard/adminController.js` | Deletes, point logs, and recomputes all target `steamID`; user map points are removed by `mapSteamID` | DB query key + storage cleanup | Admin actions need a generic map identifier and a new point-reference field name. |
| `backend/controllers/leaderboard/shared.js` | Discord messages, map-point recomputation, and persistence helpers all embed `steamID` | Identifier + Discord content + storage | Centralize identifier handling here first; this is the best place for the `mapKey` adapter. |
| `backend/controllers/cronController.js` | MOTW rotation creates and reads `MotwSubmission` records by `steamID` and posts Steam links in Discord | MOTW flow + Discord content | Keep MOTW Steam-only for now unless custom maps are explicitly opted in. |
| `backend/controllers/userController.js` | User point refresh queries maps by `steamID` and stores point ownership in `mapSteamID` | DB query key + storage key | This is the main `mapSteamID` migration surface. |
| `backend/models/LeaderboardModel.js` | `steamID` is the required leaderboard identifier | Schema key | Needs to become a polymorphic identifier or be mirrored by a new `mapKey` field. |
| `backend/models/MotwSubmissionModel.js` | MOTW submissions are uniquely keyed by `steamID` | Schema key | Keep as-is for Steam MOTW, or widen if custom maps can ever be featured. |
| `backend/models/userModel.js` | `mapPoints` stores `{ mapSteamID, points }` | Schema key | Rename or duplicate this field before phase 5 shares points across leaderboard types. |
| `backend/controllers/leaderboard/customController.js` | Custom maps already use `id` and return custom leaderboard records | Identifier mismatch | This is the first place that proves the app already has two identifier shapes. |
| `frontend/src/api/leaderboardsApi.js` | Public API methods are still named and routed around `steamID` | URL construction | Add map-key-aware methods or normalize existing ones behind the API layer. |
| `frontend/src/api/adminApi.js` | Admin endpoints all encode `steamID` in paths | URL construction | Same normalization as public API, but keep method names stable for now. |
| `frontend/src/pages/MapDetails.js` | Page param, Steam link, admin actions, and submission form all assume `steamID` | Route + external link | Needs a route param that can resolve either Steam or custom maps. |
| `frontend/src/pages/MapOfTheWeek.js` | MOTW view uses `steamID` for Steam links and admin actions | Route + MOTW flow | Keep Steam link behavior only when the featured map is a Steam workshop map. |
| `frontend/src/pages/Home.js` | Search results, latest submissions, and MOTW cards all link by `steamID` | Navigation | Switch rendered links to a shared map href helper. |
| `frontend/src/pages/HardestMaps.js` | Map list links use `steamID` | Navigation | Use the same shared href helper as Home. |
| `frontend/src/pages/UserDetails.js` | Entry sorting and map point lookup depend on `steamID` and `mapSteamID` | Identifier + storage key | Needs a generic per-map point lookup once points are no longer Steam-only. |
| `frontend/src/pages/CustomLeaderboardView.js` | Custom page already uses `/custom-leaderboard/:id` | Route alias | Keep as a compatibility/read-only view until the unified route is ready. |
| `frontend/src/components/LeaderboardPreview.js` | Preview card links with `steamID` and assumes `colour` and `featured` exist | Navigation + shared fields | Works for both map types if the unified shape keeps those fields. |
| `frontend/src/components/RecentMaps.js` | Recent map cards link with `steamID` | Navigation | Replace with a shared href helper. |
| `frontend/src/components/RandomMapSuggester.js` | Random cards link with `steamID` | Navigation | Replace with a shared href helper. |
| `frontend/src/components/CreateEntryForm.js` | Submission target is passed as `steamID` | Submission key | Rename the prop to `mapKey` once the API layer is updated. |
| `frontend/src/components/ChangeDifficultyBonusForm.js` | Difficulty bonus updates are passed as `steamID` | Admin action key | Same rename as submission form. |
| `frontend/src/components/LatestSubmissionsTicker.js` | Ticker keys and links use `steamID` | Keying + navigation | Use `mapKey` for stable keys and href generation. |
| `frontend/public/mock-api/*.json` | Mock payloads all mirror the Steam-only shape | Test fixture data | Update fixtures to include both Steam and custom shapes before phase 5. |

## Migration notes

1. Make `mapKey` the canonical app-level identifier.
2. Add a shared lookup helper that resolves `mapKey -> { type, record }`.
3. Keep Steam workshop links only for Steam-backed maps; custom maps should link internally.
4. Move user point ownership from `mapSteamID` to a generic map reference, with a compatibility read path.
5. Leave MOTW Steam-only unless product requirements change; the cron flow is tightly coupled to the featured Steam leaderboard model.

## Recommended route strategy

- Primary public map route: `/leaderboards/:mapKey`
- Legacy Steam compatibility: keep `/leaderboards/:steamID` as an alias
- Custom leaderboard view: keep `/custom-leaderboard/:id` until the unified view is finished

## Collision handling

Do not rely on raw string uniqueness alone. `mapKey` should be paired with a map type or resolved through collection-specific lookup so a custom id cannot accidentally shadow a Steam workshop id.
