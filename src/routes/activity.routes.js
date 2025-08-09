const express = require("express");
const {
  createActivity,
  getUserActivities,
  getRecentActivities,
  scanQRCode,
  getActivityStats,
} = require("../controllers/activity.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/v1/activities
router.post("/", createActivity);

// @route   GET /api/v1/activities/recent
router.get("/recent", getRecentActivities);

// @route   POST /api/v1/activities/qr-scan
router.post("/qr-scan", scanQRCode);

// @route   GET /api/v1/activities/stats
router.get("/stats", getActivityStats);

// @route   GET /api/v1/activities/user/:userId
router.get("/user/:userId", getUserActivities);

module.exports = router;
