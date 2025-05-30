const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         clerkId:
 *           type: string
 *           description: Unique identifier from Clerk authentication service
 *         name:
 *           type: string
 *           description: User's full name (max 50 characters)
 *         email:
 *           type: string
 *           format: email
 *           description: User's unique email address
 *         password:
 *           type: string
 *           description: User's hashed password (optional for social logins)
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: User's role in the system
 *         points:
 *           type: number
 *           default: 0
 *           description: Eco points earned by the user
 *         ecoLevel:
 *           type: string
 *           enum: [beginner, intermediate, advanced, expert, leader]
 *           default: beginner
 *           description: User's ecological expertise level based on points
 *         claimedRewards:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               rewardId:
 *                 type: string
 *                 description: Reference to claimed reward
 *               qrCodeId:
 *                 type: string
 *                 description: Reference to QR code used
 *               pointsAwarded:
 *                 type: number
 *                 description: Points received for this claim
 *               claimedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the reward was claimed
 *           description: Array of rewards claimed by the user
 *         referralCode:
 *           type: string
 *           description: Unique referral code for the user
 *         resetPasswordToken:
 *           type: string
 *           description: Token for password reset functionality
 *         resetPasswordExpire:
 *           type: string
 *           format: date-time
 *           description: Expiration time for password reset token
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was last updated
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         clerkId: user_2JHd72jd82j2d
 *         role: user
 *         points: 275
 *         ecoLevel: advanced
 *         claimedRewards: []
 *         referralCode: "ECO_JOHN123"
 *         createdAt: "2025-05-10T15:46:51.778Z"
 *         updatedAt: "2025-05-16T09:32:27.544Z"
 */

const UserSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      // Make password optional for social logins
      required: false,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    points: {
      type: Number,
      default: 0,
    },
    ecoLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert", "leader"],
      default: "beginner",
    },
    claimedRewards: [
      {
        rewardId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Reward",
        },
        qrCodeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "QRCode",
        },
        pointsAwarded: Number,
        claimedAt: Date,
      },
    ],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        return `ECO_${this.name
          .toUpperCase()
          .replace(/\s+/g, "")
          .substring(0, 4)}${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Add index for claimed rewards for better query performance
UserSchema.index({ "claimedRewards.rewardId": 1 });

// Encrypt password only if it exists
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update eco level based on points
UserSchema.methods.updateEcoLevel = function () {
  const points = this.points;

  if (points >= 1000) {
    this.ecoLevel = "leader";
  } else if (points >= 500) {
    this.ecoLevel = "expert";
  } else if (points >= 250) {
    this.ecoLevel = "advanced";
  } else if (points >= 100) {
    this.ecoLevel = "intermediate";
  } else {
    this.ecoLevel = "beginner";
  }

  return this.ecoLevel;
};

// Get user's claim count for a specific reward
UserSchema.methods.getClaimCountForReward = function (rewardId) {
  return this.claimedRewards.filter(
    (claim) => claim.rewardId.toString() === rewardId.toString()
  ).length;
};

// Check if user has claimed a specific QR code
UserSchema.methods.hasClaimedQRCode = function (qrCodeId) {
  return this.claimedRewards.some(
    (claim) => claim.qrCodeId.toString() === qrCodeId.toString()
  );
};

// Get user's total rewards claimed
UserSchema.methods.getTotalRewardsClaimed = function () {
  return this.claimedRewards.length;
};

// Get user's recent claims
UserSchema.methods.getRecentClaims = function (limit = 5) {
  return this.claimedRewards
    .sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt))
    .slice(0, limit);
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
