const Charity = require("../models/Charity");

async function createCharity(req, res) {
    try {
        const {
            name,
            slug,
            description,
            logo,
            website,
        } = req.body;

        const existing = await Charity.findOne({
            slug,
        });

        if (existing) {
            return res.status(409).json({
                error: "Charity already exists",
            });
        }

        const charity = await Charity.create({
            name,
            slug,
            description,
            logo,
            website,
        });

        res.status(201).json(charity);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Server error",
        });
    }
}


async function getAllCharities(req, res) {
    try {
        const charities = await Charity.find({
            active: true,
        }).sort({
            featured: -1,
            createdAt: -1,
        });

        res.json(charities);
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}

async function getCharity(req, res) {
    try {
        const charity = await Charity.findById(
            req.params.id
        );

        if (!charity) {
            return res.status(404).json({
                error: "Charity not found",
            });
        }

        res.json(charity);
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}

async function updateCharity(req, res) {
    try {
        const charity =
            await Charity.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

        res.json(charity);
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}

async function deleteCharity(req, res) {
    try {
        await Charity.findByIdAndUpdate(
            req.params.id,
            {
                active: false,
            }
        );

        res.json({
            message: "Charity archived",
        });
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}


async function selectCharity(req, res) {
    try {
        const {
            charityId,
            contributionPercent,
        } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                charity: {
                    selectedCharityId: charityId,
                    contributionPercent:
                        contributionPercent || 10,
                },
            },
            {
                new: true,
            }
        );

        res.json({
            message:
                "Charity selected successfully",
            charity: user.charity,
        });
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}


module.exports = { createCharity, getAllCharities, getCharity, updateCharity, deleteCharity, deleteCharity, selectCharity }