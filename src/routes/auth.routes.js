const express = require("express");
const {
  register,
  login,
  getMe,
  refreshToken,
  logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         accessToken:
 *           type: string
 *           description: JWT access token for API authentication
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token for obtaining new access tokens
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Email already exists
 */
router.post("/register", register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     description: Retrieves the profile of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized - No token provided
 *       404:
 *         description: User not found
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Get a new access token using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *       401:
 *         description: Invalid or expired refresh token
 *       400:
 *         description: Invalid request format
 */

router.post(
  "/refresh-token",
  (req, res, next) => {
    // Special handling for the refresh token request
    console.log("Refresh token request received, body:", req.body);

    // If body is a string, try to parse it
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
        console.log("Parsed string body:", req.body);
      } catch (e) {
        console.error("Failed to parse string body:", e);
      }
    }

    // If body is empty or doesn't have refreshToken, check for query param
    if (!req.body || !req.body.refreshToken) {
      if (req.query && req.query.refreshToken) {
        req.body = { refreshToken: req.query.refreshToken };
        console.log("Used query param for refreshToken");
      }
    }

    next();
  },
  refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     description: Invalidates the user's session and clears authentication cookies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         description: Not authorized - No token provided
 */
router.get("/logout", protect, logout);

module.exports = router;
