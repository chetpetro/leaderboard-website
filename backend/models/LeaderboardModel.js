const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
    mapName: {
        type: String,
        required: true,
    },
    steamID: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    description: {
        type: String
    },
    previewImage: {
        type: String
    },
    colour : {
        type: Object
    },
    lastSubmissionAt: {
        type: Date,
        default: null,
        index: true
    },
    entries: [{
        userName: {
            type: String,
            required: true
        },
        discordID: {
            type: String,
            required: true
        },
        time: {
            type: Number,
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);

