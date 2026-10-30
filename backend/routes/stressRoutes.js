const express = require("express");
const router = express.Router();

const {
  getStressQuestions,
  submitStressAssessment,
  getMyStressAssessments,
  getStressSummary
} = require("../controllers/stressController");

const { protect } = require("../middleware/authMiddleware");

router.get("/questions", protect, getStressQuestions);
router.post("/submit", protect, submitStressAssessment);
router.get("/", protect, getMyStressAssessments);
router.get("/summary", protect, getStressSummary);

module.exports = router;