// In a new file: src/utils/tokenUtils.js
const jwt = require("jsonwebtoken");

// Create token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Create refresh token with longer expiry
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// Helper to send tokens in response
const sendTokenResponse = (user, statusCode, res) => {
  // Create tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // Send cookies
  res.cookie("token", token, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Standardize user data response
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
    ecoLevel: user.ecoLevel,
  };

  // Send response
  return res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: userData,
  });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  sendTokenResponse,
};
