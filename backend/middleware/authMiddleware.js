
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// =====================================
// VERIFY LOGIN TOKEN
// =====================================

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Login required",
    });
  }

  try {
    const token = authHeader.slice(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const userId = Number(decoded.user_id);

    if (
      !Number.isSafeInteger(userId) ||
      userId < 1
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Read current permissions and session version.
    const [users] = await db.query(
      `SELECT user_id, role, token_version
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (users.length !== 1) {
      return res.status(401).json({
        success: false,
        message: "Account unavailable",
      });
    }

    // A password change increments token_version.
    // This rejects all previously issued tokens.
    if (
      Number(decoded.token_version ?? 0) !==
      Number(users[0].token_version)
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again",
      });
    }

    req.user = {
      user_id: users[0].user_id,
      role: users[0].role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service unavailable",
    });
  }
};

// =====================================
// ADMIN AND SUPER ADMIN
// =====================================

exports.adminOnly = (req, res, next) => {
  if (
    !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

// =====================================
// SUPER ADMIN ONLY
// =====================================

exports.superAdminOnly = (req, res, next) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
};
