const express = require("express");
const {
  scanQRCode,
  generateQRCode,
  generateBulkQRCodes,
  getQRCodeDetails,
  getQRCodesByBatch,
  toggleQRCodeStatus,
  deleteQRCode,
  getTopPerformingQRCodes,
} = require("../controllers/qr.controller");

// Import middleware
const {
  protect,
  authorize,
  optionalAuth,
} = require("../middleware/auth.middleware");

const router = express.Router();

// SPECIFIC ROUTES FIRST (most specific to least specific)
router.post("/generate", protect, authorize("admin"), generateQRCode);
router.post("/bulk-generate", protect, authorize("admin"), generateBulkQRCodes);
router.get("/details/:qrId", protect, authorize("admin"), getQRCodeDetails);
router.get("/batch/:batchId", protect, authorize("admin"), getQRCodesByBatch);
router.get(
  "/analytics/top-performing",
  protect,
  authorize("admin"),
  getTopPerformingQRCodes
);

// SPECIFIC SCANNING ROUTE
router.get("/scan/:qrId", optionalAuth, scanQRCode);

// QR code management (Admin only) - specific action routes
router.put(
  "/:qrId/toggle-status",
  protect,
  authorize("admin"),
  toggleQRCodeStatus
);
router.delete("/:qrId", protect, authorize("admin"), deleteQRCode);

// REMOVE THIS DUPLICATE/CONFLICTING ROUTE - it's causing the error
// router.get("/:qrId", optionalAuth, scanQRCode);

// If you need a generic route for QR codes, be more specific:
// router.get("/code/:qrId", optionalAuth, scanQRCode);

module.exports = router;