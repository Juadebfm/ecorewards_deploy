const express = require("express");
const { syncUserData, getMe } = require("../controllers/clerk.controller");
const { requireAuth, syncUser } = require("../middleware/clerk.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ClerkAuth
 *   description: Clerk authentication integration endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     clerkAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Clerk JWT token for authentication
 */

// All routes use Clerk authentication
router.use(requireAuth);
router.use(syncUser);

/**
 * @swagger
 * /api/v1/auth/clerk/sync:
 *   post:
 *     summary: Synchronize Clerk user data
 *     description: Syncs user data from Clerk with the application database
 *     tags: [ClerkAuth]
 *     security:
 *       - clerkAuth: []
 *     responses:
 *       200:
 *         description: User data synchronized successfully
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
 *         description: Not authorized - Invalid Clerk token
 *       404:
 *         description: User not found in Clerk
 *       500:
 *         description: Server error during synchronization
 */
router.post("/sync", syncUserData);

/**
 * @swagger
 * /api/v1/auth/clerk/me:
 *   get:
 *     summary: Get current Clerk user profile
 *     description: Retrieves the profile of the currently authenticated Clerk user
 *     tags: [ClerkAuth]
 *     security:
 *       - clerkAuth: []
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
 *         description: Not authorized - Invalid Clerk token
 *       404:
 *         description: User not found in database
 */
router.get("/me", getMe);

module.exports = router;
