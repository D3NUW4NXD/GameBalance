const db = require("../config/db");

exports.getAdminSummary = async (req, res) => {
  try {
    const [[usersCount]] = await db.query(
      "SELECT COUNT(*) AS total_users FROM users"
    );

    const [[gamingCount]] = await db.query(
      "SELECT COUNT(*) AS total_gaming_sessions FROM gaming_sessions"
    );

    const [[stressCount]] = await db.query(
      "SELECT COUNT(*) AS total_stress_assessments FROM stress_assessments"
    );

    const [[sleepCount]] = await db.query(
      "SELECT COUNT(*) AS total_sleep_records FROM sleep_records"
    );

    const [[riskCount]] = await db.query(
      "SELECT COUNT(*) AS total_risk_reports FROM risk_reports"
    );

    const [[alertCount]] = await db.query(
      "SELECT COUNT(*) AS total_alerts FROM alerts"
    );

    res.status(200).json({
      success: true,
      summary: {
        total_users: usersCount.total_users,
        total_gaming_sessions: gamingCount.total_gaming_sessions,
        total_stress_assessments: stressCount.total_stress_assessments,
        total_sleep_records: sleepCount.total_sleep_records,
        total_risk_reports: riskCount.total_risk_reports,
        total_alerts: alertCount.total_alerts,
      },
    });
  } catch (error) {
    console.error("Admin summary error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading admin summary",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT 
          user_id,
          full_name,
          email,
          role,
          age,
          gender,
          city,
          created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading users",
    });
  }
};

exports.getHighRiskUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT 
          rr.risk_id,
          rr.user_id,
          u.full_name,
          u.email,
          u.city,
          rr.report_date,
          rr.gaming_average_hours,
          rr.latest_stress_percentage,
          rr.average_sleep_hours,
          rr.risk_score,
          rr.risk_level,
          rr.risk_trend,
          rr.recommendation_reason,
          rr.recommendation,
          rr.created_at
       FROM risk_reports rr
       INNER JOIN users u ON rr.user_id = u.user_id
       WHERE rr.risk_level IN ('MODERATE', 'HIGH')
       ORDER BY rr.created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("High risk users error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading high risk users",
    });
  }
};

exports.getAllAlerts = async (req, res) => {
  try {
    const [alerts] = await db.query(
      `SELECT 
          a.alert_id,
          a.user_id,
          u.full_name,
          u.email,
          a.alert_type,
          a.alert_message,
          a.severity,
          a.is_read,
          a.created_at
       FROM alerts a
       INNER JOIN users u ON a.user_id = u.user_id
       ORDER BY a.created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Get all alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading alerts",
    });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const [riskDistribution] = await db.query(
      `SELECT 
          rr.risk_level AS name,
          COUNT(*) AS value
       FROM risk_reports rr
       INNER JOIN (
          SELECT user_id, MAX(risk_id) AS latest_risk_id
          FROM risk_reports
          GROUP BY user_id
       ) latest ON rr.risk_id = latest.latest_risk_id
       GROUP BY rr.risk_level
       ORDER BY rr.risk_level`
    );

    const [cityDistribution] = await db.query(
      `SELECT 
          IFNULL(city, 'Unknown') AS city,
          COUNT(*) AS users
       FROM users
       GROUP BY city
       ORDER BY users DESC
       LIMIT 8`
    );

    const [weeklyRiskTrend] = await db.query(
      `SELECT 
          DATE_FORMAT(report_date, '%Y-%m-%d') AS report_date,
          ROUND(AVG(risk_score), 2) AS average_risk_score,
          COUNT(*) AS total_reports
       FROM risk_reports
       WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY report_date
       ORDER BY report_date ASC`
    );

    const [[averages]] = await db.query(
      `SELECT
          IFNULL((SELECT ROUND(AVG(duration_minutes) / 60, 2) FROM gaming_sessions), 0) AS average_gaming_hours,
          IFNULL((SELECT ROUND(AVG(stress_percentage), 2) FROM stress_assessments), 0) AS average_stress_percentage,
          IFNULL((SELECT ROUND(AVG(sleep_duration_hours), 2) FROM sleep_records), 0) AS average_sleep_hours,
          IFNULL((SELECT ROUND(AVG(risk_score), 2) FROM risk_reports), 0) AS average_risk_score`
    );

    res.status(200).json({
      success: true,
      analytics: {
        risk_distribution: riskDistribution,
        city_distribution: cityDistribution,
        weekly_risk_trend: weeklyRiskTrend,
        averages,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading admin analytics",
    });
  }
};