require('dotenv').config({ path: __dirname + '/.env'})
const URI = process.env.MONGODB_URI;
const mongoose = require('mongoose');


mongoose.connect(URI)
    .then(() => {
        ball();
    })
    .catch((err) => {
        console.log('Cannot connect to db: ' + err);
    });

const Leaderboard = require('./models/LeaderboardModel');
const id = "333677894838648853"

const ball = async () => {
    const leaderboards = await Leaderboard.find({entries: {$elemMatch: {discordID: id}}})
    console.log(leaderboards)
}
