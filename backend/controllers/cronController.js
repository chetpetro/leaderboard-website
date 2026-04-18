const Leaderboard = require('../models/LeaderboardModel');
const User = require('../models/userModel');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");
const { sendDiscordMessage } = require('../utils/discordUtil');

const buildMotwMessageContent = ({ mapName, steamID, creator, wrEntry }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const mapUrl = `${leaderboardUrl}${steamID}`;

    const template = [
        '## New Map Of the Week: [%MAPNAME%](<%MAPURL%>) By: %CREATOR%',
        (wrEntry ? 'Current WR: `%WRTIME%` by: [%WRUSER%](<%WRUSERURL%>)' : 'Current WR: `No run yet`'),
        '-# _Submit your best run this week - points are awarded when the next Map of the Week rotation happens._'
    ].join('\n');

    return replaceTemplateKeywords(template, {
        MAPNAME: mapName,
        MAPURL: mapUrl,
        CREATOR: creator,
        WRTIME: msToTime(wrEntry.time),
        WRUSER: wrEntry.userName,
        WRUSERURL: `${leaderboardUrl}user/${wrEntry.discordID}`
    });
};

const sendNewMotwMessage = async ({ mapName, steamID, creator, wrEntry }) => {
    const content = buildMotwMessageContent({ mapName, steamID, creator, wrEntry });
    await sendDiscordMessage(content);
};

const sendMotwRecapMessage = async () => {
    try {
        // Get the current featured leaderboard (the one that's ending)
        const currentFeatured = await Leaderboard.findOne({ featured: true });

        if (!currentFeatured) {
            console.log('No featured leaderboard found for recap');
            return;
        }

        // Filter entries submitted in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const entries = Array.isArray(currentFeatured.entries)
            ? [...currentFeatured.entries]
                .filter(entry => entry.submittedAt && new Date(entry.submittedAt) >= sevenDaysAgo)
                .sort((a, b) => a.time - b.time)
            : [];

        const participantCount = entries.length;
        const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
        const mapUrl = `${leaderboardUrl}${currentFeatured.steamID}`;

        // Build the recap message
        let podiumContent = '';
        if (participantCount === 0) {
            podiumContent = 'No participants this week.';
        } else if (participantCount === 1) {
            const first = entries[0];
            podiumContent = `🥇 ${first.userName} - \`${msToTime(first.time)}\``;
        } else if (participantCount === 2) {
            const first = entries[0];
            const second = entries[1];
            podiumContent = `🥇 ${first.userName} - \`${msToTime(first.time)}\`\n🥈 ${second.userName} - \`${msToTime(second.time)}\``;
        } else {
            // 3 or more participants
            const first = entries[0];
            const second = entries[1];
            const third = entries[2];
            podiumContent = `🥇 ${first.userName} - \`${msToTime(first.time)}\`\n🥈 ${second.userName} - \`${msToTime(second.time)}\`\n🥉 ${third.userName} - \`${msToTime(third.time)}\``;
        }

        const template = [
            `## Map of the Week Recap: [${currentFeatured.mapName}](${mapUrl})`,
            `**Participants:** ${participantCount}`,
            '',
            '### Top Performers:',
            podiumContent
        ].join('\n');

        await sendDiscordMessage(template);
    } catch (err) {
        console.log('Failed to send MotW recap message:', err);
    }
}

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
                    const earnedPoints = Math.floor(100 / ((0.4 * i) + 1));
                    user.points = earnedPoints + user.points;
                    user.newPoints.push({
                        points: earnedPoints,
                        steamID: current.steamID,
                        mapName: current.mapName,
                        addedAt: new Date()
                    });
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
        await sendMotwRecapMessage();
        await sendNewMotwMessage({
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
