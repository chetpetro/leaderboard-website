const Leaderboard = require('../models/LeaderboardModel');
const MotwSubmission = require('../models/MotwSubmissionModel');
const User = require('../models/userModel');
const { getAverageColor } = require('fast-average-color-node');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");
const { sendDiscordMessage } = require('../utils/discordUtil');
const {calculatePoints} = require("../scripts/points");
const { getMotwNumber } = require('../scripts/motwNumber');
require('dotenv').config()

const sendDiscordPbMessage = async ({ discordID, userName, time, mapName, steamID, wrContext }) => {
    if (discordID === "261147203307831296") return
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const userUrl = `${leaderboardUrl}user/${discordID}`;
    const mapUrl = `${leaderboardUrl}${steamID}`;
    const oldWrTime = wrContext?.oldWrTime;
    const hasOldWrTime = Number.isFinite(oldWrTime);
    const isNewWr = wrContext?.isNewWr === true;

    const template = isNewWr
        ? [
            wrContext?.isSelfWrImprovement || !hasOldWrTime
                ? 'New WR by <@%DISCORDID%>'
                : 'New WR by <@%DISCORDID%> dethroning %OLDWRHOLDER%\'s `%OLDWRTIME%`',
            '',
            hasOldWrTime
                ? '**WR:** `%PBTIME%` (`-%TIMEDIFF%`)'
                : '**WR:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join('\n')
        : [
            'New PB for <@%DISCORDID%>',
            '',
            '**PB:** `%PBTIME%`',
            '**By:** [%USERNAME%](<%USERURL%>)',
            '**Map:** [%MAPNAME%](<%MAPURL%>)',
            '',
            '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
        ].join('\n');

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
}

const getLeaderboards = async (req, res) =>  {
    const response = await Leaderboard.find({}).sort({entries: -1});
    res.status(200).json(response);
}

const getRecentLeaderboards = async (req, res) =>  {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 10 : Math.min(Math.max(requestedLimit, 1), 50);

    const response = await Leaderboard
        .find({})
        .sort({ lastSubmissionAt: -1, updatedAt: -1 })
        .limit(limit);

    res.status(200).json(response);
}

const getEntriesByUser = async (req, res) => {
    const { user: discordID } = req.query;

    if (!discordID) {
        return res.status(400).json({ error: 'Missing user query parameter' });
    }

    try {
        const mapsWithUser = await Leaderboard.find(
            { 'entries.discordID': discordID },
            { mapName: 1, steamID: 1, entries: 1 }
        ).lean();

        mapsWithUser.forEach((map) => map.entries.sort((a, b) => a.time - b.time));

        const entries = [];
        mapsWithUser.forEach((leaderboard) => {
            if (!Array.isArray(leaderboard.entries)) return;

            leaderboard.entries.forEach((entry, index) => {
                if (entry?.discordID === discordID) {
                    entries.push({
                        mapName: leaderboard.mapName,
                        steamID: leaderboard.steamID,
                        pos: index + 1,
                        entry
                    });
                }
            });
        });

        return res.status(200).json({ entries });
    } catch (error) {
        console.error('getEntriesByUser failed:', error);
        return res.status(500).json({ error: 'Failed to fetch entries: ' + error });
    }
}

const getLeaderboard = async (req, res) =>  {
    const { steamID } = req.params;
    const response = await Leaderboard.find({ steamID })

    if (!response) return res.status(404).json({error: "No leadearboard with map name found"})

    res.status(200).json(response);
}

const createMapLeaderboard = async (req, res) => {
    const getID = (url) => {
        const match = /(?<=id=)\d*/.exec(url)
        return match ? match[0] : null;
    }

    try {
        let { url, entries } = req.body;
        if (!entries) entries = []
        const mapID = getID(url)
        const API_KEY = process.env.STEAM_API_KEY

        let mapData = new FormData();
        mapData.append('itemcount', '1');
        mapData.append('publishedfileids[0]', mapID)

        const mapResponse = await fetch(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, {
            method:"POST",
            body: mapData
        });
        const mapJson = await mapResponse.json();
        const mapInfo = mapJson.response.publishedfiledetails[0];

        const playerResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${mapInfo.creator}`);
        const playerJson = await playerResponse.json();

        const colour = await getAverageColor(mapInfo.preview_url);

        mapEntry = { 
            mapName: mapInfo.title,
            steamID: mapID,
            creator: playerJson.response.players[0].personaname,
            description: mapInfo.description,
            previewImage: mapInfo.preview_url,
            colour,
            entries
        }

        const response = await Leaderboard.create(mapEntry);
        res.status(200).json(response);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}

const changeMapDifficultyBonus = async (req, res) => {
    const { steamID, difficultyBonusStr } = req.params;
    const difficultyBonusRaw = req.body?.difficultyBonus ?? difficultyBonusStr;
    const difficultyBonus = Number.parseInt(difficultyBonusRaw, 10);
    if (Number.isNaN(difficultyBonus)) {
        return res.status(400).json({ error: `Invalid difficulty bonus value. difficultyBonusStr: ${difficultyBonusStr}, parsed: ${difficultyBonus}` });
    }
    const map = await Leaderboard.findOne({ steamID });
    if (!map) return res.status(404).json({error: "No leadearboard found"});
    map.difficultyBonus = difficultyBonus;
    await map.save();
    res.status(200).json(map);
}

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
        .filter((entry) => entry?.discordID && Number.isFinite(Number(entry.time))) // TODO this doenst work for uses without discord ids!!
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
    const { distinctDiscordIDs, computedMapPoints, sortedEntries} = buildComputedMapPointsForLeaderboard({ finalEntries, steamID, difficultyBonus });

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
            const bulkWriteResult = await User.bulkWrite(bulkUpdates);
            debugInfo.bulkWriteResult = bulkWriteResult;
        } catch (error) {
            debugInfo.bulkWriteError = error.message;
            throw error;
        }
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

const requestToDiscordPayload = (req, map, wrContext) => ({
    discordID: req.body.discordID,
    userName: req.body.userName,
    time: req.body.time,
    mapName: map.mapName,
    steamID: map.steamID,
    wrContext
})

const createOrEditEntry = async (req, res) => {
    try {
        const { steamID } = req.params;

        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({error: "No leadearboard found"});

        const user = await User.findOne({ discordID: req.body.discordID }, { mapPoints: 1 }).lean();
        if (!user) return res.status(404).json({error: "No user found"});

        let entries = map.entries
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
        // Check for mismatches
        // there already is an entry in the leaderboard schema but not in the users points (shouldn't happen, bc on login i update user points)
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

        return res.status(200).json(responseWithDebug)
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
}

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

// TODO recalculate points here and at delete map of the week + check why recalculation is not working
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
}

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
}

const deleteLeaderboardBySteamID = async (req, res) => {
    try {
        const { steamID } = req.params;

        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({ error: 'No leadearboard found' });

        // Delete the leaderboard document
        await Leaderboard.deleteOne({ steamID });

        // Delete any MOTW submissions for this map
        await MotwSubmission.deleteOne({ steamID });

        // Remove mapPoints entries referencing this map for all users
        await User.updateMany(
            { 'mapPoints.mapSteamID': steamID },
            { $pull: { mapPoints: { mapSteamID: steamID } } }
        );

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

const getMOTW = async (req, res) => {
    const response = await Leaderboard.findOne({ featured: true });

    if (!response) return res.status(404).json({error: "No featured map"});
    const motwSubmissions = await MotwSubmission.findOne({ steamID: response.steamID }).lean();
    res.status(200).json({
        ...response.toObject(),
        entries: motwSubmissions?.entries || [],
        motwNumber: getMotwNumber()
    })
}

module.exports = {
    getLeaderboards,
    getLeaderboard,
    createMapLeaderboard,
    changeMapDifficultyBonus,
    createOrEditEntry,
    createMotwEntry,
    deleteEntryByMapAndDiscord,
    deleteMotwEntryByMapAndDiscord,
    deleteLeaderboardBySteamID,
    logMapPointsForLeaderboard,
    getMOTW,
    getRecentLeaderboards,
    getEntriesByUser
}