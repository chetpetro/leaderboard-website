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

    try {
        const user = await User.findOne({ discordID: id }).lean();
        if (!user) return res.status(404).json({ error: "User not found" });

        delete user.password;

        return res.status(200).json({
            user: user,
            shouldUpdatePoints: user.pointCalculationMethod !== currentPointCalculationMethod()
        });
    } catch (error) {
        console.error('getUser failed:', error);
        return res.status(500).json({ error: 'Failed to fetch user data: ' + error });
    }
}

const updateUserPoints = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ discordID: id });
        if (!user) return res.status(404).json({ error: "User not found" });

        const mapsWithUser = await Leaderboard.find(
            { 'entries.discordID': user.discordID },
            { mapName: 1, steamID: 1, entries: 1, difficultyBonus: 1 }
        ).lean();
        mapsWithUser.forEach((map) => map.entries.sort((a, b) => a.time - b.time));

        if (user.pointCalculationMethod !== currentPointCalculationMethod()) {
            await updateUserPointsIfCalculationMethodChanged(user, mapsWithUser);
        }

        const refreshedUser = await User.findOne({ discordID: id }).lean();
        delete refreshedUser.password;
        const userWithEntries = await getUserWithEntries(refreshedUser, mapsWithUser);

        return res.status(200).json({
            ...userWithEntries,
            shouldUpdatePoints: false
        });
    } catch (error) {
        console.error('updateUserPoints failed:', error);
        const responsePayload = {
            error: 'Failed to update user points',
            message: error?.message || 'Unknown server error',
            discordID: id,
            endpoint: '/api/user/:id/update-points'
        };

        return res.status(500).json(responsePayload);
    }
}

async function updateUserPointsIfCalculationMethodChanged(user, mapsWithUser) {
    const debugLog = [];
    user.mapPoints = [];

    mapsWithUser.forEach((map) => {
        if (!Array.isArray(map.entries) || map.entries.length === 0) return;

        const userRank = map.entries.findIndex((entry) => entry.discordID === user.discordID) + 1;
        if (userRank <= 0) return;

        const difficultyBonus = Number.isFinite(map.difficultyBonus) ? map.difficultyBonus : 0;
        const newPoints = calculatePoints(map.entries.length, userRank, difficultyBonus);
        if (!Number.isFinite(newPoints)) return;

        // Update the user object
        user.mapPoints.push({ points: newPoints, mapSteamID: map.steamID });

        // Collect debug data
        debugLog.push({
            mapName: map.mapName,
            steamID: map.steamID,
            entryCount: map.entries.length,
            userRank: userRank,
            newPoints: newPoints,
            difficultyBonus
        });
    });

    user.pointCalculationMethod = currentPointCalculationMethod();
    await user.save();

    return debugLog;
}

async function getUserWithEntries(user, userMapEntries) {
    const userWithEntries = { user, entries: [] };

    userMapEntries.forEach((leaderboard) => {
        if (!Array.isArray(leaderboard.entries)) return;

        leaderboard.entries.forEach((entry, index) => {
            if (entry?.discordID === user.discordID) {
                userWithEntries.entries.push({
                    mapName: leaderboard.mapName,
                    steamID: leaderboard.steamID,
                    pos: index + 1,
                    entry
                });
            }
        });
    });

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
    updateUserPoints,
    getUsers,
    signupUserDiscord,
    loginUserDiscord,
    updateUserPointsIfCalculationMethodChanged,
}