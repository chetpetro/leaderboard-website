const Leaderboard = require('../models/LeaderboardModel');
const User = require('../models/userModel');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");

const buildMotwMessageContent = ({ mapName, steamID, creator, wrEntry }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const mapUrl = `${leaderboardUrl}${steamID}`;

    const wrLine = wrEntry
        ? replaceTemplateKeywords('Current WR: `%WRTIME%` by: [%WRUSER%](<%WRUSERURL%>)', {
            WRTIME: msToTime(wrEntry.time),
            WRUSER: wrEntry.userName,
            WRUSERURL: `${leaderboardUrl}user/${wrEntry.discordID}`
        })
        : 'Current WR: `No run yet`';

    const template = [
        '## New Map Of the Week: [%MAPNAME%](<%MAPURL%>) By: %CREATOR%',
        '%WRLINE%',
        '-# _Submit your best run this week - points are awarded when the next Map of the Week rotation happens._'
    ].join('\n');

    return replaceTemplateKeywords(template, {
        MAPNAME: mapName,
        MAPURL: mapUrl,
        CREATOR: creator,
        WRLINE: wrLine
    });
};

const sendDiscordMotwMessage = async ({ mapName, steamID, creator, wrEntry }) => {
    const content = buildMotwMessageContent({ mapName, steamID, creator, wrEntry });

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

const getRandomLeaderboardWithWr = async () => {
    const response = await Leaderboard.aggregate([{ $sample: { size: 1 } }]);
    const selectedMap = response[0];

    if (!selectedMap) {
        return null;
    }

    const sortedEntries = Array.isArray(selectedMap.entries)
        ? [...selectedMap.entries].sort((a, b) => a.time - b.time)
        : [];

    return {
        selectedMap,
        wrEntry: sortedEntries.length ? sortedEntries[0] : null
    };
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

    const randomLeaderboard = await getRandomLeaderboardWithWr();

    if (!randomLeaderboard) {
        return res.status(404).json({ error: 'No leaderboard found' });
    }

    const { selectedMap, wrEntry } = randomLeaderboard;
    console.log(selectedMap.mapName)
    await Leaderboard.findOneAndUpdate({ _id: selectedMap._id }, {featured: true});

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

const previewMotwMessage = async (req, res) => {
    try {
        const randomLeaderboard = await getRandomLeaderboardWithWr();

        if (!randomLeaderboard) {
            return res.status(404).json({ error: 'No leaderboard found' });
        }

        const { selectedMap, wrEntry } = randomLeaderboard;
        const content = buildMotwMessageContent({
            mapName: selectedMap.mapName,
            steamID: selectedMap.steamID,
            creator: selectedMap.creator,
            wrEntry
        });

        return res.status(200).json({
            mapName: selectedMap.mapName,
            content
        });
    } catch (err) {
        console.log('Failed to preview MotW message:', err);
        return res.status(500).json({ error: 'Could not build message preview' });
    }
};

module.exports = {
    newFeaturedLeaderboard,
    previewMotwMessage,
    buildMotwMessageContent
};
