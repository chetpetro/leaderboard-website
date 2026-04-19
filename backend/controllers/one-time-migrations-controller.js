const Leaderboard = require('../models/LeaderboardModel');
const { recalculatePointsForMap } = require('./leaderboardController');

async function oneTimeMigrate(req, res) {
    try {
        const steamID = String(req.query?.steamID || '').trim();

        if (!steamID) {
            return res.status(400).json({ error: 'steamID query parameter is required' });
        }

        const map = await Leaderboard.findOne({ steamID });

        if (!map) {
            return res.status(404).json({ error: `No map found for steamID: ${steamID}` });
        }

        await recalculatePointsForMap(map);

        return res.status(200).json({
            message: 'Migration completed',
            steamID: map.steamID,
            mapName: map.mapName,
            processedEntries: Array.isArray(map.entries) ? map.entries.length : 0
        });
    } catch (error) {
        console.error('Migration error:', error);
        return res.status(400).json({ error: error.message });
    }
}

module.exports = { oneTimeMigrate };