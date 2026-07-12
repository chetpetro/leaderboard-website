const Leaderboard = require('../../models/LeaderboardModel');
const MotwSubmission = require('../../models/MotwSubmissionModel');
const User = require('../../models/userModel');
const { replaceTemplateKeywords } = require('../../utils/templateReplacer');
const { msToTime } = require('../../utils/timeUtil');
const { sendDiscordMessage } = require('../../utils/discordUtil');
const { calculatePoints } = require('../../scripts/points');
const { getMapKey, compareEntries, isBetterEntry, getEntryBoosts, getBoostsPbInfo } = require('./mapUtils');
require('dotenv').config();
const sendDiscordPbMessage = async ({ discordID, userName, time, boosts, isBoostless = false, mapName, mapKey, wrContext, motw = false, isBoostsPb = false, oldPbBoosts = null }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const newline = String.fromCharCode(10);
    const userUrl = `${leaderboardUrl}user/${discordID}`;
    const mapUrl = `${leaderboardUrl}leaderboards/${mapKey}`;
    const oldWrTime = wrContext?.oldWrTime;
    const hasOldWrTime = Number.isFinite(oldWrTime);
    const isNewWr = wrContext?.isNewWr === true;
    const isBoostsWr = isBoostless && isNewWr && wrContext?.isBoostsWr === true;
    const isBoostsPbMessage = !isNewWr && isBoostless && isBoostsPb;
    const motwStr = motw ? ' Map of the Week' : '';
    // On boostless maps a WR can be taken with a slower time (fewer boosts) — only show the time diff when the time actually improved.
    const wrImprovement = hasOldWrTime ? oldWrTime - time : null;
    const showTimeDiff = wrImprovement !== null && wrImprovement > 0;
    const numericBoosts = Number.isFinite(Number(boosts)) ? Number(boosts) : null;
    const boostsLine = isBoostless && numericBoosts !== null ? ['**Boosts:** `%BOOSTS%`'] : [];
    const oldWrHolder = wrContext?.oldWrHolder
        || (wrContext?.oldWrHolderDiscordID ? `<@${wrContext.oldWrHolderDiscordID}>` : 'unknown');
    const replacements = {
        DISCORDID: discordID,
        PBTIME: msToTime(time),
        USERNAME: userName,
        USERURL: userUrl,
        MAPNAME: mapName,
        MAPURL: mapUrl,
        LEADERBOARDURL: leaderboardUrl,
        OLDWRTIME: hasOldWrTime ? msToTime(oldWrTime) : '',
        OLDWRHOLDER: oldWrHolder,
        TIMEDIFF: showTimeDiff ? msToTime(wrImprovement) : '',
        BOOSTS: numericBoosts !== null ? String(numericBoosts) : ''
    };
    let template;
    if (isBoostsWr) {
        const oldWrBoosts = wrContext?.oldWrBoosts;
        const boostsDiff = Number.isFinite(oldWrBoosts) && numericBoosts !== null ? oldWrBoosts - numericBoosts : null;
        template = [
            wrContext?.isSelfWrImprovement
                ? `New${motwStr} boostless WR by <@%DISCORDID%> — fewer boosts`
                : `New${motwStr} boostless WR by <@%DISCORDID%> dethroning %OLDWRHOLDER% with fewer boosts`,
            '',
            '**Boosts:** `%BOOSTS%` (`-%BOOSTDIFF%` from `%OLDBOOSTS%`)',
            '**Time:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline);
        replacements.OLDBOOSTS = Number.isFinite(oldWrBoosts) ? String(oldWrBoosts) : '';
        replacements.BOOSTDIFF = boostsDiff !== null ? String(boostsDiff) : '';
    } else if (isBoostsPbMessage) {
        const boostsDiff = Number.isFinite(oldPbBoosts) && numericBoosts !== null ? oldPbBoosts - numericBoosts : null;
        template = [
            `New${motwStr} boostless PB for <@%DISCORDID%> — fewer boosts`,
            '',
            '**Boosts:** `%BOOSTS%` (`-%BOOSTDIFF%` from `%OLDBOOSTS%`)',
            '**Time:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline);
        replacements.OLDBOOSTS = Number.isFinite(oldPbBoosts) ? String(oldPbBoosts) : '';
        replacements.BOOSTDIFF = boostsDiff !== null ? String(boostsDiff) : '';
    } else if (isNewWr) {
        template = [
            wrContext?.isSelfWrImprovement || !hasOldWrTime
                ? `New${motwStr} WR by <@%DISCORDID%>`
                : `New${motwStr} WR by <@%DISCORDID%> dethroning %OLDWRHOLDER%'s %OLDWRTIME%`,
            '',
            showTimeDiff
                ? '**WR:** `%PBTIME%` (`-%TIMEDIFF%`)'
                : '**WR:** `%PBTIME%`',
            ...boostsLine,
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline);
    } else {
        template = [
            `New${motwStr} PB for <@%DISCORDID%>`,
            '',
            '**PB:** `%PBTIME%`',
            ...boostsLine,
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join(newline);
    }
    const content = replaceTemplateKeywords(template, replacements);
    await sendDiscordMessage(content);
};
const buildWrContext = (entries, body, submittedDiscordID, isBoostless = false) => {
    const oldWrEntry = entries.reduce((best, entry) => {
        if (!entry || !Number.isFinite(entry.time)) return best;
        if (!best || compareEntries(entry, best, isBoostless) < 0) return entry;
        return best;
    }, null);
    const submittedTime = Number(body?.time);
    if (!Number.isFinite(submittedTime)) return { isNewWr: false };
    if (!oldWrEntry) {
        return {
            isNewWr: true,
            isSelfWrImprovement: true,
            oldWrTime: null,
            oldWrHolder: null,
            oldWrHolderDiscordID: null,
            oldWrBoosts: null,
            isBoostsWr: false
        };
    }
    const candidate = { time: submittedTime, boosts: body?.boosts };
    const isNewWr = isBetterEntry(candidate, oldWrEntry, isBoostless);
    const isBoostsWr = isNewWr && isBoostless && getEntryBoosts(candidate) < getEntryBoosts(oldWrEntry);
    return {
        isNewWr,
        isSelfWrImprovement: isNewWr && oldWrEntry.discordID === submittedDiscordID,
        oldWrTime: oldWrEntry.time,
        oldWrHolder: oldWrEntry.userName,
        oldWrHolderDiscordID: oldWrEntry.discordID,
        oldWrBoosts: getEntryBoosts(oldWrEntry),
        isBoostsWr
    };
};
const getEntryIndexForUser = (entries, body) => entries.findIndex(
    (entry) => body.time && entry.discordID === body.discordID
);
const persistLeaderboardEntry = async ({ map, mapKey, body, submissionDate, existingEntryIndex }) => {
    const entries = Array.isArray(map.entries) ? [...map.entries] : [];
    if (existingEntryIndex !== -1) {
        if (!isBetterEntry(body, entries[existingEntryIndex], map.isBoostless)) {
            return { error: { status: 400, payload: { msg: 'Posting a worse score, entry not updated!' } } };
        }
        entries[existingEntryIndex] = { ...body, submittedAt: submissionDate };
        map.entries = entries;
        map.lastSubmissionAt = submissionDate;
        const responsePayload = await map.save();
        return { responsePayload, finalEntries: entries, mapKey: getMapKey(map) || mapKey };
    }
    const newEntry = { ...body, submittedAt: submissionDate };
    const finalEntries = [...entries, newEntry];
    map.entries = finalEntries;
    map.lastSubmissionAt = submissionDate;
    const responsePayload = await map.save();
    return { responsePayload, finalEntries, mapKey: getMapKey(map) || mapKey };
};
const persistMotwSubmissionEntry = async ({ mapKey, mapName, creator, body, submissionDate, isBoostless = false }) => {
    const submittedTime = Number(body.time);
    if (!Number.isFinite(submittedTime)) {
        return { error: { status: 400, payload: { error: 'Invalid submission time' } } };
    }
    const existingSubmission = await MotwSubmission.findOne({ steamID: mapKey }).lean();
    const entries = Array.isArray(existingSubmission?.entries) ? [...existingSubmission.entries] : [];
    const existingEntryIndex = entries.findIndex((entry) => entry.discordID === body.discordID);
    const updatedEntry = {
        userName: body.userName,
        discordID: body.discordID,
        time: submittedTime,
        submittedAt: submissionDate
    };
    if (body.boosts !== undefined) {
        updatedEntry.boosts = Number(body.boosts);
    }
    if (existingEntryIndex !== -1 && !isBetterEntry(updatedEntry, entries[existingEntryIndex], isBoostless)) {
        return {
            responsePayload: existingSubmission,
            finalEntries: entries,
            updated: false
        };
    }
    if (existingEntryIndex !== -1) {
        entries[existingEntryIndex] = updatedEntry;
    } else {
        entries.push(updatedEntry);
    }
    const responsePayload = await MotwSubmission.findOneAndUpdate(
        { steamID: mapKey },
        {
            $set: {
                mapName,
                creator,
                steamID: mapKey,
                mapKey,
                entries,
                lastSubmissionAt: submissionDate
            }
        },
        { new: true, upsert: true }
    );
    return { responsePayload, finalEntries: entries, updated: true };
};
const getUserMapPointKey = (entry) => entry?.mapKey || entry?.mapSteamID;
const hasInconsistentMapPointState = (user, mapKey, existingEntryIndex) => {
    const mapPointsIndex = user.mapPoints.findIndex((entry) => getUserMapPointKey(entry) === mapKey);
    return {
        isInconsistent: (mapPointsIndex !== -1 && existingEntryIndex === -1) || (mapPointsIndex === -1 && existingEntryIndex !== -1),
        mapPointsIndex
    };
};
const buildComputedMapPointsForLeaderboard = ({ finalEntries, mapKey, difficultyBonus, isBoostless = false }) => {
    const sortedEntries = finalEntries
        .filter((entry) => entry?.discordID && Number.isFinite(Number(entry.time)))
        .map((entry) => ({ ...entry, discordID: entry.discordID, time: Number(entry.time) }))
        .sort((a, b) => compareEntries(a, b, isBoostless));
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
                mapKey,
                mapSteamID: mapKey
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
const recomputeMapPointsForLeaderboard = async ({ finalEntries, mapKey, difficultyBonus, isBoostless = false }) => {
    const { distinctDiscordIDs, computedMapPoints, sortedEntries } = buildComputedMapPointsForLeaderboard({ finalEntries, mapKey, difficultyBonus, isBoostless });
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
        const targetIndex = mapPoints.findIndex((entry) => getUserMapPointKey(entry) === mapKey);
        const updatedMapPointsEntry = { mapKey, mapSteamID: mapKey, points };
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
    return debugInfo;
};
const requestToDiscordPayload = (body, map, wrContext, existingEntry = null) => {
    const { isBoostsPb, oldPbBoosts } = getBoostsPbInfo(existingEntry, body, !!map.isBoostless);
    return {
        discordID: body.discordID,
        userName: body.userName,
        time: body.time,
        boosts: body.boosts,
        isBoostless: !!map.isBoostless,
        mapName: map.mapName,
        mapKey: getMapKey(map),
        wrContext,
        motw: !!map.featured,
        isBoostsPb,
        oldPbBoosts
    };
};
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
