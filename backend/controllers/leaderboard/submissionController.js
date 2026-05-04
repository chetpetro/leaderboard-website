const Leaderboard = require('../../models/LeaderboardModel');
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
const createOrEditEntry = async (req, res) => {
    try {
        const { steamID } = req.params;
        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        const user = await User.findOne({ discordID: req.body.discordID }, { mapPoints: 1 }).lean();
        if (!user) return res.status(404).json({ error: 'No user found' });
        const entries = map.entries;
        const submissionDate = new Date();
        const wrContext = buildWrContext(entries, req.body.time, req.body.discordID);
        const discordPayload = requestToDiscordPayload(req, map, wrContext);
        const existingEntryIndex = getEntryIndexForUser(entries, req.body);
        const persistResult = await persistLeaderboardEntry({
            steamID,
            entries,
            body: req.body,
            submissionDate,
            existingEntryIndex
        });
        if (persistResult.error) {
            return res.status(persistResult.error.status).json(persistResult.error.payload);
        }
        const { responsePayload, finalEntries } = persistResult;
        const { isInconsistent, mapPointsIndex } = hasInconsistentMapPointState(user, steamID, existingEntryIndex);
        if (isInconsistent) {
            return res.status(500).json({ error: `Inconsistent state: user has points for a map they have no entry on, if possible write us on discord :) (mapPointsIndex: ${mapPointsIndex}, existingEntryIndex: ${existingEntryIndex})` });
        }
        let recomputeDebugInfo = {};
        try {
            await Promise.all([
                (async () => {
                    recomputeDebugInfo = await recomputeMapPointsForLeaderboard({
                        finalEntries,
                        steamID,
                        difficultyBonus: map.difficultyBonus
                    });
                })(),
                sendDiscordPbMessage(discordPayload)
            ]);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
        const responseWithDebug = {
            ...responsePayload.toObject ? responsePayload.toObject() : responsePayload,
            _debug: {
                finalEntriesCount: Array.isArray(finalEntries) ? finalEntries.length : 0,
                recomputeMapPointsDebug: recomputeDebugInfo
            }
        };
        return res.status(200).json(responseWithDebug);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
const createMotwEntry = async (req, res) => {
    try {
        const { steamID } = req.params;
        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        if (!map.featured) return res.status(400).json({ error: 'Map of the week submissions are only available for the featured map' });
        const user = await User.findOne({ discordID: req.body.discordID }, { mapPoints: 1 }).lean();
        if (!user) return res.status(404).json({ error: 'No user found' });
        const submissionDate = new Date();
        const motwResult = await persistMotwSubmissionEntry({
            steamID,
            mapName: map.mapName,
            creator: map.creator,
            body: req.body,
            submissionDate
        });
        if (motwResult.error) {
            return res.status(motwResult.error.status).json(motwResult.error.payload);
        }
        const responsePayload = {
            motw: motwResult.responsePayload,
            updatedNormalEntry: false
        };
        const entries = Array.isArray(map.entries) ? map.entries : [];
        const submittedTime = Number(req.body.time);
        const existingEntryIndex = getEntryIndexForUser(entries, req.body);
        const currentBestTime = existingEntryIndex !== -1 ? Number(entries[existingEntryIndex].time) : null;
        const shouldUpdateNormalEntry = Number.isFinite(submittedTime)
            && (existingEntryIndex === -1 || (Number.isFinite(currentBestTime) && submittedTime < currentBestTime));
        if (shouldUpdateNormalEntry) {
            const wrContext = buildWrContext(entries, submittedTime, req.body.discordID);
            const persistResult = await persistLeaderboardEntry({
                steamID,
                entries,
                body: req.body,
                submissionDate,
                existingEntryIndex
            });
            if (persistResult.error) {
                return res.status(persistResult.error.status).json(persistResult.error.payload);
            }
            const { finalEntries } = persistResult;
            const { isInconsistent, mapPointsIndex } = hasInconsistentMapPointState(user, steamID, existingEntryIndex);
            if (isInconsistent) {
                return res.status(500).json({ error: `Inconsistent state: user has points for a map they have no entry on, if possible write us on discord :) (mapPointsIndex: ${mapPointsIndex}, existingEntryIndex: ${existingEntryIndex})` });
            }
            try {
                let recomputeDebugInfo = {};
                await Promise.all([
                    (async () => {
                        recomputeDebugInfo = await recomputeMapPointsForLeaderboard({
                            finalEntries,
                            steamID,
                            difficultyBonus: map.difficultyBonus
                        });
                    })(),
                    sendDiscordPbMessage({
                        discordID: req.body.discordID,
                        userName: req.body.userName,
                        time: submittedTime,
                        mapName: map.mapName,
                        steamID: map.steamID,
                        wrContext
                    })
                ]);
                responsePayload.normalEntryRecomputeDebug = recomputeDebugInfo;
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
            responsePayload.updatedNormalEntry = true;
            responsePayload.normal = persistResult.responsePayload;
        }
        return res.status(200).json(responsePayload);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
module.exports = {
    createOrEditEntry,
    createMotwEntry
};
