const Leaderboard = require('../models/LeaderboardModel');

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
    try {
        console.log(req.body);
        const response = await Leaderboard.create(req.body);
        res.status(200).json(response);
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