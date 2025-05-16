const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./src/middleware/error.middleware");
const authRoutes = require("./src/routes/auth.routes");
const clerkRoutes = require("./src/routes/clerk.routes");

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require("./src/config/db");

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Error handler middleware
app.use(errorHandler);

// Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth/clerk", clerkRoutes);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Eco Rewards API" });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
});

module.exports = server;
