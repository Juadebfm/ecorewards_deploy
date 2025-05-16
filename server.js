const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./src/middleware/error.middleware");
const authRoutes = require("./src/routes/auth.routes");
const clerkRoutes = require("./src/routes/clerk.routes");
const { swaggerDocs } = require("./swagger");

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require("./src/config/db");

// Initialize Express app
const app = express();

// ===== MIDDLEWARE SECTION =====

// 1. Basic middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// 2. Security middleware
// CORS configuration - more permissive for development
app.use(
  cors({
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Allow cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

// 3. Logging middleware (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 4. Database connection middleware
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

// 5. Set up Swagger documentation
swaggerDocs(app);

// ===== ROUTES SECTION =====

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Eco Rewards API" });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth/clerk", clerkRoutes);

// ===== ERROR HANDLING SECTION =====

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON Parse Error:", err.message);
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
  }
  next(err);
});

// General error handler - must be last
app.use(errorHandler);

// ===== SERVER STARTUP SECTION =====

// Start server in non-production environments
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
} else {
  // In production, Vercel will handle the server startup
  console.log("Server configured for production");
}

// Export the Express app for serverless use
module.exports = app;
