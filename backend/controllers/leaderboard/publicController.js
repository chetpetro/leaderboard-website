const Leaderboard = require('../../models/LeaderboardModel');
const MotwSubmission = require('../../models/MotwSubmissionModel');
const { getAverageColor } = require('fast-average-color-node');
const { getMotwNumber } = require('../../scripts/motwNumber');
const getLeaderboards = async (req, res) => {
    const response = await Leaderboard.find({}).sort({ entries: -1 });
    res.status(200).json(response);
};

/* recently created leaderboards */
const getRecentLeaderboards = async (req, res) => {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 10 : Math.min(Math.max(requestedLimit, 1), 50);
    const response = await Leaderboard
        .find({})
        .sort({ createdAt: -1})
        .limit(limit);
    res.status(200).json(response);
};
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
};
const getLeaderboard = async (req, res) => {
    const { steamID } = req.params;
    const response = await Leaderboard.find({ steamID });
    if (!response) return res.status(404).json({ error: 'No leadearboard with map name found' });
    res.status(200).json(response);
};
const createMapLeaderboard = async (req, res) => {
    const getID = (url) => {
        const match = /(?<=id=)\d*/.exec(url);
        return match ? match[0] : null;
    };
    try {
        let { url, entries } = req.body;
        if (!entries) entries = [];
        const mapID = getID(url);
        if (!mapID) {
            return res.status(400).json({ error: 'Invalid or missing map URL / id' });
        }
        // If a leaderboard for this steamID already exists, reject the request
        const existing = await Leaderboard.findOne({ steamID: mapID });
        if (existing) {
            return res.status(400).json({ error: 'Leaderboard with this steamID already exists' });
        }
        const API_KEY = process.env.STEAM_API_KEY;
        const mapData = new FormData();
        mapData.append('itemcount', '1');
        mapData.append('publishedfileids[0]', mapID);
        const mapResponse = await fetch(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, {
            method: 'POST',
            body: mapData
        });
        const mapJson = await mapResponse.json();
        const mapInfo = mapJson.response.publishedfiledetails[0];
        const playerResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${mapInfo.creator}`);
        const playerJson = await playerResponse.json();
        const colour = await getAverageColor(mapInfo.preview_url);
        const mapEntry = {
            mapName: mapInfo.title,
            steamID: mapID,
            creator: playerJson.response.players[0].personaname,
            description: mapInfo.description,
            previewImage: mapInfo.preview_url,
            colour,
            entries
        };
        const response = await Leaderboard.create(mapEntry);
        res.status(200).json(response);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
const changeMapDifficultyBonus = async (req, res) => {
    const { steamID, difficultyBonusStr } = req.params;
    const difficultyBonusRaw = req.body?.difficultyBonus ?? difficultyBonusStr;
    const difficultyBonus = Number.parseInt(difficultyBonusRaw, 10);
    if (Number.isNaN(difficultyBonus)) {
        return res.status(400).json({ error: `Invalid difficulty bonus value. difficultyBonusStr: ${difficultyBonusStr}, parsed: ${difficultyBonus}` });
    }
    const map = await Leaderboard.findOne({ steamID });
    if (!map) return res.status(404).json({ error: 'No leadearboard found' });
    map.difficultyBonus = difficultyBonus;
    await map.save();
    res.status(200).json(map);
};
const getMOTW = async (req, res) => {
    const response = await Leaderboard.findOne({ featured: true });
    if (!response) return res.status(404).json({ error: 'No featured map' });
    const motwSubmissions = await MotwSubmission.findOne({ steamID: response.steamID }).lean();
    res.status(200).json({
        ...response.toObject(),
        entries: motwSubmissions?.entries || [],
        motwNumber: getMotwNumber()
    });
};
module.exports = {
    getLeaderboards,
    getLeaderboard,
    createMapLeaderboard,
    changeMapDifficultyBonus,
    getMOTW,
    getRecentLeaderboards,
    getEntriesByUser
};
