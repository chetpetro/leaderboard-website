const Leaderboard = require('../models/LeaderboardModel');
const { getAverageColor } = require('fast-average-color-node');
require('dotenv').config()

const msToTime = (duration) => {
    var milliseconds = duration.toString().slice(-3);
    var seconds = Math.floor((duration / 1000) % 60);
    var minutes = Math.floor((duration / (1000 * 60)) % 60);
    var hours = Math.floor(duration / (1000 * 60 * 60));

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    hours = (hours < 10) ? "0" + hours : hours;

    return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}

const getLeaderboards = async (req, res) =>  {
    const response = await Leaderboard.find({}).sort({entries: -1});
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

    for(let i = 0; i < entries.length; i++){
        if (entries[i].discordID == req.body.discordID){
            if (entries[i].time >= req.body.time) {
                entries[i] = req.body;
                const update = await Leaderboard.findOneAndUpdate({ steamID }, { entries });


                await fetch('https://discord.com/api/v9/channels/1046110817986293792/messages', {
                    method: "POST",
                    body: JSON.stringify({content: `<@${req.body.discordID}> set a new PB of ${msToTime(req.body.time)} on ${map.mapName}!\n[Pogostuck Leaderboards]<https://pogostuckleaderboards.vercel.app/>`}),
                    headers: {
                        "Authorization":  process.env.DISCORD_TOKEN,
                        'Content-Type': 'application/json'
                    }
                })

                res.status(200).json(update);
            } else {
                res.status(200).json({msg: 'Posting slower time, time not updated!'});
            }
            return;
        }
    }

    const response = await Leaderboard.updateOne({ steamID }, { $push : { entries: req.body }});

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
    getMOTW
}