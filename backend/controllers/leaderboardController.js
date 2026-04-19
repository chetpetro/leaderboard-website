const Leaderboard = require('../models/LeaderboardModel');
const { getAverageColor } = require('fast-average-color-node');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");
const { sendDiscordMessage } = require('../utils/discordUtil');
require('dotenv').config()

const sendDiscordPbMessage = async ({ discordID, userName, time, mapName, steamID, wrContext }) => {
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

const createOrEditEntry = async (req, res) => {
    try {
        const { steamID } = req.params;

        const map = await Leaderboard.findOne({ steamID });
        if (!map) return res.status(404).json({error: "No leadearboard found"});

        let entries = map.entries
        const submissionDate = new Date();

        const getWrContext = () => {
            const oldWrEntry = entries.reduce((best, entry) => {
                if (!entry || !Number.isFinite(entry.time)) return best;
                if (!best || entry.time < best.time) return entry;
                return best;
            }, null);
            const submittedTime = Number(req.body.time);
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
                isSelfWrImprovement: isNewWr && oldWrEntry.discordID === req.body.discordID,
                oldWrTime: oldWrEntry.time,
                oldWrHolder: oldWrEntry.userName,
                oldWrHolderDiscordID: oldWrEntry.discordID
            };
        };

        const discordPayload = {
            discordID: req.body.discordID,
            userName: req.body.userName,
            time: req.body.time,
            mapName: map.mapName,
            steamID: map.steamID,
            wrContext: getWrContext()
        };

        const existingEntryIndex = entries.findIndex(
            (entry) => req.body.time && entry.discordID === req.body.discordID
        );

        let responsePayload;

        if (existingEntryIndex !== -1) {
            if (entries[existingEntryIndex].time <= req.body.time) {
                return res.status(400).json({msg: 'Posting slower time, time not updated!'});
            }

            entries[existingEntryIndex] = { ...req.body, submittedAt: submissionDate };
            responsePayload = await Leaderboard.findOneAndUpdate(
                { steamID },
                { entries, lastSubmissionAt: submissionDate },
                { new: true }
            );
        } else {
            responsePayload = await Leaderboard.updateOne(
                { steamID },
                {
                    $push: { entries: { ...req.body, submittedAt: submissionDate } },
                    $set: { lastSubmissionAt: submissionDate }
                }
            );
        }

        try {
            await sendDiscordPbMessage(discordPayload);
        } catch (discordError) {
            console.error('Failed to send Discord PB message:', discordError);
        }

        return res.status(200).json(responsePayload)
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
}

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

const getMOTW = async (req, res) => {
    const response = await Leaderboard.findOne({ featured: true });

    if (!response) return res.status(404).json({error: "No featured map"});
    res.status(200).json(response)
}

module.exports = {
    getLeaderboards,
    getLeaderboard,
    createMapLeaderboard,
    changeMapDifficultyBonus,
    createOrEditEntry,
    deleteEntryByMapAndDiscord,
    getMOTW,
    getRecentLeaderboards
}