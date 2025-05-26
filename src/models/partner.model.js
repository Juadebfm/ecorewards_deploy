const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Partner:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - contactPerson
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Partner company name (max 100 characters)
 *         email:
 *           type: string
 *           format: email
 *           description: Partner's contact email address
 *         logo:
 *           type: string
 *           description: URL to partner's logo image
 *         description:
 *           type: string
 *           description: Brief description of partner's eco-friendly initiatives
 *         website:
 *           type: string
 *           description: Partner's website URL
 *         contactPerson:
 *           type: string
 *           description: Name of primary contact person
 *         contactPhone:
 *           type: string
 *           description: Partner's contact phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             zipCode:
 *               type: string
 *         category:
 *           type: string
 *           enum: [recycling, renewable-energy, sustainable-products, carbon-offset, water-conservation, waste-reduction, other]
 *           description: Type of eco-friendly initiative
 *         verificationStatus:
 *           type: string
 *           enum: [pending, verified, rejected]
 *           default: pending
 *           description: Partner verification status
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether partner is currently active
 *         totalRewards:
 *           type: number
 *           default: 0
 *           description: Total number of rewards created by this partner
 *         totalScans:
 *           type: number
 *           default: 0
 *           description: Total number of QR code scans across all partner rewards
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           description: When partner joined the platform
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the partner was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the partner was last updated
 *       example:
 *         name: "GreenTech Solutions"
 *         email: "contact@greentech.com"
 *         contactPerson: "Sarah Johnson"
 *         category: "renewable-energy"
 *         verificationStatus: "verified"
 *         description: "Leading provider of solar panel solutions for residential and commercial use"
 *         website: "https://greentech.com"
 */

const PartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a partner name"],
      trim: true,
      maxlength: [100, "Partner name cannot be more than 100 characters"],
      unique: true,
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
    logo: {
      type: String,
      match: [
        /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i,
        "Please provide a valid image URL",
      ],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
      trim: true,
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+\..+/, "Please provide a valid website URL"],
    },
    contactPerson: {
      type: String,
      required: [true, "Please add a contact person name"],
      trim: true,
      maxlength: [
        100,
        "Contact person name cannot be more than 100 characters",
      ],
    },
    contactPhone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, "Please provide a valid phone number"],
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
    },
    category: {
      type: String,
      enum: [
        "recycling",
        "renewable-energy",
        "sustainable-products",
        "carbon-offset",
        "water-conservation",
        "waste-reduction",
        "other",
      ],
      required: [true, "Please select a category"],
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalRewards: {
      type: Number,
      default: 0,
    },
    totalScans: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PartnerSchema.index({ email: 1 });
PartnerSchema.index({ verificationStatus: 1, isActive: 1 });
PartnerSchema.index({ category: 1 });
// For text search
PartnerSchema.index({ name: "text", description: "text" }); 

// Instance method to check if partner is verified and active
PartnerSchema.methods.isEligibleForRewards = function () {
  return this.verificationStatus === "verified" && this.isActive;
};

// Instance method to increment total scans
PartnerSchema.methods.incrementScans = async function () {
  this.totalScans += 1;
  return await this.save();
};

// Instance method to increment total rewards
PartnerSchema.methods.incrementRewards = async function () {
  this.totalRewards += 1;
  return await this.save();
};

// Static method to get verified and active partners
PartnerSchema.statics.getActivePartners = function () {
  return this.find({
    verificationStatus: "verified",
    isActive: true,
  }).sort({ name: 1 });
};

// Static method to get partners by category
PartnerSchema.statics.getPartnersByCategory = function (category) {
  return this.find({
    category,
    verificationStatus: "verified",
    isActive: true,
  }).sort({ totalScans: -1 });
};

module.exports = mongoose.model("Partner", PartnerSchema);
