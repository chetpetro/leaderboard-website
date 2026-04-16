const Leaderboard = require('../models/LeaderboardModel');
const { getAverageColor } = require('fast-average-color-node');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");
const { sendDiscordMessage } = require('../utils/discordUtil');
require('dotenv').config()

const sendDiscordPbMessage = async ({ discordID, userName, time, mapName, steamID }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const userUrl = `${leaderboardUrl}user/${discordID}`;
    const mapUrl = `${leaderboardUrl}${steamID}`;
    const template = [
        'New PB for <@%DISCORDID%>',
        '',
        '**PB:** `%PBTIME%`',
        '**By:** [%USERNAME%](<%USERURL%>)',
        '**Map:** [%MAPNAME%](<%MAPURL%>)',
        '',
        '**More on:** [Pogostuck Leaderboards](<%LEADERBOARDURL%>)'
    ].join('\n');

    const content = replaceTemplateKeywords(template, {
        DISCORDID: discordID,
        PBTIME: msToTime(time),
        USERNAME: userName,
        USERURL: userUrl,
        MAPNAME: mapName,
        MAPURL: mapUrl,
        LEADERBOARDURL: leaderboardUrl
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

const createLeaderboard = async (req, res) => {
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

const createEntry = async (req, res) => {

    const { steamID } = req.params;

    const map = await Leaderboard.findOne({ steamID });
    if (!map) return res.status(404).json({error: "No leadearboard found"});

    let entries = map.entries
    const submissionDate = new Date();

    for(let i = 0; i < entries.length; i++){
        if (req.body.time && entries[i].discordID === req.body.discordID){
            if (entries[i].time >= req.body.time) {
                entries[i] = { ...req.body, submittedAt: submissionDate };
                const update = await Leaderboard.findOneAndUpdate(
                    { steamID },
                    { entries, lastSubmissionAt: submissionDate },
                    { new: true }
                );


                await sendDiscordPbMessage({
                    discordID: req.body.discordID,
                    userName: req.body.userName,
                    time: req.body.time,
                    mapName: map.mapName,
                    steamID: map.steamID
                });

                res.status(200).json(update);
            } else {
                res.status(200).json({msg: 'Posting slower time, time not updated!'});
            }
            return;
        }
    }

    await sendDiscordPbMessage({
        discordID: req.body.discordID,
        userName: req.body.userName,
        time: req.body.time,
        mapName: map.mapName,
        steamID: map.steamID
    });

    const response = await Leaderboard.updateOne(
        { steamID },
        {
            $push: { entries: { ...req.body, submittedAt: submissionDate } },
            $set: { lastSubmissionAt: submissionDate }
        }
    );

    res.status(200).json(response)
}

const getMOTW = async (req, res) => {
    const response = await Leaderboard.findOne({ featured: true });

    if (!response) return res.status(404).json({error: "No featured map"});
    res.status(200).json(response)
}

module.exports = {
    getLeaderboards,
    getLeaderboard,
    createLeaderboard,
    createEntry,
    getMOTW,
    getRecentLeaderboards
}