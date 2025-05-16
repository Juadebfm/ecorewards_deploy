const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");
const {
  registerValidation,
  loginValidation,
} = require("../validations/auth.validation");
const User = require("../models/user.model");
const { sendTokenResponse } = require("../utils/tokenUtils");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // Validate request
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      error: "User already exists",
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Send token response
  return sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  // Validate request
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  // Send token response
  return sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  console.log("Processing refresh token request");
  console.log("Request body:", typeof req.body, req.body);

  try {
    // Get refresh token from request
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No refresh token provided",
      });
    }

    console.log("Token received:", token.substring(0, 10) + "...");

    try {
      // Verify refresh token
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      console.log("Token verified, user id:", decoded.id);

      // Find the user
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User not found",
        });
      }

      // Generate new access token
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "1h",
      });

      // Return the new access token
      return res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }
  } catch (error) {
    console.error("Error processing refresh token:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Logout user / clear cookies
// @route   GET /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie("refreshToken", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  logout,
};
