const User = require('../models/userModel');
const Leaderboard = require('../models/LeaderboardModel');
const { recalculatePointsForMap } = require('./leaderboardController');

async function oneTimeMigrate(req, res) {
    try {
        // Get all leaderboards
        const maps = await Leaderboard.find({});

        if (!maps || maps.length === 0) {
            return res.status(200).json({ message: 'No maps found to migrate' });
        }

        let processedCount = 0;
        let errorCount = 0;

        // Process each map
        for (const map of maps) {
            try {
                await recalculatePointsForMap(map);
                processedCount++;
            } catch (error) {
                console.error(`Error processing map ${map.steamID}:`, error);
                errorCount++;
            }
        }

        return res.status(200).json({
            message: 'Migration completed',
            processedMaps: processedCount,
            errors: errorCount,
            totalMaps: maps.length
        });
    } catch (error) {
        console.error('Migration error:', error);
        return res.status(400).json({ error: error.message });
    }
}

module.exports = { oneTimeMigrate };