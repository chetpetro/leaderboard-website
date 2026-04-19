const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Leaderboard = require('../models/LeaderboardModel');
const {currentPointCalculationMethod, calculatePoints} = require("../scripts/points");

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' });
}

function return200AndUseWithToken(res, userName, user, token) {
    res.status(200).json({userName, discordID: user.discordID, token, isAdmin: user.isAdmin, mapPoints: (user.mapPoints ? user.mapPoints : [])})
}

const loginUser = async (req, res) => {
    const { userName, password } = req.body;

    try{
        const user = await User.login(userName, password);

        const token = createToken(user._id);
        return200AndUseWithToken(res, userName, user, token);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const loginUserDiscord = async (req, res) => {
    const { tokenType, accessToken } = req.body;

    try{
        const user = await User.loginDiscord(tokenType, accessToken);

        const token = createToken(user._id);
        return200AndUseWithToken(res, user.userName, user, token);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const signupUser = async (req, res) => {
    const { userName, discordID, password } = req.body;

    try{
        const user = await User.signup(userName, discordID, password);

        const token = createToken(user._id);
        return200AndUseWithToken(res, userName, user, token);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const signupUserDiscord = async (req, res) => {
    const { tokenType, accessToken } = req.body;

    try{
        const user = await User.signupDiscord(tokenType, accessToken);

        const token = createToken(user._id);
        return200AndUseWithToken(res, user.userName, user, token)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const getUser = async (req, res) => {
    const { id } = req.params;

    let user;
    try {
        user = await User.findOne({ discordID: id })
        user.password = ""
    } catch (error) {
        return res.status(400).json({error: "User not found"})
    }
    const mapsWithUser = await Leaderboard.find({entries: {$elemMatch: {discordID: user.discordID}}})
    mapsWithUser.forEach((map) => map.entries.sort((a, b) => a.time - b.time))
    const recalculated = await updateUserPointsIfCalculationMethodChanged(user, mapsWithUser);
    const userWithEntries = await getUserWithEntries(user, mapsWithUser);
    res.status(200).json({...userWithEntries, recalculated})
}

async function updateUserPointsIfCalculationMethodChanged(user, mapsWithUser) {
    const debugLog = [];
    user.mapPoints = [];

    mapsWithUser.forEach((map) => {
        const userRank = map.entries.findIndex((entry) => entry.discordID === user.discordID) + 1;
        const newPoints = calculatePoints(map.entries.length, userRank, map.difficultyBonus);

        // Update the user object
        user.mapPoints.push({ points: newPoints, mapSteamID: map.steamID });

        // Collect debug data
        debugLog.push({
            mapName: map.mapName,
            steamID: map.steamID,
            entryCount: map.entries.length,
            userRank: userRank,
            newPoints: newPoints,
            difficultyBonus: map.difficultyBonus
        });
    });

    user.pointCalculationMethod = currentPointCalculationMethod();
    await user.save();

    return debugLog;
}

async function getUserWithEntries(user, userMapEntries) {
    let userWithEntries = {user, entries: []}

    userMapEntries.forEach((leaderboard) => leaderboard.forEach((entry, index) => {
        if (entry.discordID === user.discordID) userWithEntries.entries.push({mapName: leaderboard.mapName, steamID: leaderboard.steamID, pos: index + 1, entry})
    }))
    return userWithEntries;
}

const getUsers = async (req, res) => {
    const users = await User.find({}).sort({points: -1});

    if (!users) return res.status(400).json({error: "No users found"});

    res.status(200).json(users)
}

module.exports = {
    loginUser,
    signupUser,
    getUser,
    getUsers,
    signupUserDiscord,
    loginUserDiscord
}