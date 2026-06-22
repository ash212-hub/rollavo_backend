const express = require("express");

const router = express.Router();
const { createCharity, getAllCharities, getCharity, updateCharity, deleteCharity, selectCharity } = require("../controllers/charity.controller")
const { protect, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", getAllCharities);

router.get("/:id", getCharity);

// Admin Only
router.post(
    "/",
    protect,
    requireAdmin,
    createCharity
);

router.put(
    "/:id",
    protect,
    requireAdmin,
    updateCharity
);

router.delete(
    "/:id",
    protect,
    requireAdmin,
    deleteCharity
);

// Logged-in users
router.post(
    "/select",
    protect,
    selectCharity
);

module.exports = router;