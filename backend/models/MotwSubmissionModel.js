const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const motwSubmissionSchema = new Schema({
    mapName: {
        type: String,
        required: true,
    },
    steamID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    creator: {
        type: String,
        required: true
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
            type: Date,
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('MotwSubmission', motwSubmissionSchema);
