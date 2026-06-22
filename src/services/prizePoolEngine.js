// services/prizePoolEngine.js
// import { User, Score, Draw, Winner, Charity } from '../models';
const User = require("../models/User")
const Score = require("../models/Score")
const Draw = require("../models/Draw")
const Winner = require("../models/Winner")
const Charity = require("../models/Charity")
const { sendWinnerNotification } = require("../utils/sendEmail");

class PrizePoolEngine {
    constructor() {
        this.prizeTiers = {
            '5-match': { share: 0.40, rollover: true, label: 'Jackpot' },
            '4-match': { share: 0.35, rollover: false, label: 'Second Tier' },
            '3-match': { share: 0.25, rollover: false, label: 'Third Tier' }
        };
    }

    /**
     * Main draw execution method
     */
    async executeMonthlyDraw(month, year) {
        try {
            // 1. Calculate total prize pool
            const prizePool = await this.calculatePrizePool();

            // 2. Get all eligible participants
            const participants = await this.getEligibleParticipants();

            // 3. Generate winning numbers
            const winningNumbers = this.generateWinningNumbers();

            // 4. Match participants against winning numbers
            const results = this.matchParticipants(participants, winningNumbers);

            // 5. Calculate prizes
            const prizeDistribution = this.calculatePrizes(results, prizePool);

            // 6. Save draw results
            const draw = await this.saveDrawResults({
                month,
                year,
                winningNumbers,
                prizePool,
                distribution: prizeDistribution,
                participants: participants.length
            });

            // 7. Notify winners
            await this.notifyWinners(prizeDistribution.winners);

            return draw;
        } catch (error) {
            console.error('Draw execution failed:', error);
            throw error;
        }
    }

    /**
     * Calculate total prize pool from active subscriptions
     */
    async calculatePrizePool() {
        const activeSubscriptions = await User.find({
            'subscription.status': 'active',
            'subscription.plan': { $in: ['monthly', 'yearly'] }
        });

        // Calculate pool based on subscription contributions
        let totalPool = 0;
        for (const user of activeSubscriptions) {
            const monthlyFee = user.subscription.plan === 'yearly'
                ? user.subscription.amount / 12
                : user.subscription.amount;

            // 50% of subscription goes to prize pool (per PRD)
            totalPool += monthlyFee * 0.5;
        }

        // Add any rollover from previous month
        const rollover = await this.getRolloverAmount();
        totalPool += rollover;

        return Math.round(totalPool * 100) / 100;
    }

    /**
     * Get eligible participants (active subscribers with 5 scores)
     */
    async getEligibleParticipants() {
        const users = await User.find({
            'subscription.status': 'active'
        }).populate('scores');

        const eligible = [];
        for (const user of users) {
            // Check if user has at least 5 scores
            const scoreCount = await Score.countDocuments({
                userId: user._id,
                date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
            });

            if (scoreCount >= 5) {
                eligible.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    scores: await this.getUserScores(user._id)
                });
            }
        }

        return eligible;
    }

    /**
     * Get user's latest 5 scores
     */
    async getUserScores(userId) {
        const scores = await Score.find({ userId })
            .sort({ date: -1 })
            .limit(5)
            .select('points date');

        return scores.map(s => s.points);
    }

    /**
     * Generate winning numbers
     */
    generateWinningNumbers() {
        // Generate 5 random numbers between 1-45 (Stableford range)
        const numbers = [];
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers.sort((a, b) => a - b);
    }

    /**
     * Match participants against winning numbers
     */
    matchParticipants(participants, winningNumbers) {
        const results = {
            '5-match': [],
            '4-match': [],
            '3-match': []
        };

        for (const participant of participants) {
            const matchCount = this.countMatches(participant.scores, winningNumbers);

            if (matchCount === 5) {
                results['5-match'].push(participant);
            } else if (matchCount === 4) {
                results['4-match'].push(participant);
            } else if (matchCount === 3) {
                results['3-match'].push(participant);
            }
        }

        return results;
    }

    /**
     * Count matching numbers
     */
    countMatches(userScores, winningNumbers) {
        const userNumbers = userScores.slice(0, 5);
        let matches = 0;
        for (const num of userNumbers) {
            if (winningNumbers.includes(num)) {
                matches++;
            }
        }
        return matches;
    }

    /**
     * Calculate prize distribution
     */
    calculatePrizes(results, prizePool) {
        const distribution = {
            totalWinners: 0,
            totalPrizePool: prizePool,
            tiers: {}
        };

        let remainingPool = prizePool;
        let rolloverAmount = 0;

        for (const [tier, data] of Object.entries(this.prizeTiers)) {
            const tierResults = results[tier];
            const tierShare = data.share;

            // Calculate tier prize amount
            let tierPrize = remainingPool * tierShare;

            // Handle rollover for 5-match
            if (data.rollover && tierResults.length === 0) {
                rolloverAmount += tierPrize;
                tierPrize = 0;
            }

            // Distribute prize among winners
            const winners = tierResults.map(participant => ({
                ...participant,
                prizeAmount: tierResults.length > 0
                    ? Math.round((tierPrize / tierResults.length) * 100) / 100
                    : 0
            }));

            distribution.tiers[tier] = {
                winners,
                prizePerWinner: tierResults.length > 0
                    ? Math.round((tierPrize / tierResults.length) * 100) / 100
                    : 0,
                totalPrize: tierPrize,
                winnerCount: tierResults.length
            };

            distribution.totalWinners += tierResults.length;
            remainingPool -= tierPrize;
        }

        // Add rollover to distribution
        distribution.rollover = rolloverAmount;

        return distribution;
    }

    /**
     * Save draw results to database
     */
    async saveDrawResults(data) {
        const draw = new Draw({
            month: data.month,
            year: data.year,
            winningNumbers: data.winningNumbers,
            prizePool: data.prizePool,
            participants: data.participants,
            distribution: data.distribution,
            status: 'completed',
            executedAt: new Date()
        });

        await draw.save();

        // Create winner records
        for (const [tier, tierData] of Object.entries(data.distribution.tiers)) {
            for (const winner of tierData.winners) {
                const winnerRecord = new Winner({
                    userId: winner.userId,
                    drawId: draw._id,
                    tier: tier,
                    prizeAmount: winner.prizeAmount,
                    status: 'pending_verification',
                    notificationSent: false,
                    createdAt: new Date()
                });
                await winnerRecord.save();
            }
        }

        return draw;
    }

    /**
     * Notify winners
     */
    async notifyWinners(winners) {
        for (const winner of winners) {
            await sendWinnerNotification(winner);
        }
    }

    /**
     * Get rollover amount from previous draw
     */
    async getRolloverAmount() {
        const lastDraw = await Draw.findOne({
            status: 'completed'
        }).sort({ executedAt: -1 });

        if (lastDraw && lastDraw.distribution.rollover) {
            return lastDraw.distribution.rollover;
        }
        return 0;
    }
}

export default new PrizePoolEngine();