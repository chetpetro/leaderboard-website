const User = require('../models/userModel');

async function oneTimeMigrate (req, res) {
    try {
        await getAdminUsers(req, res);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function getAdminUsers(req, res) {
    const adminDiscordIDs = [
        '261147203307831296', // Junker
        '333677894838648853'
    ]
    const admins = User.find(
        { discordID: {$in: adminDiscordIDs}, isAdmin: true},
        {_id: 0, userName: 1, discordID: 1}
    )

    return res.status(200).json({
        admins: admins,
    })
}

module.exports = {oneTimeMigrate}