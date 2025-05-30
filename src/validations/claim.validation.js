const Joi = require("joi");

// Claim reward validation
const claimRewardValidation = (data) => {
  const schema = Joi.object({
    qrCodeId: Joi.string()
      .pattern(/^qr_[a-zA-Z0-9\-]{36}$/)
      .required()
      .messages({
        "string.empty": "QR code ID is required",
        "string.pattern.base":
          "Invalid QR code format. Must be in format: qr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      }),

    metadata: Joi.object({
      location: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional().messages({
          "number.min": "Latitude must be between -90 and 90",
          "number.max": "Latitude must be between -90 and 90",
        }),

        longitude: Joi.number().min(-180).max(180).optional().messages({
          "number.min": "Longitude must be between -180 and 180",
          "number.max": "Longitude must be between -180 and 180",
        }),

        address: Joi.string().max(200).optional().messages({
          "string.max": "Address cannot exceed 200 characters",
        }),
      }).optional(),

      deviceInfo: Joi.object({
        platform: Joi.string().max(50).optional().messages({
          "string.max": "Platform cannot exceed 50 characters",
        }),

        browser: Joi.string().max(50).optional().messages({
          "string.max": "Browser cannot exceed 50 characters",
        }),
      }).optional(),
    }).optional(),

    verificationData: Joi.object({
      requiresProof: Joi.boolean().default(false),

      proofType: Joi.string()
        .valid("photo", "receipt", "survey", "none")
        .default("none")
        .messages({
          "any.only": "Proof type must be one of: photo, receipt, survey, none",
        }),

      proofUrl: Joi.string().uri().optional().messages({
        "string.uri": "Proof URL must be a valid URL",
      }),
    }).optional(),
  });

  return schema.validate(data);
};

// Get user claim history validation
const getUserClaimHistoryValidation = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    category: Joi.string()
      .valid(
        "recycling",
        "energy-saving",
        "waste-reduction",
        "sustainable-transport",
        "water-conservation",
        "carbon-offset",
        "eco-purchase",
        "other"
      )
      .optional()
      .messages({
        "any.only":
          "Category must be one of: recycling, energy-saving, waste-reduction, sustainable-transport, water-conservation, carbon-offset, eco-purchase, other",
      }),

    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    startDate: Joi.date().optional().messages({
      "date.base": "Start date must be a valid date",
    }),

    endDate: Joi.date().greater(Joi.ref("startDate")).optional().messages({
      "date.base": "End date must be a valid date",
      "date.greater": "End date must be after start date",
    }),

    sortBy: Joi.string()
      .valid("claimedAt", "pointsAwarded")
      .default("claimedAt")
      .messages({
        "any.only": "Sort by must be one of: claimedAt, pointsAwarded",
      }),

    sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
      "any.only": "Sort order must be either 'asc' or 'desc'",
    }),
  });

  return schema.validate(data);
};

// Get all claims validation (Admin)
const getAllClaimsValidation = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    status: Joi.string()
      .valid("pending", "completed", "failed", "reversed")
      .optional()
      .messages({
        "any.only":
          "Status must be one of: pending, completed, failed, reversed",
      }),

    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "User ID must be a valid MongoDB ObjectId",
      }),

    rewardId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Reward ID must be a valid MongoDB ObjectId",
      }),

    claimMethod: Joi.string()
      .valid("qr-scan", "manual", "bulk-import", "referral")
      .optional()
      .messages({
        "any.only":
          "Claim method must be one of: qr-scan, manual, bulk-import, referral",
      }),

    startDate: Joi.date().optional().messages({
      "date.base": "Start date must be a valid date",
    }),

    endDate: Joi.date().greater(Joi.ref("startDate")).optional().messages({
      "date.base": "End date must be a valid date",
      "date.greater": "End date must be after start date",
    }),

    minPoints: Joi.number().integer().min(1).optional(),
    maxPoints: Joi.number().integer().min(1).optional(),

    sortBy: Joi.string()
      .valid("claimedAt", "pointsAwarded", "status", "userId", "partnerId")
      .default("claimedAt")
      .messages({
        "any.only":
          "Sort by must be one of: claimedAt, pointsAwarded, status, userId, partnerId",
      }),

    sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
      "any.only": "Sort order must be either 'asc' or 'desc'",
    }),
  });

  return schema.validate(data);
};

// Reverse claim validation
const reverseClaimValidation = (data) => {
  const schema = Joi.object({
    reason: Joi.string().min(10).max(500).required().messages({
      "string.empty": "Reason for reversal is required",
      "string.min": "Reason must be at least 10 characters long",
      "string.max": "Reason cannot exceed 500 characters",
    }),
  });

  return schema.validate(data);
};

// Leaderboard query validation
const getLeaderboardValidation = (data) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be a whole number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),

    period: Joi.string()
      .valid("all-time", "monthly", "weekly")
      .default("all-time")
      .messages({
        "any.only": "Period must be one of: all-time, monthly, weekly",
      }),

    category: Joi.string()
      .valid(
        "recycling",
        "energy-saving",
        "waste-reduction",
        "sustainable-transport",
        "water-conservation",
        "carbon-offset",
        "eco-purchase",
        "other"
      )
      .optional()
      .messages({
        "any.only":
          "Category must be one of: recycling, energy-saving, waste-reduction, sustainable-transport, water-conservation, carbon-offset, eco-purchase, other",
      }),
  });

  return schema.validate(data);
};

// Claim ID parameter validation
const claimIdParamValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Claim ID is required",
        "string.pattern.base": "Claim ID must be a valid MongoDB ObjectId",
      }),
  });

  return schema.validate(data);
};

// Points summary period validation
const pointsSummaryValidation = (data) => {
  const schema = Joi.object({
    period: Joi.string()
      .valid("7d", "30d", "90d", "all")
      .default("30d")
      .messages({
        "any.only": "Period must be one of: 7d, 30d, 90d, all",
      }),

    includeProjections: Joi.boolean().default(false),
  });

  return schema.validate(data);
};

module.exports = {
  claimRewardValidation,
  getUserClaimHistoryValidation,
  getAllClaimsValidation,
  reverseClaimValidation,
  getLeaderboardValidation,
  claimIdParamValidation,
  pointsSummaryValidation,
};
