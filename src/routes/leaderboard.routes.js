const express = require("express");
const {
  getLeaderboard,
  getUserRank,
  updateUserPoints,
  recalculateRankings,
  syncAllUsers,
  getLeaderboardStats,
} = require("../controllers/leaderboard.controller");

const router = express.Router();

// Public routes (no authentication required for now)
router.get("/", getLeaderboard);
router.get("/stats", getLeaderboardStats);
router.get("/user/:userId", getUserRank);
router.put("/user/:userId/points", updateUserPoints);
router.put("/recalculate", recalculateRankings);
router.post("/sync", syncAllUsers);

module.exports = router;
