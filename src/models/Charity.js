const mongoose = require("mongoose");

const CharitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        description: {
            type: String,
            required: true,
        },

        logo: {
            type: String,
            default: null,
        },

        website: {
            type: String,
            default: null,
        },

        featured: {
            type: Boolean,
            default: false,
        },

        active: {
            type: Boolean,
            default: true,
        },

        totalDonations: {
            type: Number,
            default: 0,
        },

        totalSubscribers: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Charity",
    CharitySchema
);