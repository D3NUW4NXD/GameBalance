
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const emailValid = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.length <= 254;

const badServer = (res, label, error) => {
  console.error(label, error);
  return res.status(500).json({
    success: false,
    message: "User management operation failed.",
  });
};

// =====================================
// LIST USER ACCOUNTS
// =====================================

exports.listUsers = async (req, res) => {
  const search = String(req.query.search || "")
    .trim()
    .slice(0, 100);

  try {
    const [users] = await db.query(
      `SELECT
          user_id, full_name, email, role, created_at,
          ban_type, ban_reason,
          DATE_FORMAT(
            ban_expires_at, '%Y-%m-%d %H:%i UTC'
          ) AS ban_until_utc,
          CASE
            WHEN ban_type = 'PERMANENT'
              THEN 'PERMANENT'
            WHEN ban_type = 'TEMPORARY'
              AND ban_expires_at > UTC_TIMESTAMP()
              THEN 'TEMPORARY'
            ELSE 'ACTIVE'
          END AS account_status
       FROM users
       WHERE (
         ? = ''
         OR full_name LIKE CONCAT('%', ?, '%')
         OR email LIKE CONCAT('%', ?, '%')
       )
       ORDER BY created_at DESC, user_id DESC
       LIMIT 300`,
      [search, search, search]
    );

    return res.json({ success: true, users });
  } catch (error) {
    return badServer(res, "List accounts:", error);
  }
};

// =====================================
// CREATE REGULAR USER
// =====================================

exports.createUser = async (req, res) => {
  const fullName =
    typeof req.body?.full_name === "string"
      ? req.body.full_name.trim()
      : "";

  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  const password = req.body?.password;

  if (
    fullName.length < 2 ||
    fullName.length > 100 ||
    !emailValid(email) ||
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Enter a valid name, email, and password of 12–72 bytes.",
    });
  }

  let connection;

  try {
    const hash = await bcrypt.hash(password, 12);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [found] = await connection.query(
      "SELECT user_id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (found.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO users
         (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'USER')`,
      [fullName, email, hash]
    );

    await connection.query(
      `INSERT INTO user_management_audit
         (actor_user_id, target_user_id, action, details)
       VALUES (?, ?, 'CREATE', 'Manual USER account')`,
      [req.user.user_id, result.insertId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        "User created. Share the initial password privately.",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return badServer(res, "Create user:", error);
  } finally {
    if (connection) connection.release();
  }
};

// =====================================
// BAN OR UNBAN USER
// =====================================

exports.updateBan = async (req, res) => {
  const id = getId(req.params.userId);
  const action = req.body?.action;

  const reason =
    typeof req.body?.reason === "string"
      ? req.body.reason.trim()
      : "";

  const hours = Number(req.body?.hours);

  if (
    !id ||
    !["TEMPORARY", "PERMANENT", "UNBAN"].includes(action)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid user or moderation action.",
    });
  }

  if (id === Number(req.user.user_id)) {
    return res.status(403).json({
      success: false,
      message: "You cannot moderate your own account.",
    });
  }

  if (
    action !== "UNBAN" &&
    (reason.length < 3 || reason.length > 255)
  ) {
    return res.status(400).json({
      success: false,
      message: "Reason must be 3–255 characters.",
    });
  }

  if (
    action === "TEMPORARY" &&
    (!Number.isInteger(hours) || hours < 1 || hours > 720)
  ) {
    return res.status(400).json({
      success: false,
      message: "Temporary bans must last 1–720 hours.",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT role
       FROM users
       WHERE user_id = ?
       FOR UPDATE`,
      [id]
    );

    if (!rows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (rows[0].role === "SUPER_ADMIN") {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "Super Admin accounts are protected.",
      });
    }

    if (action === "TEMPORARY") {
      await connection.query(
        `UPDATE users
         SET ban_type = 'TEMPORARY',
             ban_expires_at =
               DATE_ADD(
                 UTC_TIMESTAMP(),
                 INTERVAL ? HOUR
               ),
             ban_reason = ?,
             token_version = token_version + 1
         WHERE user_id = ?`,
        [hours, reason, id]
      );
    } else if (action === "PERMANENT") {
      await connection.query(
        `UPDATE users
         SET ban_type = 'PERMANENT',
             ban_expires_at = NULL,
             ban_reason = ?,
             token_version = token_version + 1
         WHERE user_id = ?`,
        [reason, id]
      );
    } else {
      await connection.query(
        `UPDATE users
         SET ban_type = 'NONE',
             ban_expires_at = NULL,
             ban_reason = NULL,
             token_version = token_version + 1
         WHERE user_id = ?`,
        [id]
      );
    }

    const details =
      action === "TEMPORARY"
        ? `${hours} hour(s): ${reason}`
        : action === "UNBAN"
          ? "Ban removed"
          : reason;

    await connection.query(
      `INSERT INTO user_management_audit
         (actor_user_id, target_user_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [req.user.user_id, id, action, details]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        action === "UNBAN"
          ? "User unbanned."
          : "Ban applied. Existing sessions invalidated.",
    });
  } catch (error) {
    await connection.rollback();
    return badServer(res, "Moderate user:", error);
  } finally {
    connection.release();
  }
};

// =====================================
// PERMANENTLY DELETE USER
// =====================================

exports.deleteUser = async (req, res) => {
  const id = getId(req.params.userId);

  const confirmation = String(
    req.body?.confirm_email || ""
  ).trim().toLowerCase();

  if (!id || !emailValid(confirmation)) {
    return res.status(400).json({
      success: false,
      message: "Confirm the target account email.",
    });
  }

  if (id === Number(req.user.user_id)) {
    return res.status(403).json({
      success: false,
      message: "You cannot delete your own account.",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT email, role
       FROM users
       WHERE user_id = ?
       FOR UPDATE`,
      [id]
    );

    if (!rows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (
      rows[0].role === "SUPER_ADMIN" ||
      rows[0].email.toLowerCase() !== confirmation
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Protected account or confirmation did not match.",
      });
    }

    // Delete stress answers before their assessments.
    await connection.query(
      `DELETE FROM stress_answers
       WHERE assessment_id IN (
         SELECT assessment_id
         FROM stress_assessments
         WHERE user_id = ?
       )`,
      [id]
    );

    const tables = [
      "alerts",
      "risk_reports",
      "gaming_sessions",
      "sleep_records",
      "stress_assessments",
      "password_otp_codes",
      "weekly_report_email_requests",
    ];

    // Supporting tables may differ between deployments.
    const placeholders = tables.map(() => "?").join(", ");

    const [existingTables] = await connection.query(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN (${placeholders})`,
      tables
    );

    const present = new Set(
      existingTables.map((row) => row.name)
    );

    for (const table of tables) {
      if (present.has(table)) {
        // Names are from the fixed server-side list.
        await connection.query(
          `DELETE FROM \`${table}\` WHERE user_id = ?`,
          [id]
        );
      }
    }

    await connection.query(
      "DELETE FROM users WHERE user_id = ?",
      [id]
    );

    await connection.query(
      `INSERT INTO user_management_audit
         (actor_user_id, target_user_id, action, details)
       VALUES (
         ?, ?, 'DELETE',
         'Account and known related records removed'
       )`,
      [req.user.user_id, id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Account permanently deleted.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete user:", error);

    const dependencyError = [
      "ER_NO_SUCH_TABLE",
      "ER_ROW_IS_REFERENCED_2",
      "ER_ROW_IS_REFERENCED",
    ].includes(error.code);

    return res.status(dependencyError ? 409 : 500).json({
      success: false,
      message:
        "Deletion was safely cancelled. Review dependent database tables and foreign keys before retrying.",
    });
  } finally {
    connection.release();
  }
};
