const express = require("express");
const router = express.Router();

const {
  addSleepRecord,
  getMySleepRecords,
  getSleepSummary
} = require("../controllers/sleepController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addSleepRecord);
router.get("/", protect, getMySleepRecords);
router.get("/summary", protect, getSleepSummary);

module.exports = router;