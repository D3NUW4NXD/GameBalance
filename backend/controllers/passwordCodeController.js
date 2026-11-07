
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const db = require("../config/db");
const sendSecurityEmail = require(
  "../services/securityCodeEmail"
);

const GENERIC_MESSAGE =
  "If this email is registered, a six-digit code " +
  "will be sent shortly. Check your inbox and spam folder.";

const cleanEmail = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase()
    : "";

const validEmail = (email) =>
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validCode = (code) =>
  typeof code === "string" && /^\d{6}$/.test(code);

const validPassword = (password) =>
  typeof password === "string" &&
  password.length >= 10 &&
  Buffer.byteLength(password, "utf8") <= 72;

const emailConfigured = (res) => {
  if (
    !process.env.RESEND_API_KEY ||
    !(
      process.env.PASSWORD_EMAIL_FROM ||
      process.env.REPORT_EMAIL_FROM
    )
  ) {
    res.status(503).json({
      success: false,
      message: "Password email service is not configured",
    });
    return false;
  }

  return true;
};

// Generate, securely hash, and store a code.
// Limit requests to one per minute and five per hour.
const issueCode = async (user, purpose) => {
  const code = String(
    crypto.randomInt(0, 1000000)
  ).padStart(6, "0");

  const codeHash = await bcrypt.hash(code, 12);

  const connection = await db.getConnection();
  let canSend = false;

  try {
    await connection.beginTransaction();

    // Serialize requests for the same account.
    await connection.query(
      `SELECT user_id
       FROM users
       WHERE user_id = ?
       FOR UPDATE`,
      [user.user_id]
    );

    const [existing] = await connection.query(
      `SELECT
         TIMESTAMPDIFF(
           SECOND, last_sent_at, UTC_TIMESTAMP()
         ) AS seconds_since,
         TIMESTAMPDIFF(
           SECOND, window_started_at, UTC_TIMESTAMP()
         ) AS window_age,
         send_count
       FROM password_otp_codes
       WHERE user_id = ? AND purpose = ?
       FOR UPDATE`,
      [user.user_id, purpose]
    );

    const record = existing[0];

    const inWindow =
      record &&
      record.window_age >= 0 &&
      record.window_age < 3600;

    const tooSoon =
      record &&
      record.seconds_since >= 0 &&
      record.seconds_since < 60;

    const tooMany =
      inWindow &&
      Number(record.send_count) >= 5;

    if (!tooSoon && !tooMany) {
      const count = inWindow
        ? Number(record.send_count) + 1
        : 1;

      await connection.query(
        `INSERT INTO password_otp_codes
         (
           user_id,
           purpose,
           code_hash,
           expires_at,
           last_sent_at,
           attempts,
           send_count,
           window_started_at
         )
         VALUES (
           ?, ?, ?,
           DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE),
           UTC_TIMESTAMP(),
           0, ?, UTC_TIMESTAMP()
         )
         ON DUPLICATE KEY UPDATE
           code_hash = VALUES(code_hash),
           expires_at = VALUES(expires_at),
           last_sent_at = VALUES(last_sent_at),
           attempts = 0,
           send_count = VALUES(send_count),
           window_started_at = IF(
             ?, window_started_at, UTC_TIMESTAMP()
           )`,
        [
          user.user_id,
          purpose,
          codeHash,
          count,
          Boolean(inWindow),
        ]
      );

      canSend = true;
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (!canSend) return false;

  try {
    await sendSecurityEmail({
      to: user.email,
      name: user.full_name,
      code,
      purpose,
    });
  } catch (error) {
    // Do not delete a newer code accidentally.
    await db.query(
      `DELETE FROM password_otp_codes
       WHERE user_id = ?
         AND purpose = ?
         AND code_hash = ?`,
      [user.user_id, purpose, codeHash]
    );

    throw error;
  }

  return true;
};

// Verify code inside a transaction and
// invalidate all old login tokens.
const redeemCode = async (
  userId,
  purpose,
  code,
  newPassword
) => {
  const newHash = await bcrypt.hash(newPassword, 12);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.query(
      `SELECT user_id
       FROM users
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );

    if (!users.length) {
      await connection.rollback();
      return false;
    }

    const [rows] = await connection.query(
      `SELECT
         code_hash,
         attempts,
         expires_at > UTC_TIMESTAMP() AS valid
       FROM password_otp_codes
       WHERE user_id = ? AND purpose = ?
       FOR UPDATE`,
      [userId, purpose]
    );

    const row = rows[0];

    if (
      !row ||
      !row.valid ||
      Number(row.attempts) >= 5
    ) {
      await connection.rollback();
      return false;
    }

    const matches = await bcrypt.compare(
      code,
      row.code_hash
    );

    if (!matches) {
      await connection.query(
        `UPDATE password_otp_codes
         SET attempts = attempts + 1
         WHERE user_id = ? AND purpose = ?`,
        [userId, purpose]
      );

      await connection.commit();
      return false;
    }

    await connection.query(
      `UPDATE users
       SET password_hash = ?,
           token_version = token_version + 1
       WHERE user_id = ?`,
      [newHash, userId]
    );

    // Invalidate every outstanding code
    // for this account.
    await connection.query(
      `DELETE FROM password_otp_codes
       WHERE user_id = ?`,
      [userId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// FORGOT PASSWORD: REQUEST EMAIL CODE
exports.requestReset = async (req, res) => {
  const email = cleanEmail(req.body?.email);

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email address",
    });
  }

  if (!emailConfigured(res)) return;

  try {
    const [users] = await db.query(
      `SELECT user_id, full_name, email
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (users.length) {
      try {
        await issueCode(users[0], "RESET");
      } catch (error) {
        // Do not reveal account existence
        // through the public endpoint.
        console.error(
          "Reset email failed:",
          error.message
        );
      }
    }

    return res.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error("Reset request error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not process request",
    });
  }
};

// FORGOT PASSWORD: VERIFY CODE + RESET
exports.confirmReset = async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const code = req.body?.code;
  const password = req.body?.new_password;

  if (!validEmail(email) || !validCode(code)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or code",
    });
  }

  if (!validPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Use at least 10 characters, maximum 72 UTF-8 bytes",
    });
  }

  try {
    const [users] = await db.query(
      `SELECT user_id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const updated =
      users.length &&
      (await redeemCode(
        users[0].user_id,
        "RESET",
        code,
        password
      ));

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Code invalid, expired, or too many attempts. Request a new code.",
      });
    }

    return res.json({
      success: true,
      message: "Password reset. Please sign in again.",
    });
  } catch (error) {
    console.error("Reset confirmation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not reset password",
    });
  }
};

// PROFILE: SEND EMAIL CODE
// Requires current password.
exports.requestChange = async (req, res) => {
  const currentPassword = req.body?.current_password;

  if (
    typeof currentPassword !== "string" ||
    !currentPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "Current password required",
    });
  }

  if (!emailConfigured(res)) return;

  try {
    const [users] = await db.query(
      `SELECT user_id, full_name, email, password_hash
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );

    const user = users[0];

    if (
      !user ||
      !(await bcrypt.compare(
        currentPassword,
        user.password_hash
      ))
    ) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No email address on this account",
      });
    }

    const sent = await issueCode(user, "CHANGE");

    return res.json({
      success: true,
      message: sent
        ? "Verification code sent to your account email."
        : "Please wait before requesting another code (maximum five per hour).",
    });
  } catch (error) {
    console.error("Change code request error:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to send verification code",
    });
  }
};

// PROFILE: VERIFY EMAIL CODE + CHANGE PASSWORD
exports.confirmChange = async (req, res) => {
  const code = req.body?.code;
  const password = req.body?.new_password;

  if (!validCode(code)) {
    return res.status(400).json({
      success: false,
      message: "Enter the six-digit email code",
    });
  }

  if (!validPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Use at least 10 characters, maximum 72 UTF-8 bytes",
    });
  }

  try {
    const updated = await redeemCode(
      req.user.user_id,
      "CHANGE",
      code,
      password
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Code invalid, expired, or too many attempts. Request a new code.",
      });
    }

    return res.json({
      success: true,
      message:
        "Password changed. Sign in again with your new password.",
    });
  } catch (error) {
    console.error("Change confirmation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not change password",
    });
  }
};
