const express = require("express");
const router = express.Router();

const {
  addGamingSession,
  getMyGamingSessions,
  getGamingSummary
} = require("../controllers/gamingController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addGamingSession);
router.get("/", protect, getMyGamingSessions);
router.get("/summary", protect, getGamingSummary);

module.exports = router;