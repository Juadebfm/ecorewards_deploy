// Test 1: Just the basic requires
const asyncHandler = require("express-async-handler");

// Test generateQRCode function without model dependencies
const generateQRCode = asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    message: "Simple QR controller works",
    data: {
      test: "QR controller working without models",
    },
  });
});

module.exports = {
  generateQRCode,
};
