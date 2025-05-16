const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./src/middleware/error.middleware");
const authRoutes = require("./src/routes/auth.routes");
const clerkRoutes = require("./src/routes/clerk.routes");
const { swaggerDocs } = require("./swagger");

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require("./src/config/db");

// Create Express app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security HTTP headers
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

// Set up Swagger docs
swaggerDocs(app);

// Add middleware to ensure database connection before processing requests
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

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth/clerk", clerkRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Eco Rewards API" });
});

// Error handler middleware - after routes
app.use(errorHandler);

// Only start the server when running directly (not in serverless)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

// Export the Express app for serverless use
module.exports = app;
