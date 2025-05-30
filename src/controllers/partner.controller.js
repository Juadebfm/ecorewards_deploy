const asyncHandler = require("express-async-handler");
const Partner = require("../models/partner.model");
const Reward = require("../models/reward.model");
const RewardClaim = require("../models/rewardclaim.model");

// @desc    Create new partner
// @route   POST /api/v1/partners
// @access  Private (Admin only)
const createPartner = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    logo,
    description,
    website,
    contactPerson,
    contactPhone,
    address,
    category,
  } = req.body;

  // Check if partner with email already exists
  const existingPartner = await Partner.findOne({ email });
  if (existingPartner) {
    return res.status(400).json({
      success: false,
      error: "Partner with this email already exists",
    });
  }

  // Check if partner with name already exists
  const existingName = await Partner.findOne({ name });
  if (existingName) {
    return res.status(400).json({
      success: false,
      error: "Partner with this name already exists",
    });
  }

  const partner = await Partner.create({
    name,
    email,
    logo,
    description,
    website,
    contactPerson,
    contactPhone,
    address,
    category,
  });

  res.status(201).json({
    success: true,
    data: partner,
  });
});

// @desc    Get all partners
// @route   GET /api/v1/partners
// @access  Private (Admin only)
const getAllPartners = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    verificationStatus,
    isActive,
    search,
  } = req.query;

  const query = {};

  // Add filters
  if (category) query.category = category;
  if (verificationStatus) query.verificationStatus = verificationStatus;
  if (isActive !== undefined) query.isActive = isActive === "true";

  // Add search functionality
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const partners = await Partner.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Partner.countDocuments(query);

  res.status(200).json({
    success: true,
    count: partners.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: partners,
  });
});

// @desc    Get active verified partners (public)
// @route   GET /api/v1/partners/active
// @access  Public
const getActivePartners = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let partners;
  if (category) {
    partners = await Partner.getPartnersByCategory(category);
  } else {
    partners = await Partner.getActivePartners();
  }

  res.status(200).json({
    success: true,
    count: partners.length,
    data: partners,
  });
});

// @desc    Get single partner
// @route   GET /api/v1/partners/:id
// @access  Private (Admin) / Public (if verified and active)
const getPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  // If user is not admin, only show verified and active partners
  if (req.user?.role !== "admin") {
    if (!partner.isEligibleForRewards()) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      });
    }
  }

  res.status(200).json({
    success: true,
    data: partner,
  });
});

// @desc    Update partner
// @route   PUT /api/v1/partners/:id
// @access  Private (Admin only)
const updatePartner = asyncHandler(async (req, res) => {
  let partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  // Check for unique email if being updated
  if (req.body.email && req.body.email !== partner.email) {
    const existingPartner = await Partner.findOne({ email: req.body.email });
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        error: "Partner with this email already exists",
      });
    }
  }

  // Check for unique name if being updated
  if (req.body.name && req.body.name !== partner.name) {
    const existingName = await Partner.findOne({ name: req.body.name });
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: "Partner with this name already exists",
      });
    }
  }

  partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: partner,
  });
});

// @desc    Delete partner
// @route   DELETE /api/v1/partners/:id
// @access  Private (Admin only)
const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  // Check if partner has active rewards before deletion
  const Reward = require("../models/reward.model");
  const activeRewards = await Reward.countDocuments({
    partnerId: req.params.id,
    isActive: true,
  });

  if (activeRewards > 0) {
    return res.status(400).json({
      success: false,
      error:
        "Cannot delete partner with active rewards. Please deactivate rewards first.",
    });
  }

  await Partner.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
    message: "Partner deleted successfully",
  });
});

// @desc    Verify partner
// @route   PUT /api/v1/partners/:id/verify
// @access  Private (Admin only)
const verifyPartner = asyncHandler(async (req, res) => {
  const { verificationStatus } = req.body;

  if (!["verified", "rejected"].includes(verificationStatus)) {
    return res.status(400).json({
      success: false,
      error: "Verification status must be 'verified' or 'rejected'",
    });
  }

  const partner = await Partner.findByIdAndUpdate(
    req.params.id,
    { verificationStatus },
    { new: true, runValidators: true }
  );

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  res.status(200).json({
    success: true,
    data: partner,
    message: `Partner ${verificationStatus} successfully`,
  });
});

// @desc    Toggle partner active status
// @route   PUT /api/v1/partners/:id/toggle-status
// @access  Private (Admin only)
const togglePartnerStatus = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  partner.isActive = !partner.isActive;
  await partner.save();

  res.status(200).json({
    success: true,
    data: partner,
    message: `Partner ${
      partner.isActive ? "activated" : "deactivated"
    } successfully`,
  });
});

// @desc    Get partner statistics
// @route   GET /api/v1/partners/:id/stats
// @access  Private (Admin only)
const getPartnerStats = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({
      success: false,
      error: "Partner not found",
    });
  }

  // Get additional statistics

  const [rewardStats, claimStats] = await Promise.all([
    Reward.aggregate([
      { $match: { partnerId: partner._id } },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: 1 },
          activeRewards: { $sum: { $cond: ["$isActive", 1, 0] } },
          totalPointsOffered: { $sum: "$points" },
          avgPointsPerReward: { $avg: "$points" },
        },
      },
    ]),
    RewardClaim.getPartnerAnalytics(partner._id),
  ]);

  const stats = {
    partner: {
      name: partner.name,
      category: partner.category,
      verificationStatus: partner.verificationStatus,
      isActive: partner.isActive,
      joinedAt: partner.joinedAt,
      totalScans: partner.totalScans,
    },
    rewards: rewardStats[0] || {
      totalRewards: 0,
      activeRewards: 0,
      totalPointsOffered: 0,
      avgPointsPerReward: 0,
    },
    claims: claimStats[0] || {
      totalClaims: 0,
      totalPointsAwarded: 0,
      uniqueUsers: 0,
      avgPointsPerClaim: 0,
    },
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  createPartner,
  getAllPartners,
  getActivePartners,
  getPartner,
  updatePartner,
  deletePartner,
  verifyPartner,
  togglePartnerStatus,
  getPartnerStats,
};
