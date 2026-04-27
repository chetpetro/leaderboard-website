const Leaderboard = require('../models/LeaderboardModel');
const MotwSubmission = require('../models/MotwSubmissionModel');
const User = require('../models/userModel');
const { replaceTemplateKeywords } = require('../utils/templateReplacer');
const {msToTime} = require("../utils/timeUtil");
const { sendDiscordMessage } = require('../utils/discordUtil');
const { getMotwNumber } = require('../scripts/motwNumber');

const buildMotwMessageContent = ({ mapName, steamID, creator, wrEntry }) => {
    const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
    const mapUrl = `${leaderboardUrl}${steamID}`;
    const hasWrEntry = Boolean(wrEntry);

    const template = [
        '## New Map Of the Week: [%MAPNAME%](<%MAPURL%>) By: %CREATOR%',
        (hasWrEntry ? 'Current WR: `%WRTIME%` by: [%WRUSER%](<%WRUSERURL%>)' : 'Current WR: `No run yet`'),
        '-# _Submit your best run this week - points are awarded when the next Map of the Week rotation happens._'
    ].join('\n');

    return replaceTemplateKeywords(template, {
        MAPNAME: mapName,
        MAPURL: mapUrl,
        CREATOR: creator,
        WRTIME: hasWrEntry ? msToTime(wrEntry.time) : '',
        WRUSER: hasWrEntry ? wrEntry.userName : '',
        WRUSERURL: hasWrEntry ? `${leaderboardUrl}user/${wrEntry.discordID}` : ''
    });
};

const sendNewMotwMessage = async ({ mapName, steamID, creator, wrEntry }) => {
    const content = buildMotwMessageContent({ mapName, steamID, creator, wrEntry });
    await sendDiscordMessage(content);
};

const sendMotwRecapMessage = async (currentFeatured, motwEntries) => {
    try {

        if (!currentFeatured) {
            console.log('No featured leaderboard found for recap');
            return;
        }

        const entries = Array.isArray(motwEntries)
            ? [...motwEntries].sort((a, b) => a.time - b.time)
            : [];

        const participantCount = entries.length;
        const leaderboardUrl = 'https://pogostuckleaderboards.vercel.app/';
        const mapUrl = `${leaderboardUrl}${currentFeatured.steamID}`;

        // Build the recap message
        let podiumContent;
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
            `## Map of the Week Recap: [${currentFeatured.mapName}](<${mapUrl}>)`,
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
        const motwNumber = getMotwNumber();
        const currentMotwSubmissions = current
            ? await MotwSubmission.findOne({ steamID: current.steamID })
            : null;
        const motwEntries = Array.isArray(currentMotwSubmissions?.entries)
            ? currentMotwSubmissions.entries
            : [];

        if (current) {
            const entries = [...motwEntries].sort((a, b) => a.time - b.time)

            for (let i = 0; i < entries.length; i++) {
                const user = await User.findOne({ discordID: entries[i].discordID });

                if (user) {
                    if (!user.mapOfTheWeekParticipations) user.mapOfTheWeekParticipations = [];
                    user.mapOfTheWeekParticipations.push({
                        placement: i,
                        motwNumber: motwNumber-1 // the old motwNumber
                    });
                    user.save()
                }
            }
            await sendMotwRecapMessage(current, motwEntries);
        }

        await MotwSubmission.deleteMany({});
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

    await MotwSubmission.create({
        mapName: selectedMap.mapName,
        steamID: selectedMap.steamID,
        creator: selectedMap.creator,
        entries: []
    });

    try {
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
