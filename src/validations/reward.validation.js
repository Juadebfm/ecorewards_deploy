const Joi = require("joi");

// Create reward validation
const createRewardValidation = (data) => {
  const schema = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Partner ID is required",
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    title: Joi.string().min(5).max(100).required().messages({
      "string.empty": "Reward title is required",
      "string.min": "Reward title must be at least 5 characters long",
      "string.max": "Reward title cannot exceed 100 characters",
    }),

    description: Joi.string().max(1000).optional().messages({
      "string.max": "Description cannot exceed 1000 characters",
    }),

    points: Joi.number().integer().min(1).max(1000).required().messages({
      "number.base": "Points must be a number",
      "number.integer": "Points must be a whole number",
      "number.min": "Points must be at least 1",
      "number.max": "Points cannot exceed 1000 per reward",
      "any.required": "Points are required",
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
      .required()
      .messages({
        "any.only":
          "Category must be one of: recycling, energy-saving, waste-reduction, sustainable-transport, water-conservation, carbon-offset, eco-purchase, other",
        "string.empty": "Category is required",
      }),

    requirements: Joi.string().min(10).max(500).required().messages({
      "string.empty": "Requirements are required",
      "string.min": "Requirements must be at least 10 characters long",
      "string.max": "Requirements cannot exceed 500 characters",
    }),

    actionType: Joi.string()
      .valid(
        "purchase",
        "recycle",
        "participate",
        "survey",
        "check-in",
        "photo-proof",
        "other"
      )
      .required()
      .messages({
        "any.only":
          "Action type must be one of: purchase, recycle, participate, survey, check-in, photo-proof, other",
        "string.empty": "Action type is required",
      }),

    maxClaimsPerUser: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        "number.base": "Max claims per user must be a number",
        "number.integer": "Max claims per user must be a whole number",
        "number.min": "Max claims per user must be at least 1",
        "number.max": "Max claims per user cannot exceed 100",
      }),

    totalMaxClaims: Joi.number()
      .integer()
      .min(1)
      .optional()
      .allow(null)
      .messages({
        "number.base": "Total max claims must be a number",
        "number.integer": "Total max claims must be a whole number",
        "number.min": "Total max claims must be at least 1",
      }),

    expiryDate: Joi.date().greater("now").optional().allow(null).messages({
      "date.greater": "Expiry date must be in the future",
    }),

    priority: Joi.string()
      .valid("low", "medium", "high", "featured")
      .default("medium")
      .messages({
        "any.only": "Priority must be one of: low, medium, high, featured",
      }),

    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional()
      .messages({
        "array.max": "Cannot have more than 10 tags",
        "string.max": "Each tag cannot exceed 50 characters",
      }),

    imageUrl: Joi.string()
      .uri()
      .pattern(/\.(jpg|jpeg|png|gif|svg)$/i)
      .optional()
      .messages({
        "string.uri": "Image URL must be a valid URL",
        "string.pattern.base":
          "Image must be a valid image URL (jpg, jpeg, png, gif, svg)",
      }),
  });

  return schema.validate(data);
};

// Update reward validation
const updateRewardValidation = (data) => {
  const schema = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Partner ID must be a valid MongoDB ObjectId",
      }),

    title: Joi.string().min(5).max(100).optional().messages({
      "string.min": "Reward title must be at least 5 characters long",
      "string.max": "Reward title cannot exceed 100 characters",
    }),

    description: Joi.string().max(1000).optional().messages({
      "string.max": "Description cannot exceed 1000 characters",
    }),

    points: Joi.number().integer().min(1).max(1000).optional().messages({
      "number.base": "Points must be a number",
      "number.integer": "Points must be a whole number",
      "number.min": "Points must be at least 1",
      "number.max": "Points cannot exceed 1000 per reward",
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

    requirements: Joi.string().min(10).max(500).optional().messages({
      "string.min": "Requirements must be at least 10 characters long",
      "string.max": "Requirements cannot exceed 500 characters",
    }),

    actionType: Joi.string()
      .valid(
        "purchase",
        "recycle",
        "participate",
        "survey",
        "check-in",
        "photo-proof",
        "other"
      )
      .optional()
      .messages({
        "any.only":
          "Action type must be one of: purchase, recycle, participate, survey, check-in, photo-proof, other",
      }),

    maxClaimsPerUser: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .messages({
        "number.base": "Max claims per user must be a number",
        "number.integer": "Max claims per user must be a whole number",
        "number.min": "Max claims per user must be at least 1",
        "number.max": "Max claims per user cannot exceed 100",
      }),

    totalMaxClaims: Joi.number()
      .integer()
      .min(1)
      .optional()
      .allow(null)
      .messages({
        "number.base": "Total max claims must be a number",
        "number.integer": "Total max claims must be a whole number",
        "number.min": "Total max claims must be at least 1",
      }),

    expiryDate: Joi.date().greater("now").optional().allow(null).messages({
      "date.greater": "Expiry date must be in the future",
    }),

    isActive: Joi.boolean().optional(),

    priority: Joi.string()
      .valid("low", "medium", "high", "featured")
      .optional()
      .messages({
        "any.only": "Priority must be one of: low, medium, high, featured",
      }),

    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional()
      .messages({
        "array.max": "Cannot have more than 10 tags",
        "string.max": "Each tag cannot exceed 50 characters",
      }),

    imageUrl: Joi.string()
      .uri()
      .pattern(/\.(jpg|jpeg|png|gif|svg)$/i)
      .optional()
      .messages({
        "string.uri": "Image URL must be a valid URL",
        "string.pattern.base":
          "Image must be a valid image URL (jpg, jpeg, png, gif, svg)",
      }),
  });

  return schema.validate(data);
};

// Query parameters validation for getting rewards
const getRewardsQueryValidation = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
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
      .optional(),
    actionType: Joi.string()
      .valid(
        "purchase",
        "recycle",
        "participate",
        "survey",
        "check-in",
        "photo-proof",
        "other"
      )
      .optional(),
    isActive: Joi.string().valid("true", "false").optional(),
    priority: Joi.string()
      .valid("low", "medium", "high", "featured")
      .optional(),
    featured: Joi.string().valid("true", "false").optional(),
    minPoints: Joi.number().integer().min(1).optional(),
    maxPoints: Joi.number().integer().min(1).optional(),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string()
      .valid("createdAt", "points", "priority", "title", "currentClaims")
      .optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
    includeInactive: Joi.string().valid("true", "false").optional(),
  });

  return schema.validate(data);
};

module.exports = {
  createRewardValidation,
  updateRewardValidation,
  getRewardsQueryValidation,
};
