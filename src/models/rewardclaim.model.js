const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     RewardClaim:
 *       type: object
 *       required:
 *         - userId
 *         - qrCodeId
 *         - partnerId
 *         - rewardId
 *         - pointsAwarded
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         userId:
 *           type: string
 *           description: Reference to the user who claimed the reward
 *         qrCodeId:
 *           type: string
 *           description: Reference to the QR code that was scanned
 *         partnerId:
 *           type: string
 *           description: Reference to the partner who created the reward
 *         rewardId:
 *           type: string
 *           description: Reference to the reward that was claimed
 *         pointsAwarded:
 *           type: number
 *           description: Number of points awarded for this claim
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, reversed]
 *           default: completed
 *           description: Status of the reward claim
 *         claimMethod:
 *           type: string
 *           enum: [qr-scan, manual, bulk-import, referral]
 *           default: qr-scan
 *           description: How the reward was claimed
 *         metadata:
 *           type: object
 *           properties:
 *             ipAddress:
 *               type: string
 *               description: IP address from which claim was made
 *             userAgent:
 *               type: string
 *               description: Browser/device information
 *             location:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 address:
 *                   type: string
 *             deviceInfo:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                 browser:
 *                   type: string
 *         verificationData:
 *           type: object
 *           properties:
 *             requiresProof:
 *               type: boolean
 *               default: false
 *             proofType:
 *               type: string
 *               enum: [photo, receipt, survey, none]
 *             proofUrl:
 *               type: string
 *               description: URL to uploaded proof file
 *             verifiedBy:
 *               type: string
 *               description: Admin user who verified the claim
 *             verifiedAt:
 *               type: string
 *               format: date-time
 *         claimedAt:
 *           type: string
 *           format: date-time
 *           default: Date.now
 *           description: Timestamp when reward was claimed
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when claim was processed/points awarded
 *         notes:
 *           type: string
 *           description: Additional notes about this claim
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the claim record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the claim was last updated
 *       example:
 *         userId: "507f1f77bcf86cd799439013"
 *         qrCodeId: "507f1f77bcf86cd799439014"
 *         partnerId: "507f1f77bcf86cd799439011"
 *         rewardId: "507f1f77bcf86cd799439012"
 *         pointsAwarded: 25
 *         status: "completed"
 *         claimMethod: "qr-scan"
 *         claimedAt: "2025-05-26T14:30:00Z"
 */

const RewardClaimSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
      required: [true, "QR Code ID is required"],
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: [true, "Partner ID is required"],
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: [true, "Reward ID is required"],
    },
    pointsAwarded: {
      type: Number,
      required: [true, "Points awarded is required"],
      min: [1, "Points awarded must be at least 1"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "reversed"],
      default: "completed",
    },
    claimMethod: {
      type: String,
      enum: ["qr-scan", "manual", "bulk-import", "referral"],
      default: "qr-scan",
    },
    metadata: {
      ipAddress: {
        type: String,
        match: [
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
          "Please provide a valid IP address",
        ],
      },
      userAgent: {
        type: String,
        maxlength: [500, "User agent cannot be more than 500 characters"],
      },
      location: {
        latitude: {
          type: Number,
          min: [-90, "Latitude must be between -90 and 90"],
          max: [90, "Latitude must be between -90 and 90"],
        },
        longitude: {
          type: Number,
          min: [-180, "Longitude must be between -180 and 180"],
          max: [180, "Longitude must be between -180 and 180"],
        },
        address: {
          type: String,
          maxlength: [200, "Address cannot be more than 200 characters"],
        },
      },
      deviceInfo: {
        platform: {
          type: String,
          maxlength: [50, "Platform cannot be more than 50 characters"],
        },
        browser: {
          type: String,
          maxlength: [50, "Browser cannot be more than 50 characters"],
        },
      },
    },
    verificationData: {
      requiresProof: {
        type: Boolean,
        default: false,
      },
      proofType: {
        type: String,
        enum: ["photo", "receipt", "survey", "none"],
        default: "none",
      },
      proofUrl: {
        type: String,
        match: [/^https?:\/\/.+/, "Please provide a valid URL for proof"],
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: {
        type: Date,
      },
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot be more than 1000 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
RewardClaimSchema.index({ userId: 1, rewardId: 1 }); // For checking user's previous claims
RewardClaimSchema.index({ userId: 1, qrCodeId: 1 }, { unique: true }); // Prevent duplicate claims
RewardClaimSchema.index({ partnerId: 1, claimedAt: -1 }); // For partner analytics
RewardClaimSchema.index({ status: 1, claimedAt: -1 }); // For admin monitoring
RewardClaimSchema.index({ claimedAt: -1 }); // For recent claims
RewardClaimSchema.index({ rewardId: 1, claimedAt: -1 }); // For reward analytics

// Virtual for calculating time since claim
RewardClaimSchema.virtual("timeSinceClaim").get(function () {
  const now = new Date();
  const claimTime = this.claimedAt;
  const diffInMs = now - claimTime;

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return "Less than an hour ago";
});

// Instance method to mark claim as verified
RewardClaimSchema.methods.markAsVerified = async function (
  verifiedByUserId,
  notes = null
) {
  this.verificationData.verifiedBy = verifiedByUserId;
  this.verificationData.verifiedAt = new Date();
  this.status = "completed";
  if (notes) this.notes = notes;

  return await this.save();
};

// Instance method to reverse a claim
RewardClaimSchema.methods.reverseClaim = async function (reason = null) {
  this.status = "reversed";
  if (reason) this.notes = `Reversed: ${reason}`;

  // Deduct points from user
  const User = mongoose.model("User");
  const user = await User.findById(this.userId);
  if (user) {
    user.points = Math.max(0, user.points - this.pointsAwarded);
    user.updateEcoLevel();
    await user.save();
  }

  // Update QR code successful claims count
  const QRCode = mongoose.model("QRCode");
  await QRCode.findByIdAndUpdate(this.qrCodeId, {
    $inc: { successfulClaims: -1 },
  });

  // Update reward current claims count
  const Reward = mongoose.model("Reward");
  await Reward.findByIdAndUpdate(this.rewardId, {
    $inc: { currentClaims: -1 },
  });

  return await this.save();
};

// Static method to get user's claim count for a specific reward
RewardClaimSchema.statics.getUserClaimCount = function (userId, rewardId) {
  return this.countDocuments({
    userId,
    rewardId,
    status: { $in: ["completed", "pending"] },
  });
};

// Static method to check if user has already claimed a specific QR code
RewardClaimSchema.statics.hasUserClaimedQR = function (userId, qrCodeId) {
  return this.findOne({
    userId,
    qrCodeId,
    status: { $in: ["completed", "pending"] },
  });
};

// Static method to get user's claim history
RewardClaimSchema.statics.getUserClaimHistory = function (
  userId,
  limit = 20,
  page = 1
) {
  const skip = (page - 1) * limit;

  return this.find({ userId, status: "completed" })
    .populate("partnerId", "name logo")
    .populate("rewardId", "title category points")
    .populate("qrCodeId", "location.name")
    .sort({ claimedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get partner analytics
RewardClaimSchema.statics.getPartnerAnalytics = function (
  partnerId,
  startDate,
  endDate
) {
  const matchConditions = {
    partnerId,
    status: "completed",
  };

  if (startDate && endDate) {
    matchConditions.claimedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: matchConditions },
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
};

// Static method to get top users by points in a time period
RewardClaimSchema.statics.getTopUsersByPoints = function (
  limit = 10,
  startDate,
  endDate
) {
  const matchConditions = { status: "completed" };

  if (startDate && endDate) {
    matchConditions.claimedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$pointsAwarded" },
        totalClaims: { $sum: 1 },
      },
    },
    { $sort: { totalPoints: -1 } },
    { $limit: limit },
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
};

// Pre-save middleware to update related models
RewardClaimSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "completed") {
    // Update user points and eco level
    const User = mongoose.model("User");
    const user = await User.findById(this.userId);
    if (user) {
      user.points += this.pointsAwarded;
      user.claimedRewards.push({
        rewardId: this.rewardId,
        qrCodeId: this.qrCodeId,
        pointsAwarded: this.pointsAwarded,
        claimedAt: this.claimedAt,
      });
      user.updateEcoLevel();
      await user.save();
    }

    // Update QR code successful claims
    const QRCode = mongoose.model("QRCode");
    await QRCode.findByIdAndUpdate(this.qrCodeId, {
      $inc: { successfulClaims: 1 },
    });

    // Update reward current claims
    const Reward = mongoose.model("Reward");
    await Reward.findByIdAndUpdate(this.rewardId, {
      $inc: { currentClaims: 1 },
    });
  }

  next();
});

module.exports = mongoose.model("RewardClaim", RewardClaimSchema);
