const asyncHandler = require("express-async-handler");
const Activity = require("../models/activity.model");
const User = require("../models/user.model");
const Leaderboard = require("../models/leaderboard.model");
const QRCode = require("../models/qrcode.model");

// @desc    Scan QR Code (integrated with your QR system)
// @route   POST /api/v1/activities/qr-scan
// @access  Private
const scanQRCode = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({
      success: false,
      error: "QR code is required",
    });
  }

  // Find the QR code in your system
  const qrCodeDoc = await QRCode.findOne({ qrCode })
    .populate("rewardId")
    .populate("partnerId");

  if (!qrCodeDoc) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  // Validate QR code
  const validationResult = await qrCodeDoc.isValidForScanning();
  if (!validationResult.valid) {
    return res.status(400).json({
      success: false,
      error: validationResult.reason,
    });
  }

  // Record the scan in your QR system
  await qrCodeDoc.recordScan(req.user.id);

  // Create activity record for the scan
  const scanActivity = await Activity.create({
    userId: req.user.id,
    activityType: "qr_scan",
    title: `Scanned: ${qrCodeDoc.rewardId.title}`,
    description: `Scanned QR code at ${qrCodeDoc.partnerId.name}`,
    pointsEarned: qrCodeDoc.rewardId.points, // Use points from reward
    qrCodeId: qrCodeDoc._id,
    rewardId: qrCodeDoc.rewardId._id,
    partnerId: qrCodeDoc.partnerId._id,
    location: qrCodeDoc.location?.name,
  });

  // Update user points
  const user = await User.findById(req.user.id);
  user.points += qrCodeDoc.rewardId.points;
  user.updateEcoLevel();
  await user.save();

  // Update leaderboard
  try {
    await Leaderboard.syncUserPoints(req.user.id, user.points);
    await Leaderboard.updateAllRankings();
  } catch (error) {
    console.error("Leaderboard update error:", error);
  }

  res.status(201).json({
    success: true,
    message: `QR code scanned successfully! You earned ${qrCodeDoc.rewardId.points} points.`,
    data: {
      activity: scanActivity,
      qrCode: qrCodeDoc,
      reward: qrCodeDoc.rewardId,
      partner: qrCodeDoc.partnerId,
      pointsEarned: qrCodeDoc.rewardId.points,
      newTotalPoints: user.points,
      newEcoLevel: user.ecoLevel,
    },
  });
});

// @desc    Create manual activity (non-QR activities)
// @route   POST /api/v1/activities
// @access  Private
const createActivity = asyncHandler(async (req, res) => {
  const { activityType, title, description, location, metadata } = req.body;

  if (!activityType || !title) {
    return res.status(400).json({
      success: false,
      error: "Activity type and title are required",
    });
  }

  // Don't allow QR/reward activities through this endpoint
  if (["qr_scan", "reward_claim"].includes(activityType)) {
    return res.status(400).json({
      success: false,
      error: "Use QR scan endpoint for QR-related activities",
    });
  }

  // Get points for this activity type
  const pointsMapping = Activity.getPointsMapping();
  const pointsEarned = pointsMapping[activityType] || 0;

  // Create activity
  const activity = await Activity.create({
    userId: req.user.id,
    activityType,
    title,
    description,
    pointsEarned,
    location,
    metadata,
  });

  // Update user points
  const user = await User.findById(req.user.id);
  user.points += pointsEarned;
  user.updateEcoLevel();
  await user.save();

  // Update leaderboard
  try {
    await Leaderboard.syncUserPoints(req.user.id, user.points);
    await Leaderboard.updateAllRankings();
  } catch (error) {
    console.error("Leaderboard update error:", error);
  }

  res.status(201).json({
    success: true,
    message: `Activity completed! You earned ${pointsEarned} points.`,
    data: {
      activity,
      pointsEarned,
      newTotalPoints: user.points,
      newEcoLevel: user.ecoLevel,
    },
  });
});

// @desc    Get recent activities for current user
// @route   GET /api/v1/activities/recent
// @access  Private
const getRecentActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;

  const activities = await Activity.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("rewardId", "title")
    .populate("partnerId", "name");

  // Format for frontend (matching your current structure)
  const formattedActivities = activities.map((activity) => ({
    activity: activity.title,
    points: activity.pointsEarned,
    time: activity.createdAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    date: formatDate(activity.createdAt),
    activityType: activity.activityType,
    description: activity.description,
    partner: activity.partnerId?.name,
  }));

  res.status(200).json({
    success: true,
    data: formattedActivities,
  });
});

// Helper function to format date
const formatDate = (date) => {
  const now = new Date();
  const activityDate = new Date(date);

  const diffTime = Math.abs(now - activityDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Today";
  if (diffDays === 2) return "Yesterday";

  return activityDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// @desc    Get user's activities
// @route   GET /api/v1/activities/user/:userId
// @access  Private
const getUserActivities = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Check if user is requesting their own activities or if they're admin
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view these activities",
    });
  }

  const activities = await Activity.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name email")
    .populate("rewardId", "title")
    .populate("partnerId", "name");

  const total = await Activity.countDocuments({ userId });

  res.status(200).json({
    success: true,
    count: activities.length,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
    data: activities,
  });
});

// @desc    Get activity statistics
// @route   GET /api/v1/activities/stats
// @access  Private
const getActivityStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await Activity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$activityType",
        count: { $sum: 1 },
        totalPoints: { $sum: "$pointsEarned" },
      },
    },
  ]);

  const totalActivities = await Activity.countDocuments({ userId });
  const totalPoints = await Activity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$pointsEarned" } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalActivities,
      totalPointsFromActivities: totalPoints[0]?.total || 0,
      activityBreakdown: stats,
    },
  });
});

module.exports = {
  createActivity,
  scanQRCode,
  getRecentActivities,
  getUserActivities,
  getActivityStats,
};
