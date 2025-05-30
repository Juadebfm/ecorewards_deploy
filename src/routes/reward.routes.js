const express = require("express");
const {
  createReward,
  getAllRewards,
  getAvailableRewards,
  getRewardsByPartner,
  getReward,
  updateReward,
  deleteReward,
  toggleRewardStatus,
  getRewardStats,
} = require("../controllers/reward.controller");

// Import middleware
const {
  protect,
  authorize,
  optionalAuth,
} = require("../middleware/auth.middleware");

const router = express.Router();

// PUBLIC ROUTES FIRST
router.get("/available", getAvailableRewards);
router.get("/partner/:partnerId", getRewardsByPartner);

// PROTECTED ROUTES (Admin only) - SPECIFIC ROUTES BEFORE GENERIC ONES
router.post("/", protect, authorize("admin"), createReward);
router.get("/", protect, authorize("admin"), getAllRewards);

// SPECIFIC ROUTES WITH PARAMETERS - MUST COME BEFORE GENERIC /:id
router.get("/:id/stats", protect, authorize("admin"), getRewardStats);
router.put(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  toggleRewardStatus
);

// CRUD OPERATIONS - SPECIFIC BEFORE GENERIC
router.put("/:id", protect, authorize("admin"), updateReward);
router.delete("/:id", protect, authorize("admin"), deleteReward);

// GENERIC ROUTE LAST - this catches any remaining /:id patterns
router.get("/:id", optionalAuth, getReward);

module.exports = router;
