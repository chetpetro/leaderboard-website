const User = require('../../models/userModel');
const {
    buildWrContext,
    getEntryIndexForUser,
    persistLeaderboardEntry,
    persistMotwSubmissionEntry,
    hasInconsistentMapPointState,
    recomputeMapPointsForLeaderboard,
    sendDiscordPbMessage,
    requestToDiscordPayload
} = require('./shared');
const { resolveLeaderboardByKey, getMapKey, withMapKey, isBetterEntry, getBoostsPbInfo } = require('./mapUtils');

// Boostless maps require a boost count on every submission; on normal maps a stray
// `boosts` value must not be persisted, so it gets stripped from the body.
const normalizeSubmissionBody = (map, rawBody) => {
    const { boosts, ...bodyWithoutBoosts } = rawBody || {};
    if (!map.isBoostless) {
        return { body: bodyWithoutBoosts };
    }
    const parsedBoosts = Number(boosts);
    if (!Number.isInteger(parsedBoosts) || parsedBoosts < 0) {
        return { error: { status: 400, payload: { error: 'This map is boostless: boosts is required and must be an integer >= 0' } } };
    }
    return { body: { ...bodyWithoutBoosts, boosts: parsedBoosts } };
};

const createOrEditEntry = async (req, res) => {
    try {
        const { mapKey } = req.params;
        const resolved = await resolveLeaderboardByKey(mapKey);
        const map = resolved.map;
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });

        const normalized = normalizeSubmissionBody(map, req.body);
        if (normalized.error) {
            return res.status(normalized.error.status).json(normalized.error.payload);
        }
        const body = normalized.body;

        const user = await User.findOne({ discordID: body.discordID }, { mapPoints: 1 }).lean();
        if (!user) return res.status(404).json({ error: 'No user found' });

        const entries = map.entries;
        const submissionDate = new Date();
        const existingEntryIndex = getEntryIndexForUser(entries, body);
        const existingEntry = existingEntryIndex !== -1 ? entries[existingEntryIndex] : null;
        const wrContext = buildWrContext(entries, body, body.discordID, map.isBoostless);
        const discordPayload = requestToDiscordPayload(body, map, wrContext, existingEntry);
        const persistResult = await persistLeaderboardEntry({
            map,
            mapKey: getMapKey(map),
            body,
            submissionDate,
            existingEntryIndex
        });

        if (persistResult.error) {
            return res.status(persistResult.error.status).json(persistResult.error.payload);
        }

        const { responsePayload, finalEntries } = persistResult;
        const { isInconsistent, mapPointsIndex } = hasInconsistentMapPointState(user, getMapKey(map), existingEntryIndex);
        if (isInconsistent) {
            return res.status(500).json({ error: `Inconsistent state: user has points for a map they have no entry on, if possible write us on discord :) (mapPointsIndex: ${mapPointsIndex}, existingEntryIndex: ${existingEntryIndex})` });
        }

        try {
            await Promise.all([
                recomputeMapPointsForLeaderboard({
                    finalEntries,
                    mapKey: getMapKey(map),
                    difficultyBonus: map.difficultyBonus,
                    isBoostless: map.isBoostless
                }),
                sendDiscordPbMessage(discordPayload)
            ]);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(withMapKey(responsePayload));
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

const createMotwEntry = async (req, res) => {
    try {
        const { mapKey } = req.params;
        const resolved = await resolveLeaderboardByKey(mapKey);
        const map = resolved.map;
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        if (!map.featured) return res.status(400).json({ error: 'Map of the week submissions are only available for the featured map' });

        const normalized = normalizeSubmissionBody(map, req.body);
        if (normalized.error) {
            return res.status(normalized.error.status).json(normalized.error.payload);
        }
        const body = normalized.body;

        const user = await User.findOne({ discordID: body.discordID }, { mapPoints: 1 }).lean();
        if (!user) return res.status(404).json({ error: 'No user found' });

        const submissionDate = new Date();
        const mapKeyValue = getMapKey(map);
        const motwResult = await persistMotwSubmissionEntry({
            mapKey: mapKeyValue,
            mapName: map.mapName,
            creator: map.creator,
            body,
            submissionDate,
            isBoostless: map.isBoostless
        });

        if (motwResult.error) {
            return res.status(motwResult.error.status).json(motwResult.error.payload);
        }

        const responsePayload = {
            motw: motwResult.responsePayload,
            updatedNormalEntry: false
        };
        const entries = Array.isArray(map.entries) ? map.entries : [];
        const submittedTime = Number(body.time);
        const existingEntryIndex = getEntryIndexForUser(entries, body);
        const wrContext = buildWrContext(entries, body, body.discordID, map.isBoostless);
        const submittedEntry = { time: submittedTime, boosts: body.boosts };
        const existingEntry = existingEntryIndex !== -1 ? entries[existingEntryIndex] : null;
        const shouldUpdateNormalEntry = Number.isFinite(submittedTime)
            && (existingEntryIndex === -1 || isBetterEntry(submittedEntry, existingEntry, map.isBoostless));
        const { isBoostsPb, oldPbBoosts } = getBoostsPbInfo(existingEntry, submittedEntry, map.isBoostless);

        if (shouldUpdateNormalEntry) {
            const persistResult = await persistLeaderboardEntry({
                map,
                mapKey: mapKeyValue,
                entries,
                body,
                submissionDate,
                existingEntryIndex
            });
            if (persistResult.error) {
                return res.status(persistResult.error.status).json(persistResult.error.payload);
            }
            const { finalEntries } = persistResult;
            const { isInconsistent, mapPointsIndex } = hasInconsistentMapPointState(user, mapKeyValue, existingEntryIndex);
            if (isInconsistent) {
                return res.status(500).json({ error: `Inconsistent state: user has points for a map they have no entry on, if possible write us on discord :) (mapPointsIndex: ${mapPointsIndex}, existingEntryIndex: ${existingEntryIndex})` });
            }
            try {
                await Promise.all([
                    recomputeMapPointsForLeaderboard({
                        finalEntries,
                        mapKey: mapKeyValue,
                        difficultyBonus: map.difficultyBonus,
                        isBoostless: map.isBoostless
                    }),
                    sendDiscordPbMessage({
                        discordID: body.discordID,
                        userName: body.userName,
                        time: submittedTime,
                        boosts: body.boosts,
                        isBoostless: !!map.isBoostless,
                        mapName: map.mapName,
                        mapKey: mapKeyValue,
                        wrContext,
                        motw: true,
                        isBoostsPb,
                        oldPbBoosts
                    })
                ]);
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
            responsePayload.updatedNormalEntry = true;
            responsePayload.normal = withMapKey(persistResult.responsePayload);
        }

        if (!shouldUpdateNormalEntry) {
            try {
                await sendDiscordPbMessage({
                    discordID: body.discordID,
                    userName: body.userName,
                    time: submittedTime,
                    boosts: body.boosts,
                    isBoostless: !!map.isBoostless,
                    mapName: map.mapName,
                    mapKey: mapKeyValue,
                    wrContext,
                    motw: true
                });
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        }

        return res.status(200).json(responsePayload);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// Deletes the authenticated user's own entry. The discordID comes from the
// auth token's user, never from the request, so users can only delete their own score.
const deleteOwnEntry = async (req, res) => {
    try {
        const { mapKey } = req.params;
        const resolved = await resolveLeaderboardByKey(mapKey);
        const map = resolved.map;
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });

        const authedUser = await User.findOne({ _id: req.user._id }, { discordID: 1 }).lean();
        if (!authedUser?.discordID) return res.status(404).json({ error: 'No user found' });
        const { discordID } = authedUser;

        const filteredEntries = map.entries.filter((entry) => entry.discordID !== discordID);
        if (filteredEntries.length === map.entries.length) {
            return res.status(404).json({ error: 'You have no entry on this map' });
        }

        const lastSubmissionAt = filteredEntries.reduce((latest, entry) => {
            if (!entry?.submittedAt) return latest;
            const submittedAt = new Date(entry.submittedAt);
            if (Number.isNaN(submittedAt.getTime())) return latest;
            if (!latest || submittedAt > latest) return submittedAt;
            return latest;
        }, null);

        map.entries = filteredEntries;
        map.lastSubmissionAt = lastSubmissionAt;
        await map.save();

        const mapKeyValue = getMapKey(map);
        await User.updateOne(
            { discordID, 'mapPoints.mapKey': mapKeyValue },
            { $pull: { mapPoints: { mapKey: mapKeyValue } } }
        );
        await User.updateOne(
            { discordID, 'mapPoints.mapSteamID': mapKeyValue },
            { $pull: { mapPoints: { mapSteamID: mapKeyValue } } }
        );

        await recomputeMapPointsForLeaderboard({
            finalEntries: filteredEntries,
            mapKey: mapKeyValue,
            difficultyBonus: map.difficultyBonus,
            isBoostless: map.isBoostless
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

module.exports = {
    createOrEditEntry,
    createMotwEntry,
    deleteOwnEntry
};
