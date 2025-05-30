const Joi = require("joi");

// create partner validation
const createPartnerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Partner name is required",
      "string.min": "Partner name must be at least 2 characters long",
      "string.max": "Partner name cannot exceed 100 characters",
    }),

    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),

    logo: Joi.string()
      .uri()
      .pattern(/\.(jpg|jpeg|png|gif|svg)$/i)
      .optional()
      .messages({
        "string.uri": "Logo must be a valid URL",
        "string.pattern.base":
          "Logo must be a valid image URL (jpg, jpeg, png, gif, svg)",
      }),

    description: Joi.string().max(500).optional().messages({
      "string.max": "Description cannot exceed 500 characters",
    }),

    website: Joi.string().uri().optional().messages({
      "string.uri": "Website must be a valid URL",
    }),

    contactPerson: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Contact person name is required",
      "string.min": "Contact person name must be at least 2 characters long",
      "string.max": "Contact person name cannot exceed 100 characters",
    }),

    contactPhone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]{10,}$/)
      .optional()
      .messages({
        "string.pattern.base": "Please provide a valid phone number",
      }),

    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
    }).optional(),

    category: Joi.string()
      .valid(
        "recycling",
        "renewable-energy",
        "sustainable-products",
        "carbon-offset",
        "water-conservation",
        "waste-reduction",
        "other"
      )
      .required()
      .messages({
        "any.only":
          "Category must be one of: recycling, renewable-energy, sustainable-products, carbon-offset, water-conservation, waste-reduction, other",
        "string.empty": "Category is required",
      }),
  });

  return schema.validate(data);
};

// Update partner validation (all fields optional except those that need special handling)
const updatePartnerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
      "string.min": "Partner name must be at least 2 characters long",
      "string.max": "Partner name cannot exceed 100 characters",
    }),

    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address",
    }),

    logo: Joi.string()
      .uri()
      .pattern(/\.(jpg|jpeg|png|gif|svg)$/i)
      .optional()
      .messages({
        "string.uri": "Logo must be a valid URL",
        "string.pattern.base":
          "Logo must be a valid image URL (jpg, jpeg, png, gif, svg)",
      }),

    description: Joi.string().max(500).optional().messages({
      "string.max": "Description cannot exceed 500 characters",
    }),

    website: Joi.string().uri().optional().messages({
      "string.uri": "Website must be a valid URL",
    }),

    contactPerson: Joi.string().min(2).max(100).optional().messages({
      "string.min": "Contact person name must be at least 2 characters long",
      "string.max": "Contact person name cannot exceed 100 characters",
    }),

    contactPhone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]{10,}$/)
      .optional()
      .messages({
        "string.pattern.base": "Please provide a valid phone number",
      }),

    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
    }).optional(),

    category: Joi.string()
      .valid(
        "recycling",
        "renewable-energy",
        "sustainable-products",
        "carbon-offset",
        "water-conservation",
        "waste-reduction",
        "other"
      )
      .optional()
      .messages({
        "any.only":
          "Category must be one of: recycling, renewable-energy, sustainable-products, carbon-offset, water-conservation, waste-reduction, other",
      }),

    isActive: Joi.boolean().optional(),

    verificationStatus: Joi.string()
      .valid("pending", "verified", "rejected")
      .optional()
      .messages({
        "any.only":
          "Verification status must be one of: pending, verified, rejected",
      }),
  });

  return schema.validate(data);
};

// Verify partner validation
const verifyPartnerValidation = (data) => {
  const schema = Joi.object({
    verificationStatus: Joi.string()
      .valid("verified", "rejected")
      .required()
      .messages({
        "any.only":
          "Verification status must be either 'verified' or 'rejected'",
        "string.empty": "Verification status is required",
      }),
  });

  return schema.validate(data);
};

// Query parameters validation for getting partners
const getPartnersQueryValidation = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string()
      .valid(
        "recycling",
        "renewable-energy",
        "sustainable-products",
        "carbon-offset",
        "water-conservation",
        "waste-reduction",
        "other"
      )
      .optional(),
    verificationStatus: Joi.string()
      .valid("pending", "verified", "rejected")
      .optional(),
    isActive: Joi.string().valid("true", "false").optional(),
    search: Joi.string().max(100).optional(),
  });

  return schema.validate(data);
};

module.exports = {
  createPartnerValidation,
  updatePartnerValidation,
  verifyPartnerValidation,
  getPartnersQueryValidation,
};
