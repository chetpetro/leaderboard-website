const Leaderboard = require('../../models/LeaderboardModel');
const MotwSubmission = require('../../models/MotwSubmissionModel');
const User = require('../../models/userModel');
const {
    buildComputedMapPointsForLeaderboard,
    recomputeMapPointsForLeaderboard
} = require('./shared');
const deleteEntryByMapAndDiscord = async (req, res) => {
    try {
        const { steamID, discordID } = req.params;
        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        const filteredEntries = map.entries.filter((entry) => entry.discordID !== discordID);
        if (filteredEntries.length === map.entries.length) {
            return res.status(404).json({ error: 'No entry found for this map and discordID' });
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
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
const deleteMotwEntryByMapAndDiscord = async (req, res) => {
    try {
        const { steamID, discordID } = req.params;
        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        const motwSubmission = await MotwSubmission.findOne({ steamID });
        if (!motwSubmission) return res.status(404).json({ error: 'No MOTW submission found for this map' });
        const filteredEntries = motwSubmission.entries.filter((entry) => entry.discordID !== discordID);
        if (filteredEntries.length === motwSubmission.entries.length) {
            return res.status(404).json({ error: 'No MOTW entry found for this map and discordID' });
        }
        const lastSubmissionAt = filteredEntries.reduce((latest, entry) => {
            if (!entry?.submittedAt) return latest;
            const submittedAt = new Date(entry.submittedAt);
            if (Number.isNaN(submittedAt.getTime())) return latest;
            if (!latest || submittedAt > latest) return submittedAt;
            return latest;
        }, null);
        motwSubmission.entries = filteredEntries;
        motwSubmission.lastSubmissionAt = lastSubmissionAt;
        await motwSubmission.save();
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
const deleteLeaderboardBySteamID = async (req, res) => {
    try {
        const { steamID } = req.params;
        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        await Leaderboard.deleteOne({ steamID });
        await MotwSubmission.deleteOne({ steamID });
        await User.updateMany(
            { 'mapPoints.mapSteamID': steamID },
            { $pull: { mapPoints: { mapSteamID: steamID } } }
        );
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
const logMapPointsForLeaderboard = async (req, res) => {
    try {
        const { steamID } = req.params;
        const map = await Leaderboard.findOne(
            { steamID },
            { mapName: 1, steamID: 1, entries: 1, difficultyBonus: 1 }
        ).lean();
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        const { computedMapPoints, distinctDiscordIDs, effectiveDifficultyBonus } = buildComputedMapPointsForLeaderboard({
            finalEntries: Array.isArray(map.entries) ? map.entries : [],
            steamID: map.steamID,
            difficultyBonus: map.difficultyBonus
        });
        const users = distinctDiscordIDs.length === 0
            ? []
            : await User.find(
                { discordID: { $in: distinctDiscordIDs } },
                { mapPoints: 1, discordID: 1, userName: 1 }
            ).lean();
        const usersByDiscordID = new Map(users.map((user) => [user.discordID, user]));
        const usersWithMapPoints = computedMapPoints.map((computedMapPoint) => {
            const user = usersByDiscordID.get(computedMapPoint.discordID);
            const currentMapPoint = Array.isArray(user?.mapPoints)
                ? user.mapPoints.find((entry) => entry.mapSteamID === steamID) || null
                : null;
            return {
                discordID: computedMapPoint.discordID,
                userName: computedMapPoint.userName,
                computedMapPoint,
                currentMapPoint,
                mapPoints: Array.isArray(user?.mapPoints) ? user.mapPoints : []
            };
        });
        return res.status(200).json({
            map: {
                mapName: map.mapName,
                steamID: map.steamID,
                difficultyBonus: map.difficultyBonus,
                effectiveDifficultyBonus
            },
            computedMapPoints,
            users: usersWithMapPoints
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
const recomputeMapPointsAdmin = async (req, res) => {
    try {
        const { steamID } = req.params;
        const map = await Leaderboard.findOne(
            { steamID },
            { mapName: 1, steamID: 1, entries: 1, difficultyBonus: 1 }
        ).lean();
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });
        const recomputeDebugInfo = await recomputeMapPointsForLeaderboard({
            finalEntries: Array.isArray(map.entries) ? map.entries : [],
            steamID: map.steamID,
            difficultyBonus: map.difficultyBonus
        });
        return res.status(200).json({
            success: true,
            mapName: map.mapName,
            steamID: map.steamID,
            debugInfo: recomputeDebugInfo
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
module.exports = {
    deleteEntryByMapAndDiscord,
    deleteMotwEntryByMapAndDiscord,
    deleteLeaderboardBySteamID,
    logMapPointsForLeaderboard,
    recomputeMapPointsAdmin
};
