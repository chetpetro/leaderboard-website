# Custom Leaderboard Progress

Track progress for each phase. Update statuses as work proceeds.

- Phase 1 — Architecture & design: ✅ Complete
  - Inspected Leaderboard model, MotwSubmission model, User model
  - Identified steamID as primary key throughout architecture
  - Designed CustomLeaderboard schema (id, mapName, creator="Superku", description, previewImage, difficultyBonus, entries, isCustomLeaderboard, timestamps)
  - Designed generic mapKey abstraction strategy for Phase 5 unification
  - Full analysis saved to backend/CUSTOM_LEADERBOARD_ANALYSIS.md
- Phase 2 — Backend model only: ✅ Complete
  - Created backend/models/CustomLeaderboardModel.js with full schema
  - Added unique index on id field (required, unique, indexed)
  - Verified isCustomLeaderboard defaults to true, difficultyBonus defaults to 0
  - Confirmed model isolation: no existing controllers changed
  - Model verified to import and load correctly
- Phase 3 — Admin creation + public view pages: ✅ Complete
  - Added admin-only POST /leaderboards/custom route for CustomLeaderboard creation
  - Creator is editable in the admin form, with Superku as the default value
  - Preview images are derived from the leaderboard id at /public/customLeaderboardImages/$id.png
  - Added admin-only frontend creation page at /admin/custom-leaderboards/new
  - Added public raw JSON view page at /custom-leaderboard/:id
  - Added mock API mappings for custom leaderboard create/fetch flows
- Phase 4 — Audit usages & document changes: ✅ Complete
  - Wrote the phase 4 inventory in `backend/CUSTOM_LEADERBOARD_PHASE4_AUDIT.md`
  - Documented the `mapKey` migration path and route strategy
- Phase 5 — Implement interchangeability: ✅ Complete
  - Added shared map-key resolution for Steam and custom leaderboards
  - Updated submissions, admin actions, points, MOTW, and Discord links to use the normalized map key
  - Switched frontend map routes and links to `/leaderboards/:mapKey` with legacy Steam fallback
  - Added custom leaderboard support to the MOTW rotation flow
  - Verified backend module loading and frontend production build

Last updated: 2026-07-02T17:08:34+02:00
