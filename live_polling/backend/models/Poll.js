const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
    },
    results: {
        type: [Number],
        default: [],
    },
    votedStudents: {
        type: [String],
        default: [],
    },
    expiresAt: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Poll", pollSchema);
