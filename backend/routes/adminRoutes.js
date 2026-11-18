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
  listUsers,
  createUser,
  updateBan,
  deleteUser,
} = require("../controllers/userManagementController");

const {
  protect,
  adminOnly,
  superAdminOnly,
} = require("../middleware/authMiddleware");

// All admin routes require login and ADMIN access
router.use(protect, adminOnly);

// =====================================
// EXISTING ADMIN DASHBOARD
// =====================================

router.get("/summary", getAdminSummary);

router.get("/users", getAllUsers);

router.get("/high-risk-users", getHighRiskUsers);

router.get("/alerts", getAllAlerts);

router.get("/analytics", getAdminAnalytics);

// =====================================
// EXISTING SUPER ADMIN MANAGEMENT
// =====================================

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

// =====================================
// NEW SUPER ADMIN USER MANAGEMENT
// =====================================

// List users
router.get(
  "/manage-users",
  superAdminOnly,
  listUsers
);

// Manually create a USER account
router.post(
  "/manage-users",
  superAdminOnly,
  createUser
);

// Temporary ban, permanent ban, or unban
router.patch(
  "/manage-users/:userId/ban",
  superAdminOnly,
  updateBan
);

// Permanently delete a user
router.delete(
  "/manage-users/:userId",
  superAdminOnly,
  deleteUser
);

module.exports = router;