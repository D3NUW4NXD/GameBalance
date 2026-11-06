
const express = require("express");
const router = express.Router();

const {
  generateRiskReport,
  getRiskReports,
  getAlerts,
  getWeeklyWellnessReport,
} = require("../controllers/analysisController");

const { protect } = require("../middleware/authMiddleware");

const {
  emailWeeklyWellnessReport,
} = require("../controllers/reportEmailController");

// Existing risk and analysis APIs
router.post("/generate", protect, generateRiskReport);
router.get("/reports", protect, getRiskReports);
router.get("/alerts", protect, getAlerts);

// Existing weekly wellness report
router.get(
  "/weekly-report",
  protect,
  getWeeklyWellnessReport
);

// NEW: Send report to logged-in user's email
router.post(
  "/weekly-report/email",
  protect,
  emailWeeklyWellnessReport
);

module.exports = router;
