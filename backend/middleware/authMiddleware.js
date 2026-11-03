
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Verify the JWT and read current permissions
// directly from MySQL on each request.
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

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const [users] = await db.query(
      `SELECT user_id, role
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

    req.user = {
      user_id: users[0].user_id,
      role: users[0].role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
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

// ADMIN and SUPER_ADMIN can access
// all existing admin functions.
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

// Only SUPER_ADMIN can manage admin roles.
exports.superAdminOnly = (req, res, next) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
};
