const express = require("express");
const router = express.Router();

// Test 1: Simple route with no imports
router.post("/generate", (req, res) => {
  res.json({
    success: true,
    message: "QR generate works - no middleware",
    body: req.body,
  });
});

module.exports = router;
