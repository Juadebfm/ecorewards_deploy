const express = require("express");
const { generateQRCode } = require("../controllers/qr.controller.simple");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/generate", protect, authorize("admin"), generateQRCode);

module.exports = router;
