const Leaderboard = require("../models/leaderboard.model");
const User = require("../models/user.model");
const asyncHandler = require("express-async-handler");

// @desc    Get leaderboard
// @route   GET /api/v1/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    // Get leaderboard entries with user details
    const leaderboard = await Leaderboard.find({})
      .populate({
        path: "userId",
        select: "name email ecoLevel",
      })
      .sort({ totalPoints: -1, createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Format response to match frontend expectations
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: skip + index + 1,
      username: entry.userId?.name || "Unknown User",
      email: entry.userId?.email,
      points: entry.totalPoints,
      ecoLevel: entry.userId?.ecoLevel || "beginner",
      movement: entry.rankMovement,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        entry.userId?.name || entry._id
      }`,
    }));

    const total = await Leaderboard.countDocuments();

    res.status(200).json({
      success: true,
      count: formattedLeaderboard.length,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
      data: formattedLeaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
});

// @desc    Get user's leaderboard position
// @route   GET /api/v1/leaderboard/user/:userId
// @access  Public (for now)
exports.getUserRank = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const userEntry = await Leaderboard.findOne({ userId }).populate({
      path: "userId",
      select: "name email ecoLevel",
    });

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: "User not found in leaderboard",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        rank: userEntry.currentRank,
        username: userEntry.userId.name,
        points: userEntry.totalPoints,
        movement: userEntry.rankMovement,
        ecoLevel: userEntry.userId.ecoLevel,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user rank",
      error: error.message,
    });
  }
});

// @desc    Update user points
// @route   PUT /api/v1/leaderboard/user/:userId/points
// @access  Public (for now - should be protected later)
exports.updateUserPoints = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { points, activityType, description } = req.body;

  try {
    // Validate input
    if (!points || typeof points !== "number") {
      return res.status(400).json({
        success: false,
        message: "Points must be a valid number",
      });
    }

    // First update user model
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points: points } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's eco level
    user.updateEcoLevel();
    await user.save();

    // Sync with leaderboard
    const leaderboardEntry = await Leaderboard.syncUserPoints(
      userId,
      user.points
    );

    // Add activity to recent activities if provided
    if (activityType && leaderboardEntry) {
      leaderboardEntry.recentActivities.unshift({
        activityType,
        pointsEarned: points,
        description:
          description || `Earned ${points} points for ${activityType}`,
      });

      // Keep only last 10 activities
      if (leaderboardEntry.recentActivities.length > 10) {
        leaderboardEntry.recentActivities =
          leaderboardEntry.recentActivities.slice(0, 10);
      }

      await leaderboardEntry.save();
    }

    // Update all rankings
    await Leaderboard.updateAllRankings();

    res.status(200).json({
      success: true,
      message: "Points updated successfully",
      data: {
        userId: user._id,
        username: user.name,
        newPoints: user.points,
        pointsAdded: points,
        ecoLevel: user.ecoLevel,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user points",
      error: error.message,
    });
  }
});

// @desc    Recalculate all rankings
// @route   PUT /api/v1/leaderboard/recalculate
// @access  Public (for now - should be admin only later)
exports.recalculateRankings = asyncHandler(async (req, res) => {
  try {
    const result = await Leaderboard.updateAllRankings();

    res.status(200).json({
      success: true,
      message: "Rankings recalculated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recalculating rankings",
      error: error.message,
    });
  }
});

// @desc    Sync all users to leaderboard
// @route   POST /api/v1/leaderboard/sync
// @access  Public (for now - should be admin only later)
exports.syncAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).select("_id points name");

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found to sync",
      });
    }

    const syncPromises = users.map((user) =>
      Leaderboard.syncUserPoints(user._id, user.points)
    );

    await Promise.all(syncPromises);
    await Leaderboard.updateAllRankings();

    res.status(200).json({
      success: true,
      message: `Synced ${users.length} users to leaderboard`,
      count: users.length,
      syncedUsers: users.map((user) => ({
        id: user._id,
        name: user.name,
        points: user.points,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error syncing users to leaderboard",
      error: error.message,
    });
  }
});

// @desc    Get leaderboard statistics
// @route   GET /api/v1/leaderboard/stats
// @access  Public
exports.getLeaderboardStats = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await Leaderboard.countDocuments();
    const topUser = await Leaderboard.findOne({})
      .populate("userId", "name")
      .sort({ totalPoints: -1 });

    const averagePoints = await Leaderboard.aggregate([
      {
        $group: {
          _id: null,
          avgPoints: { $avg: "$totalPoints" },
          totalPoints: { $sum: "$totalPoints" },
          maxPoints: { $max: "$totalPoints" },
          minPoints: { $min: "$totalPoints" },
        },
      },
    ]);

    const stats = averagePoints[0] || {
      avgPoints: 0,
      totalPoints: 0,
      maxPoints: 0,
      minPoints: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        topUser: topUser
          ? {
              name: topUser.userId.name,
              points: topUser.totalPoints,
            }
          : null,
        averagePoints: Math.round(stats.avgPoints || 0),
        totalPoints: stats.totalPoints,
        maxPoints: stats.maxPoints,
        minPoints: stats.minPoints,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard statistics",
      error: error.message,
    });
  }
});
