const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./src/middleware/error.middleware");

// Load environment variables first
dotenv.config();

// Import database connection
const connectDB = require("./src/config/db");

// Initialize Express app
const app = express();

console.log("🐛 Starting server with debugging...");

// ===== MIDDLEWARE SECTION =====
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Database middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({
      success: false,
      error: "Database connection failed",
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Eco Rewards API",
    version: "1.0.0",
  });
});

// ===== ROUTE MOUNTING WITH DEBUGGING =====

console.log("🐛 Loading auth routes...");
try {
  const authRoutes = require("./src/routes/auth.routes");
  app.use("/api/v1/auth", authRoutes);
  console.log("✅ Auth routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading auth routes:", error.message);
}

console.log("🐛 Loading clerk routes...");
try {
  const clerkRoutes = require("./src/routes/clerk.routes");
  app.use("/api/v1/auth/clerk", clerkRoutes);
  console.log("✅ Clerk routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading clerk routes:", error.message);
}

console.log("🐛 Loading partner routes...");
try {
  const partnerRoutes = require("./src/routes/partner.routes");
  app.use("/api/v1/partners", partnerRoutes);
  console.log("✅ Partner routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading partner routes:", error.message);
}

console.log("🐛 Loading reward routes...");
try {
  const rewardRoutes = require("./src/routes/reward.routes");
  app.use("/api/v1/rewards", rewardRoutes);
  console.log("✅ Reward routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading reward routes:", error.message);
}

console.log("🐛 Loading QR routes...");
try {
  const qrRoutes = require("./src/routes/qr.routes");
  app.use("/api/v1/qr", qrRoutes);
  console.log("✅ QR routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading QR routes:", error.message);
  console.error("❌ QR routes error details:", error);
}

console.log("🐛 Loading claim routes...");
try {
  const claimRoutes = require("./src/routes/claim.routes");
  app.use("/api/v1/claim", claimRoutes);
  console.log("✅ Claim routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading claim routes:", error.message);
}

// Status route
app.get("/api/v1/status", (req, res) => {
  res.json({
    success: true,
    message: "Eco Rewards API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handlers
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
  }
  next(err);
});

app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

  process.on("unhandledRejection", (err) => {
    console.error(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
