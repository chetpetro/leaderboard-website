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
    difficultyBonus: {
        type: Number,
        default: 0
    },
    entries: [{
        userName: {
            type: String,
            required: true
        },
        discordID: {
            type: String,
            required: true,
            index: true,
            unique: true
        },
        time: {
            type: Number,
            required: true
        },
        submittedAt: {
            type: Date,
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);

