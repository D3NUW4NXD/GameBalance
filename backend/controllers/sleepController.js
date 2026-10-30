const db = require("../config/db");

exports.addSleepRecord = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      sleep_date,
      bedtime,
      wake_time,
      sleep_duration_hours,
      sleep_quality,
      interruptions,
      used_phone_before_sleep,
      notes
    } = req.body;

    if (!sleep_date || !sleep_duration_hours || !sleep_quality) {
      return res.status(400).json({
        success: false,
        message: "Sleep date, sleep duration and sleep quality are required"
      });
    }

    if (sleep_duration_hours <= 0 || sleep_duration_hours > 24) {
      return res.status(400).json({
        success: false,
        message: "Sleep duration must be between 1 and 24 hours"
      });
    }

    const validQualities = ["POOR", "FAIR", "GOOD", "EXCELLENT"];

    if (!validQualities.includes(sleep_quality)) {
      return res.status(400).json({
        success: false,
        message: "Sleep quality must be POOR, FAIR, GOOD or EXCELLENT"
      });
    }

    await db.query(
      `INSERT INTO sleep_records
       (user_id, sleep_date, bedtime, wake_time, sleep_duration_hours, sleep_quality, interruptions, used_phone_before_sleep, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        sleep_date,
        bedtime || null,
        wake_time || null,
        sleep_duration_hours,
        sleep_quality,
        interruptions || 0,
        used_phone_before_sleep ? 1 : 0,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Sleep record added successfully"
    });
  } catch (error) {
    console.error("Add sleep record error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding sleep record"
    });
  }
};

exports.getMySleepRecords = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [records] = await db.query(
      `SELECT *
       FROM sleep_records
       WHERE user_id = ?
       ORDER BY sleep_date DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    console.error("Get sleep records error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading sleep records"
    });
  }
};

exports.getSleepSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [summary] = await db.query(
      `SELECT
          COUNT(*) AS total_records,
          COALESCE(ROUND(AVG(sleep_duration_hours), 2), 0) AS average_sleep_hours,
          COALESCE(MIN(sleep_duration_hours), 0) AS shortest_sleep,
          COALESCE(MAX(sleep_duration_hours), 0) AS longest_sleep
       FROM sleep_records
       WHERE user_id = ?`,
      [userId]
    );

    const [latest] = await db.query(
      `SELECT *
       FROM sleep_records
       WHERE user_id = ?
       ORDER BY sleep_date DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    const [last7Days] = await db.query(
      `SELECT
          sleep_date,
          sleep_duration_hours,
          sleep_quality,
          interruptions,
          used_phone_before_sleep
       FROM sleep_records
       WHERE user_id = ?
       ORDER BY sleep_date DESC
       LIMIT 7`,
      [userId]
    );

    res.status(200).json({
      success: true,
      summary: summary[0],
      latest_record: latest[0] || null,
      last_7_days: last7Days
    });
  } catch (error) {
    console.error("Sleep summary error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while loading sleep summary"
    });
  }
};