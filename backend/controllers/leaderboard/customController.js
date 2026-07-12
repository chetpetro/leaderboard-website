const Leaderboard = require('../../models/LeaderboardModel');
const CustomLeaderboard = require('../../models/CustomLeaderboardModel');
const { withMapKey } = require('./mapUtils');

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

        const [existingLeaderboard, existingSteamLeaderboard] = await Promise.all([
            CustomLeaderboard.findOne({ id: normalizedId }).lean(),
            Leaderboard.findOne({ steamID: normalizedId }).lean()
        ]);
        if (existingLeaderboard) {
            return res.status(409).json({ error: 'Custom leaderboard id already exists' });
        }
        if (existingSteamLeaderboard) {
            return res.status(409).json({ error: 'A Steam leaderboard already uses this id' });
        }

        const leaderboard = await CustomLeaderboard.create({
            id: normalizedId,
            mapName: normalizedMapName,
            creator: normalizedCreator,
            description,
            previewImage: `/customLeaderboardImages/${normalizedId}.png`,
            difficultyBonus,
            isCustomLeaderboard: true,
            entries: []
        });

        return res.status(201).json(withMapKey(leaderboard));
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createCustomLeaderboard
};
