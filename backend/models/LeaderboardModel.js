const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
    mapName: {
        type: String,
        required: true,
        unique: true
    },
    creator: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    entries: [{
        userName: {
            type: String,
            required: true
        },
        discordID: {
            type: Number,
            required: true
        },
        time: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);

