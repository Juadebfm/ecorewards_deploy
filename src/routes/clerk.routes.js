const express = require("express");
const { syncUserData, getMe } = require("../controllers/clerk.controller");
const { requireAuth, syncUser } = require("../middleware/clerk.middleware");

const router = express.Router();

// All routes use Clerk authentication
router.use(requireAuth);
router.use(syncUser);

router.post("/sync", syncUserData);
router.get("/me", getMe);

module.exports = router;
