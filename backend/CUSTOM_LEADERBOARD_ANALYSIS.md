# Phase 1 Analysis: Architecture & Design

## Current Architecture Overview

### Models
- **Leaderboard**: Steam community maps - keyed by `steamID` (unique, required)
  - steamID: String (unique, required)
  - mapName, creator, featured, description, previewImage, colour, difficultyBonus
  - entries: [{ userName, discordID, time, submittedAt }]
  - lastSubmissionAt, timestamps

- **MotwSubmission**: Tracks MOTW submissions separately - keyed by `steamID`
  - Mirrors Leaderboard but focuses on Map of the Week entries
  - Same entry schema
  - No "featured" flag (MOTW status determined by separate record existence)

- **User**: Tracks player stats
  - mapPoints: [{ points, mapSteamID }]
  - mapOfTheWeekParticipations: tracks MOTW placements

### Key Dependencies on steamID
1. **Routes** (`backend/routes/leaderboard.js`): All routes use `:steamID` parameter
2. **Controllers** (`backend/controllers/leaderboard/`):
   - publicController: getLeaderboard({ steamID }), getEntriesByUser returns steamID
   - submissionController: persists entries keyed by steamID
   - adminController: deletes by steamID, logs by steamID
3. **Shared helpers** (`backend/controllers/leaderboard/shared.js`):
   - buildComputedMapPointsForLeaderboard stores points as { mapSteamID, ... }
   - Discord messages include steamID in URLs
   - requestToDiscordPayload includes steamID
4. **User model**: mapPoints array stores mapSteamID references
5. **Discord messages**: URLs use format `/leaderboard/{steamID}`

## CustomLeaderboard Schema Design

```javascript
{
  id: String,                    // Unique identifier (e.g., "custom-map-1"), required, unique
  mapName: String,               // Required
  creator: String,               // Forced to "Superku" server-side
  description: String,           // Optional
  previewImage: String,          // Settable during creation
  difficultyBonus: Number,       // Default 0
  entries: [{                    // Same structure as Leaderboard
    userName: String (required),
    discordID: String (required, indexed, unique per map),
    time: Number (required),
    submittedAt: Date
  }],
  isCustomLeaderboard: Boolean,  // true (marker for queries)
  lastSubmissionAt: Date,        // Auto-updated
  timestamps: true               // createdAt, updatedAt
}
```

**Notably absent**:
- No steamID (replaced by id)
- No featured flag (MOTW handled separately in Phase 5)
- No colour (not applicable to custom maps)

## Generic Leaderboard Identifier Strategy

**Design Decision**: Support both types using a polymorphic "mapKey" abstraction.

### Phase 1 Representation (Design Only)
Code should treat map identifiers as polymorphic:
- steamID for Steam maps (Leaderboard model)
- id for custom maps (CustomLeaderboard model)
- Generic term: **mapKey** (will be implemented in Phase 5)

### Why This Approach
1. Minimizes duplication in Phase 5 when refactoring routes/controllers
2. Allows both types to coexist without major changes until Phase 5
3. Separates concerns: Phase 2-4 keep Leaderboard untouched, Phase 5 unifies them

### Implementation Considerations for Phase 5
- Routes: `/leaderboards/:mapKey` (detect type on fetch)
- Controllers: Query either model based on context
- Points storage: Consider mapKey instead of mapSteamID, or keep separate for now
- Discord: URLs will need to include map type indicator or unified endpoint

## Notes for Future Phases

### Phase 2 (Model Only)
- Create CustomLeaderboardModel.js
- Add unique index on id
- Export alongside Leaderboard without changing controllers yet

### Phase 3 (Admin + Public Views)
- Admin route: POST /leaderboards/custom
- Public view: GET /custom-leaderboard/:id
- Creator hardcoded to "Superku" on backend

### Phase 4 (Audit & Document)
- Audit all code that assumes steamID
- Document what needs changing for interchangeability
- Identify URL patterns, model queries, point tracking

### Phase 5 (Interchangeability)
- Refactor controllers to accept mapKey
- Update frontend API layer
- Unify points calculation
- Test full MOTW flow for both types
