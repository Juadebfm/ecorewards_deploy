const asyncHandler = require("express-async-handler");
const QRCode = require("../models/qrcode.model");
const Partner = require("../models/partner.model");
const Reward = require("../models/reward.model");
const RewardClaim = require("../models/rewardclaim.model");

// @desc    Scan QR code and get reward details
// @route   GET /api/v1/scan/:qrId
// @access  Public (works for both authenticated and non-authenticated users)
const scanQRCode = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  // Find QR code and populate related data
  const qrCode = await QRCode.findOne({ qrCode: qrId })
    .populate("partnerId", "name logo category description website")
    .populate(
      "rewardId",
      "title description points category requirements actionType maxClaimsPerUser expiryDate"
    );

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  // Validate QR code and get validation details
  const validation = await qrCode.isValidForScanning();
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.reason,
      qrCode: {
        id: qrCode.qrCode,
        scanCount: qrCode.scanCount,
      },
    });
  }

  // Record the scan (increment counters)
  await qrCode.recordScan(req.user?.id);

  // Prepare response data
  const responseData = {
    qrCode: {
      id: qrCode.qrCode,
      scanCount: qrCode.scanCount + 1, // Show updated count
      location: qrCode.location,
    },
    partner: {
      id: qrCode.partnerId._id,
      name: qrCode.partnerId.name,
      logo: qrCode.partnerId.logo,
      category: qrCode.partnerId.category,
      description: qrCode.partnerId.description,
      website: qrCode.partnerId.website,
    },
    reward: {
      id: qrCode.rewardId._id,
      title: qrCode.rewardId.title,
      description: qrCode.rewardId.description,
      points: qrCode.rewardId.points,
      category: qrCode.rewardId.category,
      requirements: qrCode.rewardId.requirements,
      actionType: qrCode.rewardId.actionType,
      maxClaimsPerUser: qrCode.rewardId.maxClaimsPerUser,
      expiryDate: qrCode.rewardId.expiryDate,
      isExpired: qrCode.rewardId.isExpired,
      isMaxedOut: qrCode.rewardId.isMaxedOut,
    },
  };

  // Add user-specific information if authenticated
  if (req.user) {
    const existingClaim = await RewardClaim.hasUserClaimedQR(
      req.user.id,
      qrCode._id
    );
    const userClaimCount = await RewardClaim.getUserClaimCount(
      req.user.id,
      qrCode.rewardId._id
    );

    responseData.userInfo = {
      isAuthenticated: true,
      hasClaimedThisQR: !!existingClaim,
      claimCountForReward: userClaimCount,
      canClaim: !existingClaim && qrCode.rewardId.canUserClaim(userClaimCount),
      user: {
        id: req.user.id,
        name: req.user.name,
        points: req.user.points,
        ecoLevel: req.user.ecoLevel,
      },
    };
  } else {
    responseData.userInfo = {
      isAuthenticated: false,
      message: "Sign up or log in to claim this reward",
    };
  }

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

// @desc    Generate QR code for a reward
// @route   POST /api/v1/qr/generate
// @access  Private (Admin only)
const generateQRCode = asyncHandler(async (req, res) => {
  const { partnerId, rewardId, location, notes } = req.body;

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
      error: "Partner is not eligible for QR code generation",
    });
  }

  // Verify reward exists and belongs to partner
  const reward = await Reward.findOne({ _id: rewardId, partnerId });
  if (!reward) {
    return res.status(404).json({
      success: false,
      error: "Reward not found or doesn't belong to specified partner",
    });
  }

  if (!reward.isActive) {
    return res.status(400).json({
      success: false,
      error: "Cannot generate QR code for inactive reward",
    });
  }

  // Create QR code
  const qrCode = await QRCode.create({
    partnerId,
    rewardId,
    location,
    notes,
  });

  // Populate response data
  await qrCode.populate([
    { path: "partnerId", select: "name logo" },
    { path: "rewardId", select: "title points category" },
  ]);

  res.status(201).json({
    success: true,
    data: {
      qrCode: qrCode.qrCode,
      scanUrl: qrCode.scanUrl,
      partnerId: qrCode.partnerId,
      rewardId: qrCode.rewardId,
      location: qrCode.location,
      isActive: qrCode.isActive,
      createdAt: qrCode.createdAt,
    },
  });
});

// @desc    Generate bulk QR codes
// @route   POST /api/v1/qr/bulk-generate
// @access  Private (Admin only)
const generateBulkQRCodes = asyncHandler(async (req, res) => {
  const { partnerId, rewardId, quantity, batchId, locations = [] } = req.body;

  if (quantity > 100) {
    return res.status(400).json({
      success: false,
      error: "Cannot generate more than 100 QR codes at once",
    });
  }

  // Verify partner and reward (same validation as single generation)
  const [partner, reward] = await Promise.all([
    Partner.findById(partnerId),
    Reward.findOne({ _id: rewardId, partnerId }),
  ]);

  if (!partner || !partner.isEligibleForRewards()) {
    return res.status(400).json({
      success: false,
      error: "Partner not found or not eligible",
    });
  }

  if (!reward || !reward.isActive) {
    return res.status(400).json({
      success: false,
      error: "Reward not found, inactive, or doesn't belong to partner",
    });
  }

  // Generate bulk QR codes
  const qrCodes = await QRCode.generateBulkQRCodes(
    partnerId,
    rewardId,
    quantity,
    batchId
  );

  // If locations provided, update QR codes with location data
  if (locations.length > 0) {
    const updatePromises = qrCodes.map((qr, index) => {
      if (locations[index]) {
        return QRCode.findByIdAndUpdate(qr._id, {
          location: locations[index],
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  }

  res.status(201).json({
    success: true,
    data: {
      batchId: qrCodes[0].batchId,
      totalGenerated: qrCodes.length,
      partnerId: partner._id,
      partnerName: partner.name,
      rewardId: reward._id,
      rewardTitle: reward.title,
      qrCodes: qrCodes.map((qr) => ({
        id: qr._id,
        qrCode: qr.qrCode,
        scanUrl: `${
          process.env.FRONTEND_URL || "https://eco-rewards-sooty.vercel.app/"
        }/scan/${qr.qrCode}`,
      })),
    },
  });
});

// @desc    Get QR code details (admin)
// @route   GET /api/v1/qr/:qrId/details
// @access  Private (Admin only)
const getQRCodeDetails = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  const qrCode = await QRCode.findOne({ qrCode: qrId })
    .populate("partnerId", "name logo category")
    .populate("rewardId", "title points category requirements")
    .populate("lastScannedBy", "name email");

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  // Get claim statistics for this QR code
  const claimStats = await RewardClaim.aggregate([
    { $match: { qrCodeId: qrCode._id, status: "completed" } },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        totalPointsAwarded: { $sum: "$pointsAwarded" },
        uniqueUsers: { $addToSet: "$userId" },
        lastClaimDate: { $max: "$claimedAt" },
      },
    },
    {
      $project: {
        totalClaims: 1,
        totalPointsAwarded: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        lastClaimDate: 1,
      },
    },
  ]);

  const stats = claimStats[0] || {
    totalClaims: 0,
    totalPointsAwarded: 0,
    uniqueUsers: 0,
    lastClaimDate: null,
  };

  res.status(200).json({
    success: true,
    data: {
      ...qrCode.toObject(),
      conversionRate: qrCode.conversionRate,
      scanUrl: qrCode.scanUrl,
      statistics: stats,
    },
  });
});

// @desc    Get QR codes by batch
// @route   GET /api/v1/qr/batch/:batchId
// @access  Private (Admin only)
const getQRCodesByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const qrCodes = await QRCode.getQRCodesByBatch(batchId);

  if (qrCodes.length === 0) {
    return res.status(404).json({
      success: false,
      error: "No QR codes found for this batch",
    });
  }

  // Calculate batch statistics
  const batchStats = {
    totalQRCodes: qrCodes.length,
    totalScans: qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0),
    totalSuccessfulClaims: qrCodes.reduce(
      (sum, qr) => sum + qr.successfulClaims,
      0
    ),
    activeQRCodes: qrCodes.filter((qr) => qr.isActive).length,
    averageScansPerQR: 0,
  };

  if (batchStats.totalQRCodes > 0) {
    batchStats.averageScansPerQR = (
      batchStats.totalScans / batchStats.totalQRCodes
    ).toFixed(2);
  }

  res.status(200).json({
    success: true,
    data: {
      batchId,
      statistics: batchStats,
      qrCodes: qrCodes.map((qr) => ({
        ...qr.toObject(),
        scanUrl: `${
          process.env.FRONTEND_URL || "https://eco-rewards-sooty.vercel.app/"
        }/scan/${qr.qrCode}`,
        conversionRate: qr.conversionRate,
      })),
    },
  });
});

// @desc    Toggle QR code status
// @route   PUT /api/v1/qr/:qrId/toggle-status
// @access  Private (Admin only)
const toggleQRCodeStatus = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  const qrCode = await QRCode.findOne({ qrCode: qrId });

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  qrCode.isActive = !qrCode.isActive;
  await qrCode.save();

  res.status(200).json({
    success: true,
    data: {
      qrCode: qrCode.qrCode,
      isActive: qrCode.isActive,
    },
    message: `QR code ${
      qrCode.isActive ? "activated" : "deactivated"
    } successfully`,
  });
});

// @desc    Delete QR code
// @route   DELETE /api/v1/qr/:qrId
// @access  Private (Admin only)
const deleteQRCode = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  const qrCode = await QRCode.findOne({ qrCode: qrId });

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      error: "QR code not found",
    });
  }

  // Check if QR code has claims
  const claimCount = await RewardClaim.countDocuments({
    qrCodeId: qrCode._id,
  });

  if (claimCount > 0) {
    return res.status(400).json({
      success: false,
      error:
        "Cannot delete QR code that has claims. Consider deactivating instead.",
    });
  }

  await QRCode.findByIdAndDelete(qrCode._id);

  res.status(200).json({
    success: true,
    data: {},
    message: "QR code deleted successfully",
  });
});

// @desc    Get top performing QR codes
// @route   GET /api/v1/qr/top-performing
// @access  Private (Admin only)
const getTopPerformingQRCodes = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const qrCodes = await QRCode.getTopPerformingQRCodes(parseInt(limit));

  const enrichedQRCodes = qrCodes.map((qr) => ({
    ...qr.toObject(),
    scanUrl: `${
      process.env.FRONTEND_URL || "https://eco-rewards-sooty.vercel.app/"
    }/scan/${qr.qrCode}`,
    conversionRate: qr.conversionRate,
  }));

  res.status(200).json({
    success: true,
    count: enrichedQRCodes.length,
    data: enrichedQRCodes,
  });
});

module.exports = {
  scanQRCode,
  generateQRCode,
  generateBulkQRCodes,
  getQRCodeDetails,
  getQRCodesByBatch,
  toggleQRCodeStatus,
  deleteQRCode,
  getTopPerformingQRCodes,
};
