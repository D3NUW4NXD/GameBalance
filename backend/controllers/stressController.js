const db = require("../config/db");

const getStressLevel = (averageScore) => {
  if (averageScore <= 2) {
    return "LOW";
  }

  if (averageScore <= 3.5) {
    return "MODERATE";
  }

  return "HIGH";
};

const getRecommendation = (stressLevel) => {
  if (stressLevel === "LOW") {
    return "Your stress level is low. Continue maintaining balanced gaming habits and healthy routines.";
  }

  if (stressLevel === "MODERATE") {
    return "Your stress level is moderate. Try reducing gaming time, taking breaks, and improving sleep quality.";
  }

  return "Your stress level is high. Reduce long gaming sessions, avoid late-night gaming, and consider speaking with a trusted person if stress continues.";
};

exports.getStressQuestions = async (req, res) => {
  try {
    const [questions] = await db.query(
      `SELECT question_id, question_text, category
       FROM stress_questions
       WHERE is_active = TRUE
       ORDER BY question_id ASC`
    );

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error("Get stress questions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while loading stress questions"
    });
  }
};

exports.submitStressAssessment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.user_id;
    const { assessment_date, answers } = req.body;

    if (!assessment_date || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Assessment date and answers are required"
      });
    }

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one answer is required"
      });
    }

    for (const answer of answers) {
      if (
        !answer.question_id ||
        answer.answer_value < 1 ||
        answer.answer_value > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Each answer must have question_id and answer_value between 1 and 5"
        });
      }
    }

    const totalScore = answers.reduce(
      (sum, answer) => sum + Number(answer.answer_value),
      0
    );

    const averageScore = totalScore / answers.length;
    const stressPercentage = (totalScore / (answers.length * 5)) * 100;
    const stressLevel = getStressLevel(averageScore);
    const recommendation = getRecommendation(stressLevel);

    await connection.beginTransaction();

    const [assessmentResult] = await connection.query(
      `INSERT INTO stress_assessments
       (user_id, assessment_date, total_score, average_score, stress_percentage, stress_level, recommendation)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        assessment_date,
        totalScore,
        averageScore,
        stressPercentage,
        stressLevel,
        recommendation
      ]
    );

    const assessmentId = assessmentResult.insertId;

    for (const answer of answers) {
      await connection.query(
        `INSERT INTO stress_answers
         (assessment_id, question_id, answer_value)
         VALUES (?, ?, ?)`,
        [assessmentId, answer.question_id, answer.answer_value]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Stress assessment submitted successfully",
      result: {
        assessment_id: assessmentId,
        total_score: totalScore,
        average_score: Number(averageScore.toFixed(2)),
        stress_percentage: Number(stressPercentage.toFixed(2)),
        stress_level: stressLevel,
        recommendation
      }
    });
  } catch (error) {
    await connection.rollback();

    console.error("Submit stress assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting stress assessment"
    });
  } finally {
    connection.release();
  }
};

exports.getMyStressAssessments = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [assessments] = await db.query(
      `SELECT *
       FROM stress_assessments
       WHERE user_id = ?
       ORDER BY assessment_date DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (error) {
    console.error("Get stress assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while loading stress assessments"
    });
  }
};

exports.getStressSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [summary] = await db.query(
      `SELECT
          COUNT(*) AS total_assessments,
          COALESCE(ROUND(AVG(average_score), 2), 0) AS average_stress_score,
          COALESCE(ROUND(AVG(stress_percentage), 2), 0) AS average_stress_percentage
       FROM stress_assessments
       WHERE user_id = ?`,
      [userId]
    );

    const [latest] = await db.query(
      `SELECT *
       FROM stress_assessments
       WHERE user_id = ?
       ORDER BY assessment_date DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      summary: summary[0],
      latest_assessment: latest[0] || null
    });
  } catch (error) {
    console.error("Stress summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while loading stress summary"
    });
  }
};