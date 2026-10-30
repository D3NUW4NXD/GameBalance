const express = require("express");
const router = express.Router();

const {
  generateRiskReport,
  getRiskReports,
  getAlerts,
  getWeeklyWellnessReport,
} = require("../controllers/analysisController");

const { protect } = require("../middleware/authMiddleware");

router.post("/generate", protect, generateRiskReport);
router.get("/reports", protect, getRiskReports);
router.get("/alerts", protect, getAlerts);
router.get("/weekly-report", protect, getWeeklyWellnessReport);

module.exports = router;