const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    // Continue regardless of whether user was found
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
});

module.exports = { protect, authorize, optionalAuth };
