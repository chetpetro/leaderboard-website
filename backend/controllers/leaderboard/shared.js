const Leaderboard = require('../../models/LeaderboardModel');
const MotwSubmission = require('../../models/MotwSubmissionModel');
const User = require('../../models/userModel');
const { replaceTemplateKeywords } = require('../../utils/templateReplacer');
const { msToTime } = require('../../utils/timeUtil');
const { sendDiscordMessage } = require('../../utils/discordUtil');
const { calculatePoints } = require('../../scripts/points');
require('dotenv').config();
const sendDiscordPbMessage = async ({ discordID, userName, time, mapName, steamID, wrContext, motw = false }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const newline = String.fromCharCode(10);
    const userUrl = `${leaderboardUrl}user/${discordID}`;
    const mapUrl = `${leaderboardUrl}${steamID}`;
    const oldWrTime = wrContext?.oldWrTime;
    const hasOldWrTime = Number.isFinite(oldWrTime);
    const isNewWr = wrContext?.isNewWr === true;
    const motwStr = motw ? ' Map of the Week' : '';
    const template = isNewWr
        ? [
            wrContext?.isSelfWrImprovement || !hasOldWrTime
                ? `New${motwStr} WR by <@%DISCORDID%>`
                : `New${motwStr} WR by <@%DISCORDID%> dethroning %OLDWRHOLDER%'s %OLDWRTIME%`,
            '',
            hasOldWrTime
                ? '**WR:** `%PBTIME%` (`-%TIMEDIFF%`)'
                : '**WR:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline)
        : [
            `New${motwStr} PB for <@%DISCORDID%>`,
            '',
            '**PB:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline);
    const wrImprovement = hasOldWrTime ? oldWrTime - time : null;
    const oldWrHolder = wrContext?.oldWrHolder
        || (wrContext?.oldWrHolderDiscordID ? `<@${wrContext.oldWrHolderDiscordID}>` : 'unknown');
    const content = replaceTemplateKeywords(template, {
        DISCORDID: discordID,
        PBTIME: msToTime(time),
        USERNAME: userName,
        USERURL: userUrl,
        MAPNAME: mapName,
        MAPURL: mapUrl,
        LEADERBOARDURL: leaderboardUrl,
        OLDWRTIME: hasOldWrTime ? msToTime(oldWrTime) : '',
        OLDWRHOLDER: oldWrHolder,
        TIMEDIFF: wrImprovement !== null ? msToTime(wrImprovement) : ''
    });
    await sendDiscordMessage(content);
};
const buildWrContext = (entries, submittedTimeRaw, submittedDiscordID) => {
    const oldWrEntry = entries.reduce((best, entry) => {
        if (!entry || !Number.isFinite(entry.time)) return best;
        if (!best || entry.time < best.time) return entry;
        return best;
    }, null);
    const submittedTime = Number(submittedTimeRaw);
    if (!Number.isFinite(submittedTime)) return { isNewWr: false };
    if (!oldWrEntry) {
        return {
            isNewWr: true,
            isSelfWrImprovement: true,
            oldWrTime: null,
            oldWrHolder: null,
            oldWrHolderDiscordID: null
        };
    }
    const isNewWr = submittedTime < oldWrEntry.time;
    return {
        isNewWr,
        isSelfWrImprovement: isNewWr && oldWrEntry.discordID === submittedDiscordID,
        oldWrTime: oldWrEntry.time,
        oldWrHolder: oldWrEntry.userName,
        oldWrHolderDiscordID: oldWrEntry.discordID
    };
};
const getEntryIndexForUser = (entries, body) => entries.findIndex(
    (entry) => body.time && entry.discordID === body.discordID
);
const persistLeaderboardEntry = async ({ steamID, entries, body, submissionDate, existingEntryIndex }) => {
    if (existingEntryIndex !== -1) {
        if (entries[existingEntryIndex].time <= body.time) {
            return { error: { status: 400, payload: { msg: 'Posting slower time, time not updated!' } } };
        }
        entries[existingEntryIndex] = { ...body, submittedAt: submissionDate };
        const responsePayload = await Leaderboard.findOneAndUpdate(
            { steamID },
            { entries, lastSubmissionAt: submissionDate },
            { new: true }
        );
        return { responsePayload, finalEntries: entries };
    }
    const newEntry = { ...body, submittedAt: submissionDate };
    const finalEntries = [...entries, newEntry];
    const responsePayload = await Leaderboard.updateOne(
        { steamID },
        {
            $push: { entries: newEntry },
            $set: { lastSubmissionAt: submissionDate }
        }
    );
    return { responsePayload, finalEntries };
};
const persistMotwSubmissionEntry = async ({ steamID, mapName, creator, body, submissionDate }) => {
    const submittedTime = Number(body.time);
    if (!Number.isFinite(submittedTime)) {
        return { error: { status: 400, payload: { error: 'Invalid submission time' } } };
    }
    const existingSubmission = await MotwSubmission.findOne({ steamID }).lean();
    const entries = Array.isArray(existingSubmission?.entries) ? [...existingSubmission.entries] : [];
    const existingEntryIndex = entries.findIndex((entry) => entry.discordID === body.discordID);
    if (existingEntryIndex !== -1 && entries[existingEntryIndex].time <= submittedTime) {
        return {
            responsePayload: existingSubmission,
            finalEntries: entries,
            updated: false
        };
    }
    const updatedEntry = {
        userName: body.userName,
        discordID: body.discordID,
        time: submittedTime,
        submittedAt: submissionDate
    };
    if (existingEntryIndex !== -1) {
        entries[existingEntryIndex] = updatedEntry;
    } else {
        entries.push(updatedEntry);
    }
    const responsePayload = await MotwSubmission.findOneAndUpdate(
        { steamID },
        {
            $set: {
                mapName,
                creator,
                steamID,
                entries,
                lastSubmissionAt: submissionDate
            }
        },
        { new: true, upsert: true }
    );
    return { responsePayload, finalEntries: entries, updated: true };
};
const hasInconsistentMapPointState = (user, steamID, existingEntryIndex) => {
    const mapPointsIndex = user.mapPoints.findIndex((entry) => entry.mapSteamID === steamID);
    return {
        isInconsistent: (mapPointsIndex !== -1 && existingEntryIndex === -1) || (mapPointsIndex === -1 && existingEntryIndex !== -1),
        mapPointsIndex
    };
};
const buildComputedMapPointsForLeaderboard = ({ finalEntries, steamID, difficultyBonus }) => {
    const sortedEntries = finalEntries
        .filter((entry) => entry?.discordID && Number.isFinite(Number(entry.time)))
        .map((entry) => ({ ...entry, discordID: entry.discordID, time: Number(entry.time) }))
        .sort((a, b) => a.time - b.time);
    const distinctDiscordIDs = [...new Set(sortedEntries.map((entry) => entry.discordID))];
    const effectiveDifficultyBonus = Number.isFinite(difficultyBonus) ? difficultyBonus : 0;
    const computedMapPoints = [];
    sortedEntries.forEach((entry, placement) => {
        if (computedMapPoints.some((computedEntry) => computedEntry.discordID === entry.discordID)) return;
        const points = calculatePoints(sortedEntries.length, placement, effectiveDifficultyBonus);
        if (Number.isFinite(points)) {
            computedMapPoints.push({
                discordID: entry.discordID,
                userName: entry.userName,
                time: entry.time,
                placement: placement + 1,
                points,
                mapSteamID: steamID
            });
        }
    });
    return {
        sortedEntries,
        distinctDiscordIDs,
        computedMapPoints,
        effectiveDifficultyBonus,
    };
};
const recomputeMapPointsForLeaderboard = async ({ finalEntries, steamID, difficultyBonus }) => {
    const { distinctDiscordIDs, computedMapPoints, sortedEntries } = buildComputedMapPointsForLeaderboard({ finalEntries, steamID, difficultyBonus });
    const debugInfo = {
        finalEntriesCount: Array.isArray(finalEntries) ? finalEntries.length : 0,
        distinctDiscordIDs,
        computedMapPointsCount: computedMapPoints.length,
        sortedEntries
    };
    if (distinctDiscordIDs.length === 0) {
        return debugInfo;
    }
    const users = await User.find(
        { discordID: { $in: distinctDiscordIDs } },
        { mapPoints: 1, discordID: 1 }
    ).lean();
    debugInfo.usersFound = Array.isArray(users) ? users : [];
    debugInfo.usersFoundCount = Array.isArray(users) ? users.length : 0;
    const usersByDiscordID = new Map(users.map((u) => [u.discordID, u]));
    const bulkUpdates = [];
    computedMapPoints.forEach(({ discordID, points }) => {
        const targetUser = usersByDiscordID.get(discordID);
        if (!targetUser) return;
        const mapPoints = Array.isArray(targetUser.mapPoints) ? [...targetUser.mapPoints] : [];
        const targetIndex = mapPoints.findIndex((entry) => entry.mapSteamID === steamID);
        const updatedMapPointsEntry = { mapSteamID: steamID, points };
        if (targetIndex !== -1) {
            mapPoints[targetIndex] = updatedMapPointsEntry;
        } else {
            mapPoints.push(updatedMapPointsEntry);
        }
        bulkUpdates.push({
            updateOne: {
                filter: { _id: targetUser._id },
                update: { $set: { mapPoints } }
            }
        });
    });
    debugInfo.bulkUpdatesCount = bulkUpdates.length;
    debugInfo.bulkWriteExecuted = bulkUpdates.length > 0;
    if (bulkUpdates.length > 0) {
        try {
            debugInfo.bulkWriteResult = await User.bulkWrite(bulkUpdates);
        } catch (error) {
            debugInfo.bulkWriteError = error.message;
            throw error;
        }
    }
};
const requestToDiscordPayload = (req, map, wrContext) => ({
    discordID: req.body.discordID,
    userName: req.body.userName,
    time: req.body.time,
    mapName: map.mapName,
    steamID: map.steamID,
    wrContext,
    motw: !!map.featured
});
module.exports = {
    sendDiscordPbMessage,
    buildWrContext,
    getEntryIndexForUser,
    persistLeaderboardEntry,
    persistMotwSubmissionEntry,
    hasInconsistentMapPointState,
    buildComputedMapPointsForLeaderboard,
    recomputeMapPointsForLeaderboard,
    requestToDiscordPayload
};


