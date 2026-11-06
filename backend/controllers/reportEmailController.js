const db = require("../config/db");

// Escape all database-provided text before putting it in an HTML email.
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const num = (value) => Number(value || 0);

exports.emailWeeklyWellnessReport = async (req, res) => {
  const userId = req.user.user_id; // Authenticated user, never req.body.user_id.

  if (!process.env.RESEND_API_KEY || !process.env.REPORT_EMAIL_FROM) {
    return res.status(503).json({
      success: false,
      message: "Report email is not configured yet.",
    });
  }

  try {
    // Recipient is ALWAYS the email stored on the authenticated account.
    const [[user]] = await db.query(
      "SELECT full_name, email FROM users WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!user?.email) {
      return res.status(400).json({
        success: false,
        message: "Your account does not have an email address.",
      });
    }

    // Read the same source tables as the current Weekly Wellness Report.
    const [[gaming]] = await db.query(
      `SELECT COUNT(*) AS total_sessions,
              IFNULL(SUM(duration_minutes), 0) AS total_gaming_minutes,
              IFNULL(ROUND(AVG(duration_minutes) / 60, 2), 0) AS average_gaming_hours
       FROM gaming_sessions
       WHERE user_id = ?
         AND session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[stress]] = await db.query(
      `SELECT IFNULL(ROUND(AVG(stress_percentage), 2), 0) AS average_stress_percentage,
              IFNULL(MAX(stress_percentage), 0) AS highest_stress_percentage,
              COUNT(*) AS total_assessments
       FROM stress_assessments
       WHERE user_id = ?
         AND assessment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[sleep]] = await db.query(
      `SELECT IFNULL(ROUND(AVG(sleep_duration_hours), 2), 0) AS average_sleep_hours,
              COUNT(*) AS total_sleep_records
       FROM sleep_records
       WHERE user_id = ?
         AND sleep_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [[risk]] = await db.query(
      `SELECT risk_score, risk_level, risk_trend, recommendation,
              recommendation_reason, trend_message
       FROM risk_reports
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const totalGamingHours = num(gaming.total_gaming_minutes) / 60;
    const averageStress = num(stress.average_stress_percentage);
    const averageSleep = num(sleep.average_sleep_hours);
    const sleepCount = num(sleep.total_sleep_records);
    const stressCount = num(stress.total_assessments);
    const gamingCount = num(gaming.total_sessions);

    // Avoid classifying missing sleep/stress records as an actual health risk.
    let weeklyStatus = "NOT ENOUGH DATA";
    if (gamingCount && stressCount && sleepCount) {
      weeklyStatus = "BALANCED";
      if (totalGamingHours >= 20 || averageStress >= 70 || averageSleep < 6) {
        weeklyStatus = "NEEDS ATTENTION";
      } else if (totalGamingHours >= 12 || averageStress >= 50 || averageSleep < 7) {
        weeklyStatus = "MODERATE";
      }
    }

    const report = {
      total_sessions: gamingCount,
      total_gaming_hours: Number(totalGamingHours.toFixed(2)),
      average_gaming_hours: num(gaming.average_gaming_hours),
      average_stress_percentage: averageStress,
      highest_stress_percentage: num(stress.highest_stress_percentage),
      total_stress_assessments: stressCount,
      average_sleep_hours: averageSleep,
      total_sleep_records: sleepCount,
      latest_risk_score: risk ? num(risk.risk_score) : "N/A",
      latest_risk_level: risk?.risk_level || "Not generated",
      latest_risk_trend: risk?.risk_trend || "N/A",
      recommendation: risk?.recommendation ||
        "Generate a Risk Report in GameBalance to receive personalized recommendations.",
      weekly_status: weeklyStatus,
    };

    // Persistent 2-minute cooldown works across separate Netlify Function instances.
    // Run the CREATE TABLE statement from the setup instructions first.
    await db.query(
      `INSERT IGNORE INTO weekly_report_email_requests (user_id, last_requested_at)
       VALUES (?, '1970-01-01 00:00:01')`,
      [userId]
    );

    const [updated] = await db.query(
      `UPDATE weekly_report_email_requests
       SET last_requested_at = UTC_TIMESTAMP()
       WHERE user_id = ?
         AND last_requested_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE)`,
      [userId]
    );

    if (updated.affectedRows !== 1) {
      return res.status(429).json({
        success: false,
        message: "You can request another report after 2 minutes.",
      });
    }

    const metric = (label, value) =>
      `<tr><td style="padding:10px 12px;border-bottom:1px solid #33212a;color:#a89ba0">${escapeHtml(label)}</td>` +
      `<td style="padding:10px 12px;border-bottom:1px solid #33212a;color:#ffffff;text-align:right;font-weight:700">${escapeHtml(value)}</td></tr>`;

    const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#08070a;font-family:Arial,sans-serif;color:#f4f1f2">
<div style="max-width:620px;margin:auto;background:#141216;border:1px solid #632536;border-radius:8px;overflow:hidden">
  <div style="background:#210c14;padding:24px;border-bottom:3px solid #ff1339">
    <h1 style="color:#ffffff;margin:0;font-size:24px">GAMEBALANCE</h1>
    <p style="color:#ff8fa3;margin:10px 0 0">Weekly Wellness Report — Last 7 Days</p>
  </div>
  <div style="padding:24px">
    <p>Hello ${escapeHtml(user.full_name || "Gamer")},</p>
    <p style="color:#c9bcc0">Here is your requested GameBalance weekly summary.</p>
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${metric("Gaming sessions", report.total_sessions)}
      ${metric("Total gaming hours", `${report.total_gaming_hours} h`)}
      ${metric("Average session", `${report.average_gaming_hours} h`)}
      ${metric("Stress assessments", report.total_stress_assessments)}
      ${metric("Average stress", `${report.average_stress_percentage}%`)}
      ${metric("Highest stress", `${report.highest_stress_percentage}%`)}
      ${metric("Sleep records", report.total_sleep_records)}
      ${metric("Average sleep", sleepCount ? `${report.average_sleep_hours} h` : "No records")}
      ${metric("Latest risk score", report.latest_risk_score)}
      ${metric("Latest risk level", report.latest_risk_level)}
      ${metric("Latest risk trend", report.latest_risk_trend)}
      ${metric("Weekly status", report.weekly_status)}
    </table>
    <h2 style="font-size:17px;color:#ff8fa3;margin-top:26px">Recommendation</h2>
    <p style="color:#d8cdd1;line-height:1.7">${escapeHtml(report.recommendation)}</p>
    <p style="color:#8a7e83;font-size:12px;margin-top:24px">This is an automated wellness summary, not a medical diagnosis. The risk information is the most recent saved report, which may predate this week.</p>
  </div>
</div></body></html>`;

    const text = [
      `GAMEBALANCE - Weekly Wellness Report`,
      `Hello ${user.full_name || "Gamer"},`,
      `Period: Last 7 days`,
      `Gaming sessions: ${report.total_sessions}`,
      `Total gaming: ${report.total_gaming_hours} hours`,
      `Average session: ${report.average_gaming_hours} hours`,
      `Stress assessments: ${report.total_stress_assessments}`,
      `Average stress: ${report.average_stress_percentage}%`,
      `Highest stress: ${report.highest_stress_percentage}%`,
      `Sleep records: ${report.total_sleep_records}`,
      `Average sleep: ${sleepCount ? report.average_sleep_hours + " hours" : "No records"}`,
      `Latest risk score: ${report.latest_risk_score}`,
      `Latest risk level: ${report.latest_risk_level}`,
      `Latest risk trend: ${report.latest_risk_trend}`,
      `Weekly status: ${report.weekly_status}`,
      `Recommendation: ${report.recommendation}`,
      `Automated wellness summary, not a medical diagnosis.`,
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        from: process.env.REPORT_EMAIL_FROM,
        to: [user.email],
        subject: "GameBalance | Your Weekly Wellness Report",
        html,
        text,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Never log the API key or full report content.
      console.error("Resend report email rejected:", response.status, result.name, result.message);
      return res.status(502).json({
        success: false,
        message: "The email provider rejected the report. Check the verified sender domain and Netlify Function logs.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Report email accepted for ${user.email}. Check your inbox and spam folder.`,
      email_id: result.id || null,
    });
  } catch (error) {
    console.error("Weekly report email error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not email your weekly report. Check the server logs.",
    });
  }
};
