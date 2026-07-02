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
            previewImage = ''
        } = req.body;
        const difficultyBonus = Number.parseInt(req.body?.difficultyBonus ?? 0, 10);

        if (!id || !mapName) {
            return res.status(400).json({ error: 'id and mapName are required' });
        }

        if (Number.isNaN(difficultyBonus)) {
            return res.status(400).json({ error: 'difficultyBonus must be a number' });
        }

        const normalizedId = String(id).trim();
        const normalizedMapName = String(mapName).trim();
        if (!normalizedId || !normalizedMapName) {
            return res.status(400).json({ error: 'id and mapName are required' });
        }

        const existingLeaderboard = await CustomLeaderboard.findOne({ id: normalizedId }).lean();
        if (existingLeaderboard) {
            return res.status(409).json({ error: 'Custom leaderboard id already exists' });
        }

        const leaderboard = await CustomLeaderboard.create({
            id: normalizedId,
            mapName: normalizedMapName,
            creator: 'Superku',
            description,
            previewImage,
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
