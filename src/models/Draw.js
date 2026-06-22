// models/Draw.js
import mongoose from 'mongoose';

const drawSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true,
        enum: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
    },
    year: {
        type: Number,
        required: true,
        min: 2024,
        max: 2100
    },
    monthIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 11
    },
    // Draw configuration
    config: {
        type: {
            type: String,
            enum: ['random', 'algorithmic'],
            default: 'random'
        },
        algorithmWeight: {
            type: String,
            enum: ['most_frequent', 'least_frequent', 'balanced'],
            default: 'balanced'
        },
        numberOfNumbers: {
            type: Number,
            default: 5,
            min: 1,
            max: 10
        },
        scoreRange: {
            min: { type: Number, default: 1 },
            max: { type: Number, default: 45 }
        }
    },
    // Winning numbers
    winningNumbers: {
        type: [Number],
        validate: {
            validator: function (v) {
                return v.length === this.config?.numberOfNumbers || v.length === 5;
            },
            message: 'Must have exactly 5 winning numbers'
        }
    },
    // Prize pool
    prizePool: {
        total: {
            type: Number,
            required: true,
            min: 0
        },
        distribution: {
            '5-match': {
                share: { type: Number, default: 0.40 },
                amount: Number,
                winners: [{
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    prizeAmount: Number,
                    verified: { type: Boolean, default: false },
                    verifiedAt: Date,
                    paid: { type: Boolean, default: false },
                    paidAt: Date
                }],
                winnerCount: { type: Number, default: 0 },
                prizePerWinner: Number,
                rollover: { type: Boolean, default: true }
            },
            '4-match': {
                share: { type: Number, default: 0.35 },
                amount: Number,
                winners: [{
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    prizeAmount: Number,
                    verified: { type: Boolean, default: false },
                    verifiedAt: Date,
                    paid: { type: Boolean, default: false },
                    paidAt: Date
                }],
                winnerCount: { type: Number, default: 0 },
                prizePerWinner: Number,
                rollover: { type: Boolean, default: false }
            },
            '3-match': {
                share: { type: Number, default: 0.25 },
                amount: Number,
                winners: [{
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    prizeAmount: Number,
                    verified: { type: Boolean, default: false },
                    verifiedAt: Date,
                    paid: { type: Boolean, default: false },
                    paidAt: Date
                }],
                winnerCount: { type: Number, default: 0 },
                prizePerWinner: Number,
                rollover: { type: Boolean, default: false }
            }
        },
        rolloverAmount: {
            type: Number,
            default: 0
        }
    },
    // Participants
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        scores: [Number],
        matchedNumbers: {
            '5-match': { type: [Number], default: [] },
            '4-match': { type: [Number], default: [] },
            '3-match': { type: [Number], default: [] }
        },
        matchCount: {
            type: Number,
            default: 0
        }
    }],
    participantCount: {
        type: Number,
        default: 0
    },
    // Status
    status: {
        type: String,
        enum: ['draft', 'simulated', 'executed', 'published', 'closed'],
        default: 'draft'
    },
    // Timestamps
    executedAt: Date,
    publishedAt: Date,
    closedAt: Date,
    // Metadata
    metadata: {
        executedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        publishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        simulationCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Ensure unique draw per month/year
drawSchema.index({ monthIndex: 1, year: 1 }, { unique: true });

// Virtual for month display name
drawSchema.virtual('monthDisplay').get(function () {
    return `${this.month} ${this.year}`;
});

// Get total prize pool
drawSchema.methods.getTotalPrizePool = function () {
    let total = 0;
    for (const tier of ['5-match', '4-match', '3-match']) {
        total += this.prizePool.distribution[tier]?.amount || 0;
    }
    return total;
};

// Get total winners across all tiers
drawSchema.methods.getTotalWinners = function () {
    let total = 0;
    for (const tier of ['5-match', '4-match', '3-match']) {
        total += this.prizePool.distribution[tier]?.winners?.length || 0;
    }
    return total;
};

// Check if user is winner
drawSchema.methods.isUserWinner = function (userId) {
    for (const tier of ['5-match', '4-match', '3-match']) {
        const winners = this.prizePool.distribution[tier]?.winners || [];
        if (winners.some(w => w.userId.toString() === userId.toString())) {
            return true;
        }
    }
    return false;
};

// Get user's winnings
drawSchema.methods.getUserWinnings = function (userId) {
    const results = [];
    for (const tier of ['5-match', '4-match', '3-match']) {
        const winners = this.prizePool.distribution[tier]?.winners || [];
        const winner = winners.find(w => w.userId.toString() === userId.toString());
        if (winner) {
            results.push({
                tier,
                prizeAmount: winner.prizeAmount,
                verified: winner.verified,
                paid: winner.paid
            });
        }
    }
    return results;
};

export default mongoose.model('Draw', drawSchema);