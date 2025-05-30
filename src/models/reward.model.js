const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Reward:
 *       type: object
 *       required:
 *         - partnerId
 *         - title
 *         - points
 *         - requirements
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         partnerId:
 *           type: string
 *           description: Reference to the partner who created this reward
 *         title:
 *           type: string
 *           description: Reward campaign title (max 100 characters)
 *         description:
 *           type: string
 *           description: Detailed description of the reward and eco-action
 *         points:
 *           type: number
 *           description: Points awarded for completing this eco-action
 *         category:
 *           type: string
 *           enum: [recycling, energy-saving, waste-reduction, sustainable-transport, water-conservation, carbon-offset, eco-purchase, other]
 *           description: Type of eco-friendly action required
 *         requirements:
 *           type: string
 *           description: What the user needs to do to claim the reward
 *         actionType:
 *           type: string
 *           enum: [purchase, recycle, participate, survey, check-in, photo-proof, other]
 *           description: Specific type of action required
 *         maxClaimsPerUser:
 *           type: number
 *           default: 1
 *           description: Maximum times a single user can claim this reward
 *         totalMaxClaims:
 *           type: number
 *           description: Total maximum claims across all users (null for unlimited)
 *         currentClaims:
 *           type: number
 *           default: 0
 *           description: Current number of times this reward has been claimed
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: When this reward expires (null for no expiry)
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this reward is currently active
 *         priority:
 *           type: string
 *           enum: [low, medium, high, featured]
 *           default: medium
 *           description: Display priority for the reward
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorizing and searching rewards
 *         imageUrl:
 *           type: string
 *           description: URL to reward campaign image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the reward was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the reward was last updated
 *       example:
 *         partnerId: "507f1f77bcf86cd799439011"
 *         title: "Recycle 5 Plastic Bottles"
 *         description: "Bring 5 plastic bottles to our recycling center and earn eco points"
 *         points: 25
 *         category: "recycling"
 *         actionType: "recycle"
 *         requirements: "Bring 5 clean plastic bottles to any GreenTech recycling center"
 *         maxClaimsPerUser: 3
 *         totalMaxClaims: 1000
 *         priority: "high"
 */

const RewardSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: [true, "Partner ID is required"],
    },
    title: {
      type: String,
      required: [true, "Please add a reward title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    points: {
      type: Number,
      required: [true, "Please specify points for this reward"],
      min: [1, "Points must be at least 1"],
      max: [1000, "Points cannot exceed 1000 per reward"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: [
        "recycling",
        "energy-saving",
        "waste-reduction",
        "sustainable-transport",
        "water-conservation",
        "carbon-offset",
        "eco-purchase",
        "other",
      ],
    },
    requirements: {
      type: String,
      required: [true, "Please specify requirements to claim this reward"],
      trim: true,
      maxlength: [500, "Requirements cannot be more than 500 characters"],
    },
    actionType: {
      type: String,
      required: [true, "Please specify the action type"],
      enum: [
        "purchase",
        "recycle",
        "participate",
        "survey",
        "check-in",
        "photo-proof",
        "other",
      ],
    },
    maxClaimsPerUser: {
      type: Number,
      default: 1,
      min: [1, "Max claims per user must be at least 1"],
      max: [100, "Max claims per user cannot exceed 100"],
    },
    totalMaxClaims: {
      type: Number,
      min: [1, "Total max claims must be at least 1"],
      validate: {
        validator: function (value) {
          // Allow null for unlimited claims
          return value === null || value >= 1;
        },
        message: "Total max claims must be at least 1 or null for unlimited",
      },
    },
    currentClaims: {
      type: Number,
      default: 0,
      min: [0, "Current claims cannot be negative"],
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Allow null for no expiry, or future date
          return value === null || value > new Date();
        },
        message: "Expiry date must be in the future",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "featured"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    imageUrl: {
      type: String,
      match: [
        /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i,
        "Please provide a valid image URL",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
RewardSchema.index({ partnerId: 1, isActive: 1 });
RewardSchema.index({ category: 1, isActive: 1 });
RewardSchema.index({ priority: 1, expiryDate: 1 });
RewardSchema.index({ points: 1 });
RewardSchema.index({ expiryDate: 1 });
RewardSchema.index({ tags: 1 });
// For text search
RewardSchema.index({ title: "text", description: "text", tags: "text" });

// Virtual for checking if reward is expired
RewardSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for checking if reward has reached max claims
RewardSchema.virtual("isMaxedOut").get(function () {
  if (!this.totalMaxClaims) return false;
  return this.currentClaims >= this.totalMaxClaims;
});

// Virtual for checking if reward is available for claiming
RewardSchema.virtual("isAvailable").get(function () {
  return this.isActive && !this.isExpired && !this.isMaxedOut;
});

// Instance method to check if user can claim this reward
RewardSchema.methods.canUserClaim = function (userClaimCount = 0) {
  if (!this.isAvailable) return false;
  return userClaimCount < this.maxClaimsPerUser;
};

// Instance method to increment claim count
RewardSchema.methods.incrementClaims = async function () {
  this.currentClaims += 1;
  return await this.save();
};

// Static method to get active rewards for a partner
RewardSchema.statics.getActiveRewardsByPartner = function (partnerId) {
  return this.find({
    partnerId,
    isActive: true,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
  }).sort({ priority: -1, points: -1 });
};

// Static method to get available rewards by category
RewardSchema.statics.getAvailableRewardsByCategory = function (category) {
  return this.find({
    category,
    isActive: true,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    $expr: {
      $or: [
        { $eq: ["$totalMaxClaims", null] },
        { $lt: ["$currentClaims", "$totalMaxClaims"] },
      ],
    },
  })
    .populate("partnerId", "name logo")
    .sort({ priority: -1, points: -1 });
};

// Static method to get featured rewards
RewardSchema.statics.getFeaturedRewards = function (limit = 10) {
  return this.find({
    priority: "featured",
    isActive: true,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    $expr: {
      $or: [
        { $eq: ["$totalMaxClaims", null] },
        { $lt: ["$currentClaims", "$totalMaxClaims"] },
      ],
    },
  })
    .populate("partnerId", "name logo")
    .limit(limit)
    .sort({ points: -1 });
};

// Pre-save middleware to update partner's total rewards count
RewardSchema.pre("save", async function (next) {
  if (this.isNew) {
    const Partner = mongoose.model("Partner");
    await Partner.findByIdAndUpdate(this.partnerId, {
      $inc: { totalRewards: 1 },
    });
  }
  next();
});

module.exports =
  mongoose.models.Reward || mongoose.model("Reward", RewardSchema);
