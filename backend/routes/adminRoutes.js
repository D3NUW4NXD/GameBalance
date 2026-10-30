const express = require("express");
const router = express.Router();

const {
  getAdminSummary,
  getAllUsers,
  getHighRiskUsers,
  getAllAlerts,
  getAdminAnalytics,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/summary", protect, adminOnly, getAdminSummary);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/high-risk-users", protect, adminOnly, getHighRiskUsers);
router.get("/alerts", protect, adminOnly, getAllAlerts);
router.get("/analytics", protect, adminOnly, getAdminAnalytics);

module.exports = router;