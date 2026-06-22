// models/Score.js
import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    points: {
        type: Number,
        required: true,
        min: 1,
        max: 45,
        validate: {
            validator: function (v) {
                return Number.isInteger(v) && v >= 1 && v <= 45;
            },
            message: 'Score must be between 1 and 45 (Stableford format)'
        }
    },
    date: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v <= new Date();
            },
            message: 'Score date cannot be in the future'
        }
    },
    course: {
        type: String,
        trim: true,
        maxlength: 100
    },
    roundNumber: {
        type: Number,
        default: 1,
        min: 1
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date
}, {
    timestamps: true
});

// Ensure one score per date per user
scoreSchema.index({ userId: 1, date: 1 }, { unique: true });

// Get user's latest 5 scores
scoreSchema.statics.getLatestScores = async function (userId, limit = 5) {
    return this.find({ userId })
        .sort({ date: -1 })
        .limit(limit)
        .lean();
};

// Get user's scores for a specific month
scoreSchema.statics.getMonthScores = async function (userId, month, year) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return this.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
};

// Check if user has at least 5 scores for eligibility
scoreSchema.statics.hasMinimumScores = async function (userId, count = 5) {
    const scores = await this.getLatestScores(userId, count);
    return scores.length >= count;
};

// Get user's score numbers for draw (latest 5)
scoreSchema.statics.getDrawNumbers = async function (userId) {
    const scores = await this.getLatestScores(userId, 5);
    return scores.map(s => s.points);
};

// Virtual field for formatted date
scoreSchema.virtual('formattedDate').get(function () {
    return this.date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
});

// Virtual field for month/year
scoreSchema.virtual('monthYear').get(function () {
    return `${this.date.toLocaleString('default', { month: 'long' })} ${this.date.getFullYear()}`;
});

export default mongoose.model('Score', scoreSchema);