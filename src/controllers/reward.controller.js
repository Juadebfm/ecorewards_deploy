const asyncHandler = require("express-async-handler");
const Reward = require("../models/reward.model");
const Partner = require("../models/partner.model");

// @desc    Create new reward
// @route   POST /api/v1/rewards
// @access  Private (Admin only)
const createReward = asyncHandler(async (req, res) => {
  const {
    partnerId,
    title,
    description,
    points,
    category,
    requirements,
    actionType,
    maxClaimsPerUser,
    totalMaxClaims,
    expiryDate,
    priority,
    tags,
    imageUrl,
  } = req.body;

  // Verify partner exists and is eligible
  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  if (!partner.isEligibleForRewards()) {
    return res.status(400).json({
      success: false,
      error:
        "Partner is not eligible to create rewards. Partner must be verified and active.",
    });
  }

  const reward = await Reward.create({
    partnerId,
    title,
    description,
    points,
    category,
    requirements,
    actionType,
    maxClaimsPerUser,
    totalMaxClaims,
    expiryDate,
    priority,
    tags,
    imageUrl,
  });

  // Populate partner info for response
  await reward.populate("partnerId", "name logo category");

  res.status(201).json({
    success: true,
    data: reward,
  });
});

// @desc    Get all rewards
// @route   GET /api/v1/rewards
// @access  Private (Admin only)
const getAllRewards = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    partnerId,
    category,
    actionType,
    isActive,
    priority,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Add filters
  if (partnerId) query.partnerId = partnerId;
  if (category) query.category = category;
  if (actionType) query.actionType = actionType;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (priority) query.priority = priority;

  // Add search functionality
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const rewards = await Reward.find(query)
    .populate("partnerId", "name logo category verificationStatus")
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Reward.countDocuments(query);

  res.status(200).json({
    success: true,
    count: rewards.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: rewards,
  });
});

// @desc    Get available rewards (public)
// @route   GET /api/v1/rewards/available
// @access  Public
const getAvailableRewards = asyncHandler(async (req, res) => {
  const {
    category,
    limit = 20,
    featured = false,
    minPoints,
    maxPoints,
    actionType,
  } = req.query;

  let rewards;

  if (featured === "true") {
    rewards = await Reward.getFeaturedRewards(parseInt(limit));
  } else if (category) {
    rewards = await Reward.getAvailableRewardsByCategory(category);
  } else {
    const query = {
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
      $expr: {
        $or: [
          { $eq: ["$totalMaxClaims", null] },
          { $lt: ["$currentClaims", "$totalMaxClaims"] },
        ],
      },
    };

    // Add additional filters
    if (minPoints || maxPoints) {
      query.points = {};
      if (minPoints) query.points.$gte = parseInt(minPoints);
      if (maxPoints) query.points.$lte = parseInt(maxPoints);
    }

    if (actionType) query.actionType = actionType;

    rewards = await Reward.find(query)
      .populate("partnerId", "name logo category")
      .sort({ priority: -1, points: -1 })
      .limit(parseInt(limit));
  }

  res.status(200).json({
    success: true,
    count: rewards.length,
    data: rewards,
  });
});

// @desc    Get rewards by partner
// @route   GET /api/v1/rewards/partner/:partnerId
// @access  Public
const getRewardsByPartner = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const { includeInactive = false } = req.query;

  // Verify partner exists and is eligible (unless admin requesting inactive)
  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  let rewards;
  if (includeInactive === "true" && req.user?.role === "admin") {
    // Admin can see all rewards including inactive
    rewards = await Reward.find({ partnerId }).sort({ createdAt: -1 });
  } else {
    // Public users see only active rewards from eligible partners
    if (!partner.isEligibleForRewards()) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      });
    }
    rewards = await Reward.getActiveRewardsByPartner(partnerId);
  }

  res.status(200).json({
    success: true,
    count: rewards.length,
    data: rewards,
    partner: {
      name: partner.name,
      logo: partner.logo,
      category: partner.category,
    },
  });
});

// @desc    Get single reward
// @route   GET /api/v1/rewards/:id
// @access  Public
const getReward = asyncHandler(async (req, res) => {
  const reward = await Reward.findById(req.params.id).populate(
    "partnerId",
    "name logo category description website"
  );

  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found",
    });
  }

  // If user is not admin, only show available rewards from eligible partners
  if (req.user?.role !== "admin") {
    if (!reward.isAvailable || !reward.partnerId.isEligibleForRewards()) {
      return res.status(404).json({
        success: false,
        error: "Reward not found",
      });
    }
  }

  // Add user-specific information if user is authenticated
  let userCanClaim = false;
  let userClaimCount = 0;

  if (req.user) {
    userClaimCount = req.user.getClaimCountForReward(reward._id);
    userCanClaim = reward.canUserClaim(userClaimCount);
  }

  res.status(200).json({
    success: true,
    data: {
      ...reward.toObject(),
      userInfo: req.user
        ? {
            canClaim: userCanClaim,
            claimCount: userClaimCount,
            maxClaims: reward.maxClaimsPerUser,
          }
        : null,
    },
  });
});

// @desc    Update reward
// @route   PUT /api/v1/rewards/:id
// @access  Private (Admin only)
const updateReward = asyncHandler(async (req, res) => {
  let reward = await Reward.findById(req.params.id);

  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found",
    });
  }

  // If partnerId is being changed, verify new partner
  if (
    req.body.partnerId &&
    req.body.partnerId !== reward.partnerId.toString()
  ) {
    const partner = await Partner.findById(req.body.partnerId);
    if (!partner || !partner.isEligibleForRewards()) {
      return res.status(400).json({
        success: false,
        error: "New partner is not eligible for rewards",
      });
    }
  }

  reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("partnerId", "name logo category");

  res.status(200).json({
    success: true,
    data: reward,
  });
});

// @desc    Delete reward
// @route   DELETE /api/v1/rewards/:id
// @access  Private (Admin only)
const deleteReward = asyncHandler(async (req, res) => {
  const reward = await Reward.findById(req.params.id);

  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found",
    });
  }

  // Check if reward has claims before deletion
  const RewardClaim = require("../models/rewardClaim.model");
  const claimCount = await RewardClaim.countDocuments({
    rewardId: req.params.id,
  });

  if (claimCount > 0) {
    return res.status(400).json({
      success: false,
      error:
        "Cannot delete reward that has been claimed. Consider deactivating instead.",
    });
  }

  // Also check for QR codes
  const QRCode = require("../models/qrCode.model");
  const qrCount = await QRCode.countDocuments({
    rewardId: req.params.id,
  });

  if (qrCount > 0) {
    return res.status(400).json({
      success: false,
      error:
        "Cannot delete reward that has QR codes. Please delete QR codes first.",
    });
  }

  await Reward.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
    message: "Reward deleted successfully",
  });
});

// @desc    Toggle reward active status
// @route   PUT /api/v1/rewards/:id/toggle-status
// @access  Private (Admin only)
const toggleRewardStatus = asyncHandler(async (req, res) => {
  const reward = await Reward.findById(req.params.id);

  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found",
    });
  }

  reward.isActive = !reward.isActive;
  await reward.save();

  res.status(200).json({
    success: true,
    data: reward,
    message: `Reward ${
      reward.isActive ? "activated" : "deactivated"
    } successfully`,
  });
});

// @desc    Get reward statistics
// @route   GET /api/v1/rewards/:id/stats
// @access  Private (Admin only)
const getRewardStats = asyncHandler(async (req, res) => {
  const reward = await Reward.findById(req.params.id).populate(
    "partnerId",
    "name category"
  );

  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found",
    });
  }

  // Get QR codes and claims statistics
  const QRCode = require("../models/qrCode.model");
  const RewardClaim = require("../models/rewardClaim.model");

  const [qrStats, claimStats] = await Promise.all([
    QRCode.aggregate([
      { $match: { rewardId: reward._id } },
      {
        $group: {
          _id: null,
          totalQRCodes: { $sum: 1 },
          activeQRCodes: { $sum: { $cond: ["$isActive", 1, 0] } },
          totalScans: { $sum: "$scanCount" },
          totalUniqueScans: { $sum: "$uniqueScans" },
          totalSuccessfulClaims: { $sum: "$successfulClaims" },
        },
      },
    ]),
    RewardClaim.aggregate([
      { $match: { rewardId: reward._id, status: "completed" } },
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
    ]),
  ]);

  const stats = {
    reward: {
      title: reward.title,
      category: reward.category,
      points: reward.points,
      maxClaimsPerUser: reward.maxClaimsPerUser,
      totalMaxClaims: reward.totalMaxClaims,
      currentClaims: reward.currentClaims,
      isActive: reward.isActive,
      isExpired: reward.isExpired,
      isMaxedOut: reward.isMaxedOut,
      createdAt: reward.createdAt,
    },
    partner: {
      name: reward.partnerId.name,
      category: reward.partnerId.category,
    },
    qrCodes: qrStats[0] || {
      totalQRCodes: 0,
      activeQRCodes: 0,
      totalScans: 0,
      totalUniqueScans: 0,
      totalSuccessfulClaims: 0,
    },
    claims: claimStats[0] || {
      totalClaims: 0,
      totalPointsAwarded: 0,
      uniqueUsers: 0,
      avgPointsPerClaim: 0,
    },
  };

  // Calculate conversion rate
  if (stats.qrCodes.totalScans > 0) {
    stats.performance = {
      conversionRate: (
        (stats.claims.totalClaims / stats.qrCodes.totalScans) *
        100
      ).toFixed(2),
      scanToUniqueRate: (
        (stats.qrCodes.totalUniqueScans / stats.qrCodes.totalScans) *
        100
      ).toFixed(2),
    };
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  createReward,
  getAllRewards,
  getAvailableRewards,
  getRewardsByPartner,
  getReward,
  updateReward,
  deleteReward,
  toggleRewardStatus,
  getRewardStats,
};
