const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customLeaderboardSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    mapName: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    previewImage: {
        type: String
    },
    difficultyBonus: {
        type: Number,
        default: 0
    },
    isCustomLeaderboard: {
        type: Boolean,
        default: true
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
            required: true,
            index: true
        },
        time: {
            type: Number,
            required: true
        },
        submittedAt: {
            type: Date
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("CustomLeaderboard", customLeaderboardSchema);
