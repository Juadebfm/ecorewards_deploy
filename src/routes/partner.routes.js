const express = require("express");
const {
  createPartner,
  getAllPartners,
  getActivePartners,
  getPartner,
  updatePartner,
  deletePartner,
  verifyPartner,
  togglePartnerStatus,
  getPartnerStats,
} = require("../controllers/partner.controller");

// Import middleware
const {
  protect,
  authorize,
  optionalAuth,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/active", getActivePartners);

// Mixed access routes (public can see verified partners, admin can see all)
router.get("/:id", optionalAuth, getPartner);

// Protected routes (Admin only)
router.post("/", protect, authorize("admin"), createPartner);
router.get("/", protect, authorize("admin"), getAllPartners);
router.put("/:id", protect, authorize("admin"), updatePartner);
router.delete("/:id", protect, authorize("admin"), deletePartner);

// Partner management operations (Admin only)
router.put("/:id/verify", protect, authorize("admin"), verifyPartner);
router.put(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  togglePartnerStatus
);
router.get("/:id/stats", protect, authorize("admin"), getPartnerStats);

module.exports = router;
