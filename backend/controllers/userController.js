const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Leaderboard = require('../models/LeaderboardModel');

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' });
}

const loginUser = async (req, res) => {
    const { userName, password } = req.body;

    try{
        const user = await User.login(userName, password);

        const token = createToken(user._id);

        res.status(200).json({userName, discordID: user.discordID, token})
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const singupUser = async (req, res) => {
    const { userName, discordID, password } = req.body;

    try{
        const user = await User.signup(userName, discordID, password);

        const token = createToken(user._id);

        res.status(200).json({userName, discordID: user.discordID, token})
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const getUser = async (req, res) => {
    const { id } = req.params;

    const userInfo = await Leaderboard.find({entries: {$elemMatch: {discordID: id}}})
    let user;
    try {
        user = await User.findOne({ discordID: id })
        user.password = ""
    } catch (error) {
        return res.status(400).json({error: "User not found"})
    }
    let userEntries = {user, entries: []}
    userInfo.map((leaderboard) => leaderboard.entries.sort((a, b) => a.time - b.time).map((entry, index) => {
        if (entry.discordID === Number(id)) userEntries.entries.push({mapName: leaderboard.mapName, pos: index + 1, entry})
    }))
    res.status(200).json(userEntries)
}

module.exports = {
    loginUser,
    singupUser,
    getUser
}