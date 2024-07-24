const Leaderboard = require('../models/LeaderboardModel');
const User = require('../models/userModel');

const newFeaturedLeaderboard = async () => {
    try{
        const current = await Leaderboard.findOneAndUpdate({ featured: true }, {featured: false});
        
        const entries = current.entries.sort((a, b) => a.time - b.time)

        for (let i = 0; i < entries.length; i++) {
            const user = await User.findOne({ discordID: entries[i].discordID });

            if (user) {
                user.points = Math.floor(100 / ((0.4 * i) + 1)) + user.points;
                user.save()
            }
        }
    } catch (err) {
        console.log(err);
    }

    const response = await Leaderboard.aggregate([{ $sample: { size: 1 } }]);
    console.log(response[0].mapName)
    await Leaderboard.findOneAndUpdate({ _id: response[0]._id }, {featured: true});
}

module.exports = newFeaturedLeaderboard;