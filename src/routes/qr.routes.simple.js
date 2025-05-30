const express = require("express");
const {
  generateQRCode,
} = require("../controllers/qr.controller");
const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/generate", (req, res) => {
  res.json({
    success: true,
    message: "QR generate works with controller imported",
    body: req.body
  });
});

module.exports = router;