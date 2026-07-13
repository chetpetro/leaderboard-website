# Map Points

Map points are the per-map score a user earns for having a leaderboard entry on a map. The sum of a
user's map points is the site-wide score shown on the points leaderboard and the user page.

## Data model

Points are stored **denormalized on the user**, not on the leaderboard
(`backend/models/userModel.js`):

```js
mapPoints: [{
    points:     Number,   // required
    mapKey:     String,   // steamID (steam maps) or id (custom maps)
    mapSteamID: String    // required; legacy field, always set to the same value as mapKey
}]
```

Older documents may only carry `mapSteamID`. All lookups therefore resolve the key with
`entry.mapKey || entry.mapSteamID` (`getUserMapPointKey` in
`backend/controllers/leaderboard/shared.js`).

Related user fields:

- `pointCalculationMethod` — string fingerprint of the formula the user's points were last computed
  with (see below). Compared against the current fingerprint to decide whether a full rebuild is
  needed.
- `points` — legacy top-level number, no longer written or read; totals are always summed from
  `mapPoints` at read time.

## Points formula

`backend/scripts/points.js`:

```
points = (base + top3Bonus) * sqrt(entryCount) * 0.25 + difficultyBonus

base      = 50 * (entryCount - placement + 1) / max(entryCount - 1, 1)   // placement is 1-indexed (WR = 1)
top3Bonus = 150 / 50 / 25 for placements 1 / 2 / 3, else 0
```

- `entryCount` is the number of entries on the map, so every submission changes **everyone's**
  points on that map — points must be recomputed for the whole map whenever its entries change.
- The top-3 bonus is deliberately **not flat**: it sits inside the `sqrt(entryCount) * 0.25`
  scaling, so the WR's effective bonus is `150 * sqrt(entryCount) / 4` — e.g. +37.5 on a 1-entry
  map, exactly +150 at 16 entries, +300 at 64.
- `difficultyBonus` is a per-map admin-set flat bonus (`PATCH /api/leaderboards/:mapKey/difficultyBonus`).
- `currentPointCalculationMethod()` returns a string encoding of these constants plus a manual
  revision counter (`top3:150:50:25;base:50;comp:sqrt;scale:.25;rev:2`). Changing the formula —
  or bumping `calculationRevision` after a logic fix — changes the string, which invalidates all
  users' stored points (see "Full rebuild per user").
- Stored points can only be repaired **lazily per user** via that string bump. A one-shot
  recompute over all maps (e.g. through the one-time-migrations endpoint) does not work: the
  backend runs on Vercel and the loop exceeds the request timeout.

Placement is determined by sorting the map's entries with `compareEntries`
(`backend/controllers/leaderboard/mapUtils.js`): by time ascending, except on **boostless** maps
where fewer boosts wins first and time is the tiebreaker.

## The core recompute

`recomputeMapPointsForLeaderboard({ finalEntries, mapKey, difficultyBonus, isBoostless })` in
`backend/controllers/leaderboard/shared.js` is the single source of truth for keeping `mapPoints`
in sync with one map's entries:

1. `buildComputedMapPointsForLeaderboard` filters out entries without a `discordID` or finite
   `time`, sorts with `compareEntries`, and computes points per distinct user (first/best entry
   counts).
2. Loads all affected users, replaces or appends the `{ mapKey, mapSteamID, points }` element in
   each user's `mapPoints` array, and writes the whole array back per user via `User.bulkWrite`.
3. Returns a `debugInfo` object (entry counts, users found, bulk write result) that the admin
   recompute endpoint passes through to the client.

Note: it only **upserts** points for users that still have an entry. Removing a user's stale
`mapPoints` element is the responsibility of the delete flows (below), which `$pull` it explicitly.

## Write paths (what triggers a recompute)

| Trigger | Endpoint | mapPoints handling |
|---|---|---|
| Normal run submission | `PATCH /api/leaderboards/:mapKey` (`submissionController.createOrEditEntry`) | Saves the entry, then recomputes the whole map (in parallel with the Discord PB message). |
| MOTW submission | `PATCH /api/leaderboards/:mapKey/motw` (`submissionController.createMotwEntry`) | MOTW entries themselves award **no** map points. But the submission is mirrored into the map's normal leaderboard when it beats the user's existing entry, and that mirror triggers the same recompute. |
| User deletes own entry | `DELETE /api/leaderboards/:mapKey/entries/me` (`submissionController.deleteOwnEntry`) | Removes the entry, `$pull`s the user's own `mapPoints` element (both `mapKey` and legacy `mapSteamID` shapes), then recomputes the map for the remaining users. |
| Admin deletes an entry | `DELETE /api/admin/leaderboards/:mapKey/entries/:discordID` (`adminController.deleteEntryByMapAndDiscord`) | Removes the entry, `$pull`s the deleted user's `mapPoints`, then recomputes the map for the remaining users. |
| Admin deletes a map | `DELETE /api/admin/leaderboards/:mapKey` (`adminController.deleteLeaderboardBySteamID`) | Deletes the leaderboard (steam or custom) plus its MOTW submissions, and `$pull`s that map's element from **all** users' `mapPoints`. |
| Admin changes difficulty bonus | `PATCH /api/leaderboards/:mapKey/difficultyBonus` (`publicController.changeMapDifficultyBonus`) | Saves the bonus, then recomputes the map. |
| Admin manual recompute | `POST /api/admin/leaderboards/:mapKey/recompute-map-points` (`adminController.recomputeMapPointsAdmin`) | Runs the core recompute on the map's current entries; returns `debugInfo`. Triggered by the "recompute points" button on the map admin panel (`MapDetails.js`), next to "log points"; response is logged to the console. |

Admin-deleting a **MOTW** entry (`DELETE /api/admin/leaderboards/:mapKey/motw/entries/:discordID`)
only edits the `MotwSubmission` document; the mirrored normal entry and its points are untouched.

### Consistency tripwire

Both submission handlers run `hasInconsistentMapPointState(user, mapKey, existingEntryIndex)`:
if the user has a `mapPoints` element for the map but no entry (or vice versa), the request is
rejected with a 500 asking the user to report it on Discord, instead of silently compounding the
mismatch.

## Full rebuild per user (formula migration)

`GET|POST /api/user/:id/update-points` (`userController.updateUserPoints`):

- If the user's stored `pointCalculationMethod` differs from `currentPointCalculationMethod()`,
  `updateUserPointsIfCalculationMethodChanged` wipes the user's `mapPoints` and rebuilds it from
  every steam + custom leaderboard the user has an entry on, then stamps the new method string.
- Always responds with the refreshed user plus their entries/placements per map.

Two frontend callers:

- `App.js` fires it once per app load for the logged-in user.
- `UserDetails.js` fires it when `GET /api/user/:id` responds with `shouldUpdatePoints: true`
  (that flag is just the method-string comparison done server-side).

## Read paths

- `GET /api/user/` and `GET /api/user/top3` (`userController.getUsers` / `getTop3Users`): sum each
  user's `mapPoints` into `totalMapPoints` at read time and sort descending. Consumed by
  `PointsLeaderboard.js` (podium + list) and the home page top-3.
- `GET /api/user/:id`: raw user document including `mapPoints`, plus `shouldUpdatePoints`.
  `UserDetails.js` joins it against `GET /api/leaderboards/entries?user=:discordID` to render each
  map row with its `+points` value (colored on a purple gradient scaled between the user's own
  min/max map points) and sorts the rows by points.
- `GET /api/admin/leaderboards/:mapKey/map-points` (`adminController.logMapPointsForLeaderboard`):
  debug endpoint returning, per user on the map, the freshly computed value next to the currently
  stored `mapPoints` element. Surfaced by the "log points" button on the map admin panel
  (`MapDetails.js`), which trims the raw response before logging to the console: it drops the
  top-level `map` and `computedMapPoints` keys, and for each user keeps only `currentMapPoint` and
  `computedMapPoint` (dropping `discordID`/`userName`/the full `mapPoints` array). It also adds a
  top-level `mismatches` array — `{ current, computedMapPoint }` pairs for every user whose stored
  points differ from the freshly computed value (including users with no stored entry at all) — so
  stale points are visible without diffing the full user list by hand.
- Login/signup responses include the user's `mapPoints` snapshot, which the frontend keeps in the
  auth user state (`App.js`) — currently nothing renders from it; pages fetch fresh data instead.

## MOTW clarification

Map-of-the-week standings (`MotwSubmission` collection) award `mapOfTheWeekParticipations`
(placement + week number) during the weekly cron rotation (`cronController.newFeaturedLeaderboard`);
they never write `mapPoints`. Only the mirrored normal-leaderboard entry contributes points.
