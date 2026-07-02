const Leaderboard = require('../../models/LeaderboardModel');
const CustomLeaderboard = require('../../models/CustomLeaderboardModel');
const MotwSubmission = require('../../models/MotwSubmissionModel');
const { getAverageColor } = require('fast-average-color-node');
const { getMotwNumber } = require('../../scripts/motwNumber');
const { recomputeMapPointsForLeaderboard } = require('./shared');
const { resolveLeaderboardByKey, getMapKey, withMapKey } = require('./mapUtils');

const fetchAllLeaderboards = async () => {
    const [steamLeaderboards, customLeaderboards] = await Promise.all([
        Leaderboard.find({}).lean(),
        CustomLeaderboard.find({}).lean()
    ]);

    return [
        ...steamLeaderboards.map(withMapKey),
        ...customLeaderboards.map(withMapKey)
    ];
};

const getLeaderboards = async (req, res) => {
    const response = await fetchAllLeaderboards();
    res.status(200).json(response.sort((a, b) => (b.entries?.length || 0) - (a.entries?.length || 0)));
};

const getRecentLeaderboards = async (req, res) => {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 10 : Math.min(Math.max(requestedLimit, 1), 50);
    const response = await fetchAllLeaderboards();
    res.status(200).json(
        response
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, limit)
    );
};

const getEntriesByUser = async (req, res) => {
    const { user: discordID } = req.query;
    if (!discordID) {
        return res.status(400).json({ error: 'Missing user query parameter' });
    }

    try {
        const [steamLeaderboards, customLeaderboards] = await Promise.all([
            Leaderboard.find({ 'entries.discordID': discordID }, { mapName: 1, steamID: 1, entries: 1 }).lean(),
            CustomLeaderboard.find({ 'entries.discordID': discordID }, { mapName: 1, id: 1, entries: 1 }).lean()
        ]);

        const mapsWithUser = [
            ...steamLeaderboards.map(withMapKey),
            ...customLeaderboards.map(withMapKey)
        ];

        mapsWithUser.forEach((map) => {
            if (Array.isArray(map.entries)) {
                map.entries.sort((a, b) => a.time - b.time);
            }
        });

        const entries = [];
        mapsWithUser.forEach((leaderboard) => {
            if (!Array.isArray(leaderboard.entries)) return;
            leaderboard.entries.forEach((entry, index) => {
                if (entry?.discordID === discordID) {
                    entries.push({
                        mapName: leaderboard.mapName,
                        mapKey: getMapKey(leaderboard),
                        steamID: leaderboard.steamID || leaderboard.id || leaderboard.mapKey,
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
    const { mapKey } = req.params;
    const resolved = await resolveLeaderboardByKey(mapKey);

    if (!resolved.map) return res.status(404).json({ error: 'No leadearboard with map name found' });
    res.status(200).json([withMapKey(resolved.map)]);
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
        res.status(200).json(withMapKey(response));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const changeMapDifficultyBonus = async (req, res) => {
    const { mapKey, difficultyBonusStr } = req.params;
    const difficultyBonusRaw = req.body?.difficultyBonus ?? difficultyBonusStr;
    const difficultyBonus = Number.parseInt(difficultyBonusRaw, 10);
    if (Number.isNaN(difficultyBonus)) {
        return res.status(400).json({ error: `Invalid difficulty bonus value. difficultyBonusStr: ${difficultyBonusStr}, parsed: ${difficultyBonus}` });
    }

    const resolved = await resolveLeaderboardByKey(mapKey);
    const map = resolved.map;
    if (!map) return res.status(404).json({ error: 'No leadearboard found' });

    map.difficultyBonus = difficultyBonus;
    await map.save();
    await recomputeMapPointsForLeaderboard({
        finalEntries: map.entries,
        mapKey: getMapKey(map),
        difficultyBonus: map.difficultyBonus
    });
    res.status(200).json(withMapKey(map));
};

const getMOTW = async (req, res) => {
    const [steamFeatured, customFeatured] = await Promise.all([
        Leaderboard.findOne({ featured: true }),
        CustomLeaderboard.findOne({ featured: true })
    ]);

    const response = steamFeatured || customFeatured;
    if (!response) return res.status(404).json({ error: 'No featured map' });

    const mapKey = getMapKey(response);
    const motwSubmissions = await MotwSubmission.findOne({ steamID: mapKey }).lean();
    res.status(200).json({
        ...withMapKey(response),
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
