const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["teacher", "student"],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Number,
        default: Date.now,
    },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
