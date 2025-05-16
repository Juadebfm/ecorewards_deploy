const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const User = require("../models/user.model");
const asyncHandler = require("express-async-handler");

// Clerk authentication middleware
const requireAuth = ClerkExpressRequireAuth();

// Custom middleware to sync Clerk user with our database
const syncUser = asyncHandler(async (req, res, next) => {
  // Clerk user is available in req.auth
  if (!req.auth) {
    return next();
  }

  const { userId, sessionId } = req.auth;

  // Find user in our database
  let user = await User.findOne({ clerkId: userId });

  // If user doesn't exist, create a new one
  if (!user) {
    user = await User.create({
      clerkId: userId,
      name: req.auth.name || "New User",
      email: req.auth.email || "unknown@example.com",
      password:
        Math.random().toString(36).substring(2) + Date.now().toString(36),
      // Default values
      role: "user",
      points: 0,
      ecoLevel: "beginner",
    });
  }

  // Set user in request object
  req.user = user;
  next();
});

module.exports = { requireAuth, syncUser };
