const Leaderboard = require('../models/LeaderboardModel');
const { getAverageColor } = require('fast-average-color-node');
require('dotenv').config()

const getLeaderboards = async (req, res) =>  {
    const response = await Leaderboard.find({}).sort({entries: -1});
    res.status(200).json(response);
}

const getLeaderboard = async (req, res) =>  {
    const { name } = req.params;
    const response = await Leaderboard.find({ mapName: name })

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

        const playerResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=73A7B076566AD80DF796828984EFFD37&steamids=76561199054628134`);
        const playerJson = await playerResponse.json();

        const colour = await getAverageColor(mapInfo.preview_url);

        res.status(400).json(playerJson)

        // mapEntry = { 
        //     mapName: mapInfo.title,
        //     creator: playerJson.response.players[0].personaname,
        //     description: mapInfo.description,
        //     previewImage: mapInfo.preview_url,
        //     colour,
        //     entries
        // }

        // const response = await Leaderboard.create(mapEntry);
        // res.status(200).json(response);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}

const createEntry = async (req, res) => {
    const { name } = req.params;

    const response = await Leaderboard.findOneAndUpdate({ mapName: name }, req.body);

    if (!response) return res.status(404).json({error: "No leadearboard with map name found"});

    res.status(200).json(response);
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