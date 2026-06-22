
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        // =====================
        // BASIC INFO
        // =====================

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // =====================
        // AUTH
        // =====================

        passwordHash: {
            type: String,
            select: false,
            default: null,
        },

        authProvider: {
            type: String,
            enum: ["credentials", "google"],
            default: "credentials",
            required: true,
        },

        googleId: {
            type: String,
            sparse: true,
            unique: true,
            default: null,
        },

        role: {
            type: String,
            enum: ["subscriber", "admin"],
            default: "subscriber",
            required: true,
        },

        // =====================
        // ACCOUNT STATUS
        // =====================

        accountStatus: {
            type: String,
            enum: ["active", "suspended", "deleted"],
            default: "active",
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        // =====================
        // EMAIL VERIFICATION
        // =====================

        emailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
            default: null,
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
        },

        // =====================
        // FORGOT PASSWORD
        // =====================

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },

        // =====================
        // SUBSCRIPTION
        // =====================

        subscription: {
            status: {
                type: String,
                enum: ["inactive", "active", "lapsed", "cancelled"],
                default: "inactive",
            },

            plan: {
                type: String,
                enum: ["monthly", "yearly"],
                default: null,
            },

            startedAt: {
                type: Date,
                default: null,
            },

            renewsAt: {
                type: Date,
                default: null,
            },

            stripeCustomerId: {
                type: String,
                default: null,
            },

            stripeSubscriptionId: {
                type: String,
                default: null,
            },
        },

        // =====================
        // CHARITY
        // =====================

        charity: {
            selectedCharityId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Charity",
                default: null,
            },

            contributionPercent: {
                type: Number,
                min: 10,
                max: 100,
                default: 10,
            },
        },

        // =====================
        // DASHBOARD STATS
        // =====================

        totalWins: {
            type: Number,
            default: 0,
        },

        totalPrizeWon: {
            type: Number,
            default: 0,
        },

        totalDonated: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

module.exports = mongoose.model("User", UserSchema);
