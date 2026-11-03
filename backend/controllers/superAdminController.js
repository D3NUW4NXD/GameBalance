
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const cleanEmail = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase()
    : "";

// =====================================
// CREATE ADMIN ACCOUNT
// POST /api/admin/staff
// =====================================

exports.createAdmin = async (req, res) => {
  const name =
    typeof req.body?.full_name === "string"
      ? req.body.full_name.trim()
      : "";

  const email = cleanEmail(req.body?.email);
  const password = req.body?.password;

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 2–100 characters",
    });
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid email is required",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be 12+ characters and at most 72 UTF-8 bytes",
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT user_id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered. Promote the existing user instead.",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'ADMIN')`,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: {
        user_id: result.insertId,
        full_name: name,
        email,
        role: "ADMIN",
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    console.error("Create admin failed:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create admin",
    });
  }
};

// =====================================
// CHANGE USER ROLE
// PATCH /api/admin/users/:userId/role
// =====================================

exports.updateUserRole = async (req, res) => {
  const userId = Number(req.params.userId);
  const role = req.body?.role;

  if (
    !Number.isSafeInteger(userId) ||
    userId < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  // SUPER_ADMIN cannot be assigned here.
  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be USER or ADMIN",
    });
  }

  if (userId === Number(req.user.user_id)) {
    return res.status(403).json({
      success: false,
      message: "You cannot change your own role",
    });
  }

  try {
    // Only USER/ADMIN accounts can be changed.
    // This also protects other SUPER_ADMIN accounts.
    const [result] = await db.query(
      `UPDATE users
       SET role = ?
       WHERE user_id = ?
         AND role IN ('USER', 'ADMIN')`,
      [role, userId]
    );

    if (result.affectedRows !== 1) {
      return res.status(403).json({
        success: false,
        message:
          "Account not found or protected from role changes",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
    });
  } catch (error) {
    console.error("Change role failed:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update role",
    });
  }
};
