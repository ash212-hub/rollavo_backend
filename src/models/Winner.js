// models/Winner.js
import mongoose from 'mongoose';

const winnerSchema = new mongoose.Schema({
    // References
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    drawId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Draw',
        required: true,
        index: true
    },
    // Winner details
    tier: {
        type: String,
        enum: ['5-match', '4-match', '3-match'],
        required: true
    },
    prizeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    matchDetails: {
        userNumbers: [Number],
        winningNumbers: [Number],
        matchedNumbers: [Number],
        matchCount: Number
    },
    // Verification
    verification: {
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'approved', 'rejected'],
            default: 'pending'
        },
        proofImage: {
            type: String, // URL to uploaded image
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
                },
                message: 'Invalid proof image URL'
            }
        },
        proofUploadedAt: Date,
        notes: {
            type: String,
            maxlength: 1000
        },
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        rejectionReason: {
            type: String,
            maxlength: 500
        }
    },
    // Payment
    payment: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        amount: {
            type: Number,
            min: 0
        },
        method: {
            type: String,
            enum: ['stripe', 'bank_transfer', 'paypal', 'manual']
        },
        transactionId: String,
        completedAt: Date,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    },
    // Notifications
    notifications: {
        winner: {
            sent: { type: Boolean, default: false },
            sentAt: Date
        },
        verification: {
            sent: { type: Boolean, default: false },
            sentAt: Date
        },
        payment: {
            sent: { type: Boolean, default: false },
            sentAt: Date
        }
    },
    // Additional info
    rank: {
        type: Number,
        min: 1
    },
    charityContribution: {
        amount: Number,
        charityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Charity'
        },
        contributedAt: Date
    }
}, {
    timestamps: true
});

// Compound index for unique winner per draw/tier/user
winnerSchema.index({ userId: 1, drawId: 1, tier: 1 }, { unique: true });

// Index for querying winners by status
winnerSchema.index({ 'verification.status': 1, 'payment.status': 1 });

// Virtual for full name (populated)
winnerSchema.virtual('userName').get(function () {
    return this.user?.name || 'Unknown User';
});

// Virtual for display tier name
winnerSchema.virtual('tierDisplay').get(function () {
    const tierNames = {
        '5-match': '🎯 Jackpot (5-Match)',
        '4-match': '🏆 Second Tier (4-Match)',
        '3-match': '🥉 Third Tier (3-Match)'
    };
    return tierNames[this.tier] || this.tier;
});

// Virtual for status display
winnerSchema.virtual('statusDisplay').get(function () {
    const statusMap = {
        'pending': '⏳ Pending Verification',
        'reviewing': '🔍 Under Review',
        'approved': '✅ Approved',
        'rejected': '❌ Rejected'
    };
    const paymentStatus = {
        'pending': '💳 Payment Pending',
        'processing': '🔄 Processing',
        'completed': '✅ Paid',
        'failed': '❌ Failed'
    };

    if (this.verification.status === 'approved') {
        return paymentStatus[this.payment.status] || 'Pending Payment';
    }
    return statusMap[this.verification.status] || 'Unknown';
});

// Get total prize won by user
winnerSchema.statics.getTotalWonByUser = async function (userId) {
    const result = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                total: { $sum: '$prizeAmount' },
                count: { $sum: 1 }
            }
        }
    ]);
    return result[0] || { total: 0, count: 0 };
};

// Get winners for a specific draw
winnerSchema.statics.getDrawWinners = async function (drawId) {
    return this.find({ drawId })
        .populate('userId', 'name email')
        .sort({ tier: 1, 'prizeAmount': -1 });
};

// Get pending verifications
winnerSchema.statics.getPendingVerifications = async function () {
    return this.find({
        'verification.status': { $in: ['pending', 'reviewing'] }
    }).populate('userId', 'name email');
};

// Update verification status
winnerSchema.methods.updateVerification = async function (status, reviewerId, notes = '') {
    this.verification.status = status;
    this.verification.reviewerId = reviewerId;
    this.verification.reviewedAt = new Date();
    if (notes) this.verification.notes = notes;
    return this.save();
};

// Update payment status
winnerSchema.methods.updatePayment = async function (status, processedBy, transactionId = '') {
    this.payment.status = status;
    if (status === 'completed') {
        this.payment.completedAt = new Date();
    }
    this.payment.processedBy = processedBy;
    if (transactionId) this.payment.transactionId = transactionId;
    return this.save();
};

// Mark winner notification as sent
winnerSchema.methods.markWinnerNotified = async function () {
    this.notifications.winner.sent = true;
    this.notifications.winner.sentAt = new Date();
    return this.save();
};

export default mongoose.model('Winner', winnerSchema);