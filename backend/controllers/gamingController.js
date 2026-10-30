const db = require("../config/db");

exports.addGamingSession = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      game_title,
      platform,
      session_date,
      start_time,
      end_time,
      duration_minutes,
      mood_after,
      notes
    } = req.body;

    if (!game_title || !session_date || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: "Game title, session date and duration are required"
      });
    }

    if (duration_minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than 0"
      });
    }

    await db.query(
      `INSERT INTO gaming_sessions
       (user_id, game_title, platform, session_date, start_time, end_time, duration_minutes, mood_after, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        game_title,
        platform || null,
        session_date,
        start_time || null,
        end_time || null,
        duration_minutes,
        mood_after || null,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Gaming session added successfully"
    });
  } catch (error) {
    console.error("Add gaming session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding gaming session"
    });
  }
};

exports.getMyGamingSessions = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [sessions] = await db.query(
      `SELECT *
       FROM gaming_sessions
       WHERE user_id = ?
       ORDER BY session_date DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("Get gaming sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while loading gaming sessions"
    });
  }
};

exports.getGamingSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [summary] = await db.query(
      `SELECT
          COUNT(*) AS total_sessions,
          COALESCE(SUM(duration_minutes), 0) AS total_minutes,
          COALESCE(ROUND(AVG(duration_minutes), 2), 0) AS average_minutes,
          COALESCE(MAX(duration_minutes), 0) AS longest_session
       FROM gaming_sessions
       WHERE user_id = ?`,
      [userId]
    );

    const [dailyStats] = await db.query(
      `SELECT
          session_date,
          SUM(duration_minutes) AS total_minutes,
          COUNT(*) AS session_count
       FROM gaming_sessions
       WHERE user_id = ?
       GROUP BY session_date
       ORDER BY session_date DESC
       LIMIT 7`,
      [userId]
    );

    res.status(200).json({
      success: true,
      summary: summary[0],
      last_7_days: dailyStats
    });
  } catch (error) {
    console.error("Gaming summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while loading gaming summary"
    });
  }
};