const CustomLeaderboard = require('../../models/CustomLeaderboardModel');

const getCustomLeaderboard = async (req, res) => {
    try {
        const { id } = req.params;
        const leaderboard = await CustomLeaderboard.findOne({ id }).lean();

        if (!leaderboard) {
            return res.status(404).json({ error: 'No custom leaderboard found' });
        }

        return res.status(200).json(leaderboard);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

const createCustomLeaderboard = async (req, res) => {
    try {
        const {
            id,
            mapName,
            description = '',
            creator
        } = req.body;
        const difficultyBonus = Number.parseInt(req.body?.difficultyBonus ?? 0, 10);

        if (!id || !mapName || !creator) {
            return res.status(400).json({ error: 'id, mapName and creator are required' });
        }

        if (Number.isNaN(difficultyBonus)) {
            return res.status(400).json({ error: 'difficultyBonus must be a number' });
        }

        const normalizedId = String(id).trim();
        const normalizedMapName = String(mapName).trim();
        const normalizedCreator = String(creator).trim();
        if (!normalizedId || !normalizedMapName || !normalizedCreator) {
            return res.status(400).json({ error: 'id, mapName and creator are required' });
        }

        const existingLeaderboard = await CustomLeaderboard.findOne({ id: normalizedId }).lean();
        if (existingLeaderboard) {
            return res.status(409).json({ error: 'Custom leaderboard id already exists' });
        }

        const leaderboard = await CustomLeaderboard.create({
            id: normalizedId,
            mapName: normalizedMapName,
            creator: normalizedCreator,
            description,
            previewImage: `/public/customLeaderboardImages/${normalizedId}.png`,
            difficultyBonus,
            isCustomLeaderboard: true,
            entries: []
        });

        return res.status(201).json(leaderboard);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCustomLeaderboard,
    createCustomLeaderboard
};
