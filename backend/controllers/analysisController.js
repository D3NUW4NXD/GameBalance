const db = require("../config/db");

const getRiskLevel = (riskScore) => {
  if (riskScore >= 70) {
    return "HIGH";
  }

  if (riskScore >= 40) {
    return "MODERATE";
  }

  return "LOW";
};

const getRiskTrend = (latestScore, previousScore) => {
  if (previousScore === null || previousScore === undefined) {
    return {
      risk_trend: "NEW",
      trend_message:
        "This is the first risk report for the user, so a trend comparison is not available yet.",
    };
  }

  const difference = latestScore - previousScore;

  if (difference >= 10) {
    return {
      risk_trend: "INCREASING",
      trend_message:
        "The latest risk score has increased compared to the previous report. The user may need to reduce gaming time and improve sleep habits.",
    };
  }

  if (difference <= -10) {
    return {
      risk_trend: "IMPROVING",
      trend_message:
        "The latest risk score has reduced compared to the previous report. The user’s gaming and wellness pattern is improving.",
    };
  }

  return {
    risk_trend: "STABLE",
    trend_message:
      "The latest risk score is similar to the previous report. The user should continue monitoring gaming, stress, and sleep habits.",
  };
};

const getRecommendationDetails = (
  gamingAverageHours,
  latestStressPercentage,
  averageSleepHours,
  riskLevel
) => {
  const reasons = [];
  const recommendations = [];

  if (gamingAverageHours >= 4) {
    reasons.push("High average gaming duration");
    recommendations.push(
      "Reduce daily gaming time and take short breaks between sessions."
    );
  }

  if (latestStressPercentage >= 70) {
    reasons.push("High stress percentage");
    recommendations.push(
      "Try relaxation activities and avoid competitive gaming when feeling stressed."
    );
  }

  if (averageSleepHours > 0 && averageSleepHours < 7) {
    reasons.push("Low average sleep duration");
    recommendations.push(
      "Improve sleep routine and avoid late-night gaming."
    );
  }

  if (gamingAverageHours < 4 && latestStressPercentage < 70 && averageSleepHours >= 7) {
    reasons.push("Balanced gaming, stress, and sleep pattern");
    recommendations.push(
      "Current behavior appears balanced. Continue monitoring weekly progress."
    );
  }

  if (recommendations.length === 0) {
    if (riskLevel === "HIGH") {
      recommendations.push(
        "High risk detected. Reduce gaming time, improve sleep, and seek support if stress continues."
      );
    } else if (riskLevel === "MODERATE") {
      recommendations.push(
        "Moderate risk detected. Maintain a healthier balance between gaming, rest, and daily activities."
      );
    } else {
      recommendations.push(
        "Low risk detected. Continue maintaining healthy gaming and sleep habits."
      );
    }
  }

  return {
    recommendation_reason: reasons.join(", "),
    recommendation: recommendations.join(" "),
  };
};

exports.generateRiskReport = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[gamingData]] = await db.query(
      `SELECT 
          IFNULL(AVG(duration_minutes) / 60, 0) AS gaming_average_hours
       FROM gaming_sessions
       WHERE user_id = ?
       AND session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[stressData]] = await db.query(
      `SELECT 
          IFNULL(stress_percentage, 0) AS latest_stress_percentage
       FROM stress_assessments
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const [[sleepData]] = await db.query(
      `SELECT 
          IFNULL(AVG(sleep_duration_hours), 0) AS average_sleep_hours
       FROM sleep_records
       WHERE user_id = ?
       AND sleep_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[previousRisk]] = await db.query(
      `SELECT risk_score
       FROM risk_reports
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const gamingAverageHours = Number(gamingData.gaming_average_hours || 0);
    const latestStressPercentage = Number(
      stressData?.latest_stress_percentage || 0
    );
    const averageSleepHours = Number(sleepData.average_sleep_hours || 0);

    let riskScore = 0;

    if (gamingAverageHours >= 5) {
      riskScore += 35;
    } else if (gamingAverageHours >= 3) {
      riskScore += 25;
    } else if (gamingAverageHours >= 1) {
      riskScore += 10;
    }

    if (latestStressPercentage >= 80) {
      riskScore += 40;
    } else if (latestStressPercentage >= 60) {
      riskScore += 30;
    } else if (latestStressPercentage >= 40) {
      riskScore += 15;
    }

    if (averageSleepHours > 0 && averageSleepHours < 6) {
      riskScore += 25;
    } else if (averageSleepHours >= 6 && averageSleepHours < 7) {
      riskScore += 15;
    }

    if (riskScore > 100) {
      riskScore = 100;
    }

    const riskLevel = getRiskLevel(riskScore);

    const previousScore =
      previousRisk && previousRisk.risk_score !== undefined
        ? Number(previousRisk.risk_score)
        : null;

    const trendDetails = getRiskTrend(riskScore, previousScore);

    const recommendationDetails = getRecommendationDetails(
      gamingAverageHours,
      latestStressPercentage,
      averageSleepHours,
      riskLevel
    );

    const [reportResult] = await db.query(
      `INSERT INTO risk_reports
        (
          user_id,
          report_date,
          gaming_average_hours,
          latest_stress_percentage,
          average_sleep_hours,
          risk_score,
          risk_level,
          recommendation,
          risk_trend,
          recommendation_reason,
          trend_message
        )
       VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        gamingAverageHours,
        latestStressPercentage,
        averageSleepHours,
        riskScore,
        riskLevel,
        recommendationDetails.recommendation,
        trendDetails.risk_trend,
        recommendationDetails.recommendation_reason,
        trendDetails.trend_message,
      ]
    );

    if (riskLevel === "MODERATE" || riskLevel === "HIGH") {
      await db.query(
        `INSERT INTO alerts
          (user_id, alert_type, alert_message, severity)
         VALUES (?, ?, ?, ?)`,
        [
          userId,
          "RISK_ALERT",
          recommendationDetails.recommendation,
          riskLevel,
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: "Risk analysis generated successfully",
      result: {
        risk_id: reportResult.insertId,
        report_date: new Date().toISOString().split("T")[0],
        gaming_average_hours: gamingAverageHours,
        latest_stress_percentage: latestStressPercentage,
        average_sleep_hours: averageSleepHours,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_trend: trendDetails.risk_trend,
        recommendation_reason: recommendationDetails.recommendation_reason,
        trend_message: trendDetails.trend_message,
        recommendation: recommendationDetails.recommendation,
      },
    });
  } catch (error) {
    console.error("Generate risk report error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while generating risk report",
    });
  }
};

exports.getRiskReports = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [reports] = await db.query(
      `SELECT
          risk_id,
          report_date,
          gaming_average_hours,
          latest_stress_percentage,
          average_sleep_hours,
          risk_score,
          risk_level,
          recommendation,
          risk_trend,
          recommendation_reason,
          trend_message,
          created_at
       FROM risk_reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get risk reports error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading risk reports",
    });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [alerts] = await db.query(
      `SELECT
          alert_id,
          alert_type,
          alert_message,
          severity,
          is_read,
          created_at
       FROM alerts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Get alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading alerts",
    });
  }
};

exports.getWeeklyWellnessReport = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[gamingSummary]] = await db.query(
      `SELECT
          COUNT(*) AS total_sessions,
          IFNULL(SUM(duration_minutes), 0) AS total_gaming_minutes,
          IFNULL(ROUND(AVG(duration_minutes) / 60, 2), 0) AS average_gaming_hours
       FROM gaming_sessions
       WHERE user_id = ?
       AND session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[stressSummary]] = await db.query(
      `SELECT
          IFNULL(ROUND(AVG(stress_percentage), 2), 0) AS average_stress_percentage,
          IFNULL(MAX(stress_percentage), 0) AS highest_stress_percentage,
          COUNT(*) AS total_assessments
       FROM stress_assessments
       WHERE user_id = ?
       AND assessment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[sleepSummary]] = await db.query(
      `SELECT
          IFNULL(ROUND(AVG(sleep_duration_hours), 2), 0) AS average_sleep_hours,
          COUNT(*) AS total_sleep_records
       FROM sleep_records
       WHERE user_id = ?
       AND sleep_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[latestRisk]] = await db.query(
      `SELECT
          risk_score,
          risk_level,
          risk_trend,
          recommendation_reason,
          trend_message,
          recommendation,
          report_date
       FROM risk_reports
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    let weeklyStatus = "BALANCED";
    let weeklyMessage =
      "The weekly pattern appears balanced. Continue monitoring gaming, stress, and sleep habits.";

    const totalGamingHours = Number(gamingSummary.total_gaming_minutes || 0) / 60;
    const averageStress = Number(stressSummary.average_stress_percentage || 0);
    const averageSleep = Number(sleepSummary.average_sleep_hours || 0);

    if (totalGamingHours >= 20 || averageStress >= 70 || averageSleep < 6) {
      weeklyStatus = "NEEDS ATTENTION";
      weeklyMessage =
        "The weekly report shows signs of possible imbalance. Reducing gaming time, improving sleep routine, and managing stress are recommended.";
    } else if (totalGamingHours >= 12 || averageStress >= 50 || averageSleep < 7) {
      weeklyStatus = "MODERATE";
      weeklyMessage =
        "The weekly report shows a moderate wellness pattern. The user should continue monitoring habits and avoid long late-night gaming sessions.";
    }

    res.status(200).json({
      success: true,
      report: {
        period: "Last 7 days",
        total_sessions: Number(gamingSummary.total_sessions || 0),
        total_gaming_hours: Number(totalGamingHours.toFixed(2)),
        average_gaming_hours: Number(gamingSummary.average_gaming_hours || 0),
        average_stress_percentage: averageStress,
        highest_stress_percentage: Number(
          stressSummary.highest_stress_percentage || 0
        ),
        total_stress_assessments: Number(stressSummary.total_assessments || 0),
        average_sleep_hours: averageSleep,
        total_sleep_records: Number(sleepSummary.total_sleep_records || 0),
        latest_risk_score: latestRisk ? latestRisk.risk_score : 0,
        latest_risk_level: latestRisk ? latestRisk.risk_level : "N/A",
        latest_risk_trend: latestRisk ? latestRisk.risk_trend : "N/A",
        recommendation_reason: latestRisk
          ? latestRisk.recommendation_reason
          : "No risk report generated yet",
        trend_message: latestRisk
          ? latestRisk.trend_message
          : "Generate a risk report to view trend analysis.",
        recommendation: latestRisk
          ? latestRisk.recommendation
          : "Generate a risk report to receive a personalized recommendation.",
        weekly_status: weeklyStatus,
        weekly_message: weeklyMessage,
      },
    });
  } catch (error) {
    console.error("Weekly wellness report error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading weekly wellness report",
    });
  }
};