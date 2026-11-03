
const express = require("express");
const router = express.Router();

const {
  getAdminSummary,
  getAllUsers,
  getHighRiskUsers,
  getAllAlerts,
  getAdminAnalytics,
} = require("../controllers/adminController");

const {
  createAdmin,
  updateUserRole,
} = require("../controllers/superAdminController");

const {
  protect,
  adminOnly,
  superAdminOnly,
} = require("../middleware/authMiddleware");

// All routes require ADMIN or SUPER_ADMIN.
router.use(protect, adminOnly);

// Existing Admin Dashboard
router.get("/summary", getAdminSummary);
router.get("/users", getAllUsers);
router.get("/high-risk-users", getHighRiskUsers);
router.get("/alerts", getAllAlerts);
router.get("/analytics", getAdminAnalytics);

// SUPER_ADMIN ONLY
router.post(
  "/staff",
  superAdminOnly,
  createAdmin
);

router.patch(
  "/users/:userId/role",
  superAdminOnly,
  updateUserRole
);

module.exports = router;
