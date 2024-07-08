const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
    mapName: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    entries: [{
        userName: {
            type: String,
            required: true
        },
        time: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);

