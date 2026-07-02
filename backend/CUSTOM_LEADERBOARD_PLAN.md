# Custom Leaderboard Plan

Overview:
Add a new "customLeaderboard" model alongside the existing Leaderboard model so custom maps (non-Steam) can be stored and used interchangeably.

Phases

Phase 1 — Architecture & design (figure out the architecture and model it)
- Inspect current Leaderboard model, controllers, shared helpers and routes.
- Define CustomLeaderboard Mongoose schema:
  - id: String (unique, required)
  - mapName: String (required)
  - creator: String (required) — default/forced to "Superku" for admin creation
  - description: String
  - previewImage: String (settable during creation)
  - difficultyBonus: Number (default 0)
  - entries: [ { userName, discordID, time, submittedAt } ]
  - isCustomLeaderboard: Boolean (true)
  - timestamps
  - Note: Remove steamID, colour, featured fields.
- Decide how to represent a leaderboard identifier generically (mapSteamID/mapID/id) so code can accept either type.

Phase 2 — Backend model only
- Implement Mongoose model file backend/models/CustomLeaderboardModel.js.
- Export alongside existing Leaderboard model without changing existing controllers.
- Add unit sanity checks in model (unique index on id).

Phase 3 — Admin creation + public view pages
- Backend: Add admin-only route to create custom leaderboards (POST /leaderboards/custom) that accepts mapName, creator, description, difficultyBonus, id.
  - creator comes from the payload and is not hardcoded.
  - previewImage is derived server-side as `/public/customLeaderboardImages/$id.png`.
  - isCustomLeaderboard set true.
- Frontend: Add admin creation page (route behind admin check) with form to create custom leaderboards.
  - creator input defaults to Superku.
  - textarea styling should match normal text inputs.
  - no preview image input; the image path is derived from id.
- Public: Add view page /custom-leaderboard/:id that fetches and displays raw JSON of the custom leaderboard.

Phase 4 — Audit usages & document changes
- Find all places that assume steamID (routes, controllers, shared helpers, frontend API clients, URLs, discord message builders, MOTW cron).
- Document required changes for each location to support both kinds: key differences, e.g., MOTW logic relies on featured flag or steamID, colour extraction, discord link generation (/leaderboard URL uses steamID currently).
- Produce a migration plan for making controller logic accept a polymorphic identifier and new unified URL patterns.

Phase 5 — Implement interchangeability
- Update controllers/shared functions to accept either steamID or custom id via a normalized field name (e.g., mapID or mapKey).
- Update frontend API layer to support fetching by either type and update routes (add /custom-leaderboard/:id and make /leaderboards/:id detect both types).
- Ensure points calculation, user mapPoints storage, MOTW, and Discord messages work for both model types.
- Add tests where possible and incrementally roll out.

Security & permissions
- Creation of custom leaderboards must be admin-only.
- Persisted creator is editable, with Superku as the default admin form value.

Notes
- Keep the Leaderboard model untouched for Phase 2; Phase 5 will introduce compatibility changes.
- Use isCustomLeaderboard boolean to differentiate types in queries and codepaths.

References
- AGENTS.md will reference this plan file.
