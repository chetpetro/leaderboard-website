const Leaderboard = require('../models/LeaderboardModel');
const User = require('../models/userModel');

const msToTime = (duration) => {
    const milliseconds = duration.toString().slice(-3);
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor(duration / (1000 * 60 * 60));

    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;
    hours = (hours < 10) ? '0' + hours : hours;
    hours = hours === '00' ? '' : hours + ':';
    minutes = hours === '' && minutes === '00' ? '' : minutes + ':';

    return hours + minutes + seconds + '.' + milliseconds;
};

const sendDiscordMotwMessage = async ({ mapName, steamID, creator, wrEntry }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const mapUrl = `${leaderboardUrl}${steamID}`;

    const wrLine = wrEntry
        ? `Current WR: \`${msToTime(wrEntry.time)}\` by: [${wrEntry.userName}](<${leaderboardUrl}user/${wrEntry.discordID}>)`
        : 'Current WR: `No run yet`';

    const content = [
        `## New Map Of the Week: [${mapName}](<${mapUrl}>) By: ${creator}`,
        wrLine,
        '-# _Submit your best run this week - points are awarded when the next Map of the Week rotation happens._'
    ].join('\n');

    await fetch('https://discord.com/api/v9/channels/1046110817986293792/messages', {
        method: 'POST',
        body: JSON.stringify({
            content
        }),
        headers: {
            Authorization: process.env.DISCORD_TOKEN,
            'Content-Type': 'application/json'
        }
    });
};

const newFeaturedLeaderboard = async (req, res) => {
    try{
        const current = await Leaderboard.findOneAndUpdate({ featured: true }, {featured: false});

        if (current) {
            const entries = current.entries.sort((a, b) => a.time - b.time)

            for (let i = 0; i < entries.length; i++) {
                const user = await User.findOne({ discordID: entries[i].discordID });

                if (user) {
                    user.points = Math.floor(100 / ((0.4 * i) + 1)) + user.points;
                    user.save()
                }
            }
        }
    } catch (err) {
        console.log(err);
    }

    const response = await Leaderboard.aggregate([{ $sample: { size: 1 } }]);
    const selectedMap = response[0];
    console.log(selectedMap.mapName)
    await Leaderboard.findOneAndUpdate({ _id: selectedMap._id }, {featured: true});

    const sortedEntries = Array.isArray(selectedMap.entries)
        ? [...selectedMap.entries].sort((a, b) => a.time - b.time)
        : [];
    const wrEntry = sortedEntries.length ? sortedEntries[0] : null;

    try {
        await sendDiscordMotwMessage({
            mapName: selectedMap.mapName,
            steamID: selectedMap.steamID,
            creator: selectedMap.creator,
            wrEntry
        });
    } catch (err) {
        console.log('Failed to send MotW Discord message:', err);
    }

    res.status(200).json({msg: "updated MotW"})
}

module.exports = newFeaturedLeaderboard;