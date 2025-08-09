const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const QRCodeSchema = new mongoose.Schema(
  {
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
    qrCode: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return `qr_${uuidv4()}`;
      },
    },
    batchId: {
      type: String,
      trim: true,
      index: true,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: [0, "Scan count cannot be negative"],
    },
    uniqueScans: {
      type: Number,
      default: 0,
      min: [0, "Unique scans cannot be negative"],
    },
    successfulClaims: {
      type: Number,
      default: 0,
      min: [0, "Successful claims cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      name: {
        type: String,
        trim: true,
        maxlength: [200, "Location name cannot be more than 200 characters"],
      },
      address: {
        type: String,
        trim: true,
        maxlength: [500, "Address cannot be more than 500 characters"],
      },
      coordinates: {
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
      },
    },
    lastScannedAt: {
      type: Date,
    },
    lastScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot be more than 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
QRCodeSchema.index({ partnerId: 1, isActive: 1 });
QRCodeSchema.index({ rewardId: 1, isActive: 1 });
QRCodeSchema.index({ scanCount: -1 });
QRCodeSchema.index({ lastScannedAt: -1 });
// For geospatial queries
QRCodeSchema.index({ "location.coordinates": "2dsphere" });

// Virtual for calculating conversion rate (successful claims / scans)
QRCodeSchema.virtual("conversionRate").get(function () {
  if (this.scanCount === 0) return 0;
  return ((this.successfulClaims / this.scanCount) * 100).toFixed(2);
});

// Virtual for generating the frontend URL
QRCodeSchema.virtual("scanUrl").get(function () {
  let baseUrl;

  if (process.env.NODE_ENV === "production") {
    baseUrl =
      process.env.FRONTEND_URL || "https://eco-rewards-sooty.vercel.app/";
  } else {
    baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  }

  return `${baseUrl}/scan/${this.qrCode}`;
});

// Instance method to record a scan
QRCodeSchema.methods.recordScan = async function (userId = null) {
  this.scanCount += 1;
  this.lastScannedAt = new Date();

  if (userId) {
    this.lastScannedBy = userId;

    // Check if this is a unique scan (new user)
    const RewardClaim = mongoose.model("RewardClaim");
    const existingClaim = await RewardClaim.findOne({
      qrCodeId: this._id,
      userId: userId,
    });

    if (!existingClaim) {
      this.uniqueScans += 1;
    }
  }

  // Update partner's total scans
  const Partner = mongoose.model("Partner");
  await Partner.findByIdAndUpdate(this.partnerId, {
    $inc: { totalScans: 1 },
  });

  return await this.save();
};

// Instance method to record a successful claim
QRCodeSchema.methods.recordSuccessfulClaim = async function () {
  this.successfulClaims += 1;
  return await this.save();
};

// Instance method to check if QR code is valid for scanning
QRCodeSchema.methods.isValidForScanning = async function () {
  if (!this.isActive) return { valid: false, reason: "QR code is inactive" };

  // Check if associated reward is still available
  const Reward = mongoose.model("Reward");
  const reward = await Reward.findById(this.rewardId);

  if (!reward) return { valid: false, reason: "Associated reward not found" };
  if (!reward.isActive) return { valid: false, reason: "Reward is inactive" };
  if (reward.isExpired) return { valid: false, reason: "Reward has expired" };
  if (reward.isMaxedOut)
    return { valid: false, reason: "Reward has reached maximum claims" };

  // Check if associated partner is still active
  const Partner = mongoose.model("Partner");
  const partner = await Partner.findById(this.partnerId);

  if (!partner) return { valid: false, reason: "Associated partner not found" };
  if (!partner.isEligibleForRewards())
    return { valid: false, reason: "Partner is not eligible" };

  return { valid: true, reason: "QR code is valid" };
};

// Static method to generate bulk QR codes
QRCodeSchema.statics.generateBulkQRCodes = async function (
  partnerId,
  rewardId,
  quantity,
  batchId = null
) {
  if (!batchId) {
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "_");
    batchId = `batch_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
  }

  const qrCodes = [];
  for (let i = 0; i < quantity; i++) {
    qrCodes.push({
      partnerId,
      rewardId,
      batchId,
      qrCode: `qr_${uuidv4()}`,
    });
  }

  return await this.insertMany(qrCodes);
};

// Static method to get QR codes by batch
QRCodeSchema.statics.getQRCodesByBatch = function (batchId) {
  return this.find({ batchId })
    .populate("partnerId", "name")
    .populate("rewardId", "title points")
    .sort({ createdAt: -1 });
};

// Static method to get top performing QR codes
QRCodeSchema.statics.getTopPerformingQRCodes = function (limit = 10) {
  return this.find({ isActive: true })
    .populate("partnerId", "name")
    .populate("rewardId", "title points")
    .sort({ successfulClaims: -1, scanCount: -1 })
    .limit(limit);
};

// Static method to find QR codes by location
QRCodeSchema.statics.findByLocation = function (
  latitude,
  longitude,
  radiusInKm = 10
) {
  return this.find({
    isActive: true,
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInKm * 1000, // Convert km to meters
      },
    },
  })
    .populate("partnerId", "name logo")
    .populate("rewardId", "title points category");
};

module.exports =
  mongoose.models.QRCode || mongoose.model("QRCode", QRCodeSchema);
