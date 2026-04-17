const User = require('../models/userModel');

async function oneTimeMigrate(req, res) {
    try {
        const admins = await getAdminUsers();
        return res.status(200).json({ admins });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getAdminUsers() {
    const adminDiscordIDs = [
        '261147203307831296', // Junker
        '333677894838648853'
    ];

    return User.find(
        {discordID: {$in: adminDiscordIDs}, isAdmin: true},
        {_id: 0, userName: 1, discordID: 1}
    ).lean();
}

module.exports = { oneTimeMigrate };