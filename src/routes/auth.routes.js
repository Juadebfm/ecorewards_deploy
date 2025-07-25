const express = require("express");
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  refreshToken,
  logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// @route   POST /api/v1/auth/register
router.post("/register", register);

// @route   GET /api/v1/auth/verify-email/:token
router.get("/verify-email/:token", verifyEmail);

// @route   POST /api/v1/auth/resend-verification
router.post("/resend-verification", resendVerification);

// @route   POST /api/v1/auth/login
router.post("/login", login);

// @route   GET /api/v1/auth/me
router.get("/me", protect, getMe);

// @route   POST /api/v1/auth/refresh-token
router.post("/refresh-token", refreshToken);

// @route   GET /api/v1/auth/logout
router.get("/logout", protect, logout);

module.exports = router;
