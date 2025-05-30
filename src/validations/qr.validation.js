const Joi = require("joi");

// Generate single QR code validation
const generateQRCodeValidation = (data) => {
  const schema = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Partner ID is required",
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    rewardId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Reward ID is required",
        "string.pattern.base": "Reward ID must be a valid MongoDB ObjectId",
      }),

    location: Joi.object({
      name: Joi.string().max(200).optional().messages({
        "string.max": "Location name cannot exceed 200 characters",
      }),

      address: Joi.string().max(500).optional().messages({
        "string.max": "Address cannot exceed 500 characters",
      }),

      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional().messages({
          "number.min": "Latitude must be between -90 and 90",
          "number.max": "Latitude must be between -90 and 90",
        }),

        longitude: Joi.number().min(-180).max(180).optional().messages({
          "number.min": "Longitude must be between -180 and 180",
          "number.max": "Longitude must be between -180 and 180",
        }),
      }).optional(),
    }).optional(),

    notes: Joi.string().max(1000).optional().messages({
      "string.max": "Notes cannot exceed 1000 characters",
    }),
  });

  return schema.validate(data);
};

// Generate bulk QR codes validation
const generateBulkQRCodesValidation = (data) => {
  const schema = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Partner ID is required",
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    rewardId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Reward ID is required",
        "string.pattern.base": "Reward ID must be a valid MongoDB ObjectId",
      }),

    quantity: Joi.number().integer().min(1).max(100).required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be a whole number",
      "number.min": "Quantity must be at least 1",
      "number.max": "Cannot generate more than 100 QR codes at once",
      "any.required": "Quantity is required",
    }),

    batchId: Joi.string().max(100).optional().messages({
      "string.max": "Batch ID cannot exceed 100 characters",
    }),

    locations: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().max(200).optional().messages({
            "string.max": "Location name cannot exceed 200 characters",
          }),

          address: Joi.string().max(500).optional().messages({
            "string.max": "Address cannot exceed 500 characters",
          }),

          coordinates: Joi.object({
            latitude: Joi.number().min(-90).max(90).optional().messages({
              "number.min": "Latitude must be between -90 and 90",
              "number.max": "Latitude must be between -90 and 90",
            }),

            longitude: Joi.number().min(-180).max(180).optional().messages({
              "number.min": "Longitude must be between -180 and 180",
              "number.max": "Longitude must be between -180 and 180",
            }),
          }).optional(),
        })
      )
      .max(100)
      .optional()
      .messages({
        "array.max": "Cannot provide more than 100 locations",
      }),
  });

  return schema.validate(data);
};

// QR code query parameters validation
const getQRCodesQueryValidation = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
    rewardId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
    batchId: Joi.string().max(100).optional(),
    isActive: Joi.string().valid("true", "false").optional(),
    sortBy: Joi.string()
      .valid("createdAt", "scanCount", "successfulClaims", "lastScannedAt")
      .optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
  });

  return schema.validate(data);
};

// Location-based QR search validation
const locationSearchValidation = (data) => {
  const schema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required().messages({
      "number.base": "Latitude must be a number",
      "number.min": "Latitude must be between -90 and 90",
      "number.max": "Latitude must be between -90 and 90",
      "any.required": "Latitude is required for location search",
    }),

    longitude: Joi.number().min(-180).max(180).required().messages({
      "number.base": "Longitude must be a number",
      "number.min": "Longitude must be between -180 and 180",
      "number.max": "Longitude must be between -180 and 180",
      "any.required": "Longitude is required for location search",
    }),

    radiusInKm: Joi.number().min(0.1).max(100).default(10).messages({
      "number.base": "Radius must be a number",
      "number.min": "Radius must be at least 0.1 km",
      "number.max": "Radius cannot exceed 100 km",
    }),

    limit: Joi.number().integer().min(1).max(50).default(20),
  });

  return schema.validate(data);
};

// QR code parameter validation (for routes like /:qrId)
const qrCodeParamValidation = (data) => {
  const schema = Joi.object({
    qrId: Joi.string()
      .pattern(/^qr_[a-zA-Z0-9\-]{36}$/)
      .required()
      .messages({
        "string.empty": "QR code ID is required",
        "string.pattern.base":
          "Invalid QR code format. Must be in format: qr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      }),
  });

  return schema.validate(data);
};

// Batch ID parameter validation
const batchIdParamValidation = (data) => {
  const schema = Joi.object({
    batchId: Joi.string().min(1).max(100).required().messages({
      "string.empty": "Batch ID is required",
      "string.max": "Batch ID cannot exceed 100 characters",
    }),
  });

  return schema.validate(data);
};

// Top performing QR codes query validation
const topPerformingQueryValidation = (data) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be a whole number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),

    metric: Joi.string()
      .valid("scans", "claims", "conversion")
      .default("claims")
      .messages({
        "any.only": "Metric must be one of: scans, claims, conversion",
      }),

    period: Joi.string()
      .valid("7d", "30d", "90d", "all")
      .default("all")
      .messages({
        "any.only": "Period must be one of: 7d, 30d, 90d, all",
      }),
  });

  return schema.validate(data);
};

module.exports = {
  generateQRCodeValidation,
  generateBulkQRCodesValidation,
  getQRCodesQueryValidation,
  locationSearchValidation,
  qrCodeParamValidation,
  batchIdParamValidation,
  topPerformingQueryValidation,
};
