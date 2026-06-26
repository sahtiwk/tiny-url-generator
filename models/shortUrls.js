const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const shortUrlSchema= new mongoose.Schema({
    full: {
        type: String,
        required: true,
        match: [/^https?:\/\/.+/, 'Invalid URL']
    },
    short: {
        type: String,
        required: true,
        default: () => nanoid(8),
        unique: true,
        index: true
    },
    clicks: {
        type: Number,
        default: 0,
        required: true
    }
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);