const express = require("express");
const {
  claimReward,
  getUserClaimHistory,
  getUserPointsSummary,
  getAllClaims,
  reverseClaim,
  getLeaderboard,
} = require("../controllers/claim.controller");

// Import middleware
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/leaderboard", getLeaderboard);

// Protected routes (Authenticated users only)
router.post("/reward", protect, claimReward);
router.get("/history", protect, getUserClaimHistory);
router.get("/points-summary", protect, getUserPointsSummary);

// Admin only routes
router.get("/all", protect, authorize("admin"), getAllClaims);
router.put("/:id/reverse", protect, authorize("admin"), reverseClaim);

module.exports = router;
