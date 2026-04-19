const Leaderboard = require('../models/LeaderboardModel');
const { recalculatePointsForMap } = require('./leaderboardController');

const BATCH_SIZE = 10;

async function oneTimeMigrate(req, res) {
    try {
        const steamID = String(req.query?.steamID || '').trim();

        // Keep single-map mode working for existing callers.
        if (steamID) {
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
        }

        const parsedIndex = Number.parseInt(String(req.query?.index ?? ''), 10);
        if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
            return res.status(400).json({ error: 'index query parameter is required and must be an integer >= 0' });
        }

        const offset = parsedIndex;
        const totalMaps = await Leaderboard.countDocuments({});
        const maps = await Leaderboard.find({}).sort({ _id: 1 }).skip(offset).limit(BATCH_SIZE);

        if (!maps || maps.length === 0) {
            return res.status(200).json({
                message: 'No maps found in this batch',
                offset,
                batchSize: BATCH_SIZE,
                totalMaps,
                processedMaps: 0,
                errors: 0,
                errorDetails: [],
                nextIndex: null
            });
        }

        let processedCount = 0;
        let errorCount = 0;
        const errorDetails = [];

        for (const map of maps) {
            try {
                await recalculatePointsForMap(map);
                processedCount++;
            } catch (error) {
                console.error(`Error processing map ${map.steamID}:`, error);
                errorCount++;
                errorDetails.push({
                    steamID: map.steamID,
                    mapName: map.mapName,
                    error: error.message
                });
            }
        }

        const nextIndex = offset + maps.length < totalMaps ? offset + maps.length : null;

        return res.status(200).json({
            message: 'Batch migration completed',
            offset,
            batchSize: BATCH_SIZE,
            totalMaps,
            processedMaps: processedCount,
            errors: errorCount,
            errorDetails,
            nextIndex
        });
    } catch (error) {
        console.error('Migration error:', error);
        return res.status(400).json({ error: error.message });
    }
}

module.exports = { oneTimeMigrate };