const User = require('../models/userModel');

async function oneTimeMigrate (req, res) {
    try {
        await setAdminUsers(req, res);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function setAdminUsers(req, res) {
    const adminDiscordIDs = [
        '261147203307831296', // Junker
        '333677894838648853'
    ]
    const resetRes = await User.updateMany({}, {$set: {isAdmin: false}});

    const adminRes = await User.updateMany(
        {discordID: {$in: adminDiscordIDs}},
        {$set: {isAdmin: true}});

    return res.status(200).json({
        adminRes: adminRes,
        resetRes: resetRes,
    })
}

module.exports = {oneTimeMigrate}