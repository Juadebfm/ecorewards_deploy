const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");

// @desc    Sync user data from Clerk
// @route   POST /api/v1/auth/clerk/sync
// @access  Private (via Clerk)
const syncUserData = asyncHandler(async (req, res) => {
  // User is already set in req.user by syncUser middleware

  // Optionally update user data from request body
  if (req.body.name) {
    req.user.name = req.body.name;
  }

  if (req.body.email) {
    req.user.email = req.body.email;
  }

  // Save any changes
  await req.user.save();

  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// @desc    Get current authenticated user
// @route   GET /api/v1/auth/clerk/me
// @access  Private (via Clerk)
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = {
  syncUserData,
  getMe,
};
