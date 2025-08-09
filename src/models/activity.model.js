const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      enum: [
        "qr_scan", // Links to your QR system
        "reward_claim", // Links to successful reward claims
        "tree_planting",
        "reusable_bags",
        "refurbished_electronics",
        "renewable_energy",
        "recycling",
        "energy_saving",
        "transport",
        "education",
        "challenge_completion",
        "daily_login",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    // Integration with your QR system
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
    },
    // For manual activities
    location: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "verified"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ activityType: 1 });
ActivitySchema.index({ qrCodeId: 1 });

// Static method to get activity points mapping
ActivitySchema.statics.getPointsMapping = function () {
  return {
    qr_scan: 0, // Points come from reward
    reward_claim: 0, // Points come from reward
    tree_planting: 100,
    reusable_bags: 30,
    refurbished_electronics: 75,
    renewable_energy: 80,
    recycling: 40,
    energy_saving: 60,
    transport: 35,
    education: 90,
    challenge_completion: 150,
    daily_login: 10,
  };
};

module.exports = mongoose.model("Activity", ActivitySchema);
