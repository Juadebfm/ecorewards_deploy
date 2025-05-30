const asyncHandler = require("express-async-handler");
const RewardClaim = require("../models/rewardClaim.model");
const QRCode = require("../models/qrCode.model");
const Reward = require("../models/reward.model");
const Partner = require("../models/partner.model");
const User = require("../models/user.model");

// @desc    Claim a reward
// @route   POST /api/v1/claim/reward
// @access  Private (Authenticated users only)
const claimReward = asyncHandler(async (req, res) => {
  const { qrCodeId, metadata = {}, verificationData = {} } = req.body;

  const userId = req.user.id;

  // Find and validate QR code
  const qrCode = await QRCode.findOne({ qrCode: qrCodeId })
    .populate("partnerId")
    .populate("rewardId");

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  // Validate QR code eligibility
  const validation = await qrCode.isValidForScanning();
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.reason,
    });
  }

  // Check if user has already claimed this specific QR code
  const existingClaim = await RewardClaim.hasUserClaimedQR(userId, qrCode._id);
  if (existingClaim) {
    return res.status(400).json({
      success: false,
      error: "You have already claimed this reward",
      existingClaim: {
        claimedAt: existingClaim.claimedAt,
        pointsAwarded: existingClaim.pointsAwarded,
      },
    });
  }

  // Check user's claim count for this reward
  const userClaimCount = await RewardClaim.getUserClaimCount(
    userId,
    qrCode.rewardId._id
  );
  if (!qrCode.rewardId.canUserClaim(userClaimCount)) {
    return res.status(400).json({
      success: false,
      error: `You have reached the maximum number of claims (${qrCode.rewardId.maxClaimsPerUser}) for this reward`,
      userClaimCount,
      maxAllowed: qrCode.rewardId.maxClaimsPerUser,
    });
  }

  // Prepare claim metadata
  const claimMetadata = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    ...metadata,
  };

  // Create the reward claim
  const rewardClaim = await RewardClaim.create({
    userId,
    qrCodeId: qrCode._id,
    partnerId: qrCode.partnerId._id,
    rewardId: qrCode.rewardId._id,
    pointsAwarded: qrCode.rewardId.points,
    status: "completed",
    claimMethod: "qr-scan",
    metadata: claimMetadata,
    verificationData,
    claimedAt: new Date(),
    processedAt: new Date(),
  });

  // Record successful claim on QR code
  await qrCode.recordSuccessfulClaim();

  // Get updated user data (points and eco level will be updated by the model's pre-save hook)
  const updatedUser = await User.findById(userId).select(
    "name points ecoLevel"
  );

  // Populate the claim for response
  await rewardClaim.populate([
    { path: "partnerId", select: "name logo category" },
    { path: "rewardId", select: "title description points category" },
  ]);

  res.status(201).json({
    success: true,
    message: "Reward claimed successfully!",
    data: {
      claim: {
        id: rewardClaim._id,
        pointsAwarded: rewardClaim.pointsAwarded,
        claimedAt: rewardClaim.claimedAt,
        status: rewardClaim.status,
      },
      partner: {
        name: rewardClaim.partnerId.name,
        logo: rewardClaim.partnerId.logo,
        category: rewardClaim.partnerId.category,
      },
      reward: {
        title: rewardClaim.rewardId.title,
        description: rewardClaim.rewardId.description,
        points: rewardClaim.rewardId.points,
        category: rewardClaim.rewardId.category,
      },
      user: {
        name: updatedUser.name,
        totalPoints: updatedUser.points,
        ecoLevel: updatedUser.ecoLevel,
        pointsEarned: rewardClaim.pointsAwarded,
      },
    },
  });
});

// @desc    Get user's claim history
// @route   GET /api/v1/claim/history
// @access  Private (Authenticated users only)
const getUserClaimHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    partnerId,
    startDate,
    endDate,
  } = req.query;

  const userId = req.user.id;

  // Build query
  const query = { userId, status: "completed" };

  if (category) {
    // We'll need to populate and filter, so we'll handle this in aggregation
  }

  if (partnerId) {
    query.partnerId = partnerId;
  }

  if (startDate || endDate) {
    query.claimedAt = {};
    if (startDate) query.claimedAt.$gte = new Date(startDate);
    if (endDate) query.claimedAt.$lte = new Date(endDate);
  }

  const claims = await RewardClaim.getUserClaimHistory(
    userId,
    parseInt(limit),
    parseInt(page)
  );

  // Filter by category if specified
  let filteredClaims = claims;
  if (category) {
    filteredClaims = claims.filter(
      (claim) => claim.rewardId.category === category
    );
  }

  // Calculate summary statistics
  const totalPointsEarned = filteredClaims.reduce(
    (sum, claim) => sum + claim.pointsAwarded,
    0
  );

  const categorySummary = filteredClaims.reduce((acc, claim) => {
    const cat = claim.rewardId.category;
    acc[cat] = (acc[cat] || 0) + claim.pointsAwarded;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    count: filteredClaims.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
    },
    summary: {
      totalPointsEarned,
      totalClaims: filteredClaims.length,
      categorySummary,
    },
    data: filteredClaims,
  });
});

// @desc    Get user's points summary
// @route   GET /api/v1/claim/points-summary
// @access  Private (Authenticated users only)
const getUserPointsSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user's current points and level
  const user = await User.findById(userId).select(
    "name points ecoLevel claimedRewards"
  );

  // Get recent claims (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentClaims = await RewardClaim.find({
    userId,
    status: "completed",
    claimedAt: { $gte: thirtyDaysAgo },
  })
    .populate("rewardId", "category points")
    .sort({ claimedAt: -1 });

  // Calculate category breakdown
  const categoryBreakdown = await RewardClaim.aggregate([
    { $match: { userId: user._id, status: "completed" } },
    {
      $lookup: {
        from: "rewards",
        localField: "rewardId",
        foreignField: "_id",
        as: "reward",
      },
    },
    { $unwind: "$reward" },
    {
      $group: {
        _id: "$reward.category",
        totalPoints: { $sum: "$pointsAwarded" },
        totalClaims: { $sum: 1 },
      },
    },
    { $sort: { totalPoints: -1 } },
  ]);

  // Calculate points needed for next level
  const levelThresholds = {
    beginner: 100,
    intermediate: 250,
    advanced: 500,
    expert: 1000,
    leader: null, // No next level
  };

  let pointsToNextLevel = null;
  let nextLevel = null;

  if (user.ecoLevel !== "leader") {
    const levels = Object.keys(levelThresholds);
    const currentLevelIndex = levels.indexOf(user.ecoLevel);
    if (currentLevelIndex < levels.length - 1) {
      nextLevel = levels[currentLevelIndex + 1];
      pointsToNextLevel = levelThresholds[nextLevel] - user.points;
    }
  }

  // Recent points earned (last 30 days)
  const recentPointsEarned = recentClaims.reduce(
    (sum, claim) => sum + claim.pointsAwarded,
    0
  );

  res.status(200).json({
    success: true,
    data: {
      user: {
        name: user.name,
        currentPoints: user.points,
        ecoLevel: user.ecoLevel,
        totalClaims: user.claimedRewards.length,
      },
      progression: {
        nextLevel,
        pointsToNextLevel,
        progressPercentage: nextLevel
          ? (
              ((user.points - (levelThresholds[user.ecoLevel] || 0)) /
                (levelThresholds[nextLevel] -
                  (levelThresholds[user.ecoLevel] || 0))) *
              100
            ).toFixed(1)
          : 100,
      },
      recent: {
        pointsEarnedLast30Days: recentPointsEarned,
        claimsLast30Days: recentClaims.length,
        recentClaims: recentClaims.slice(0, 5).map((claim) => ({
          title: claim.rewardId.title || "Reward",
          category: claim.rewardId.category,
          points: claim.pointsAwarded,
          claimedAt: claim.claimedAt,
        })),
      },
      categoryBreakdown,
    },
  });
});

// @desc    Get all claims (Admin only)
// @route   GET /api/v1/claim/all
// @access  Private (Admin only)
const getAllClaims = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    partnerId,
    userId,
    startDate,
    endDate,
    sortBy = "claimedAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Add filters
  if (status) query.status = status;
  if (partnerId) query.partnerId = partnerId;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.claimedAt = {};
    if (startDate) query.claimedAt.$gte = new Date(startDate);
    if (endDate) query.claimedAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const claims = await RewardClaim.find(query)
    .populate("userId", "name email ecoLevel")
    .populate("partnerId", "name category")
    .populate("rewardId", "title category points")
    .populate("qrCodeId", "qrCode location.name")
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await RewardClaim.countDocuments(query);

  // Calculate summary statistics for filtered results
  const summaryStats = await RewardClaim.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        totalPointsAwarded: { $sum: "$pointsAwarded" },
        uniqueUsers: { $addToSet: "$userId" },
        avgPointsPerClaim: { $avg: "$pointsAwarded" },
      },
    },
    {
      $project: {
        totalClaims: 1,
        totalPointsAwarded: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        avgPointsPerClaim: { $round: ["$avgPointsPerClaim", 2] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    count: claims.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    summary: summaryStats[0] || {
      totalClaims: 0,
      totalPointsAwarded: 0,
      uniqueUsers: 0,
      avgPointsPerClaim: 0,
    },
    data: claims,
  });
});

// @desc    Reverse a claim (Admin only)
// @route   PUT /api/v1/claim/:id/reverse
// @access  Private (Admin only)
const reverseClaim = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const claim = await RewardClaim.findById(req.params.id);

  if (!claim) {
    return res.status(404).json({
      success: false,
      error: "Claim not found",
    });
  }

  if (claim.status === "reversed") {
    return res.status(400).json({
      success: false,
      error: "Claim is already reversed",
    });
  }

  // Reverse the claim (this will update user points, QR code stats, etc.)
  await claim.reverseClaim(reason);

  res.status(200).json({
    success: true,
    message: "Claim reversed successfully",
    data: {
      claimId: claim._id,
      status: claim.status,
      pointsDeducted: claim.pointsAwarded,
      reason: claim.notes,
    },
  });
});

// @desc    Get leaderboard
// @route   GET /api/v1/claim/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const {
    limit = 10,
    period = "all-time", // 'all-time', 'monthly', 'weekly'
    category,
  } = req.query;

  let startDate = null;
  if (period === "monthly") {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === "weekly") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  }

  let topUsers;

  if (category) {
    // If category filter is specified, use custom aggregation
    const matchConditions = {
      status: "completed",
    };

    if (startDate) {
      matchConditions.claimedAt = {
        $gte: startDate,
        $lte: new Date(),
      };
    }

    topUsers = await RewardClaim.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "rewards",
          localField: "rewardId",
          foreignField: "_id",
          as: "reward",
        },
      },
      { $unwind: "$reward" },
      { $match: { "reward.category": category } }, // Filter by category
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$pointsAwarded" },
          totalClaims: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          totalPoints: 1,
          totalClaims: 1,
        },
      },
    ]);
  } else {
    // Use the existing static method for all categories
    topUsers = await RewardClaim.getTopUsersByPoints(
      parseInt(limit),
      startDate,
      new Date()
    );
  }

  res.status(200).json({
    success: true,
    period,
    category: category || "all",
    count: topUsers.length,
    data: topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      name: user.name,
      email: user.email,
      totalPoints: user.totalPoints,
      totalClaims: user.totalClaims,
    })),
  });
});

module.exports = {
  claimReward,
  getUserClaimHistory,
  getUserPointsSummary,
  getAllClaims,
  reverseClaim,
  getLeaderboard,
};
