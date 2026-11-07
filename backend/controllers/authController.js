
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const deleteOldProfileImage = (profileImagePath) => {
  if (!profileImagePath) return;

  const filePath = path.join(
    __dirname,
    "..",
    profileImagePath
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// =====================================
// REGISTER
// =====================================

exports.register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      age,
      gender,
      city,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (age && (age < 18 || age > 20)) {
      return res.status(400).json({
        success: false,
        message:
          "This system is designed for users aged 18 to 20",
      });
    }

    const [existingUsers] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    await db.query(
      `INSERT INTO users
       (full_name, email, password_hash, age, gender, city)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        passwordHash,
        age || null,
        gender || null,
        city || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// =====================================
// LOGIN
// =====================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // New sessions include a version so
    // password resets can invalidate old sessions.
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        token_version: Number(user.token_version || 0),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        city: user.city,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// =====================================
// GET PROFILE
// =====================================

exports.getProfile = async (req, res) => {
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
         profile_image,
         created_at
       FROM users
       WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading profile",
    });
  }
};

// =====================================
// UPDATE PROFILE
// =====================================

exports.updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      age,
      gender,
      city,
    } = req.body;

    if (!full_name) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (age && (age < 18 || age > 20)) {
      return res.status(400).json({
        success: false,
        message:
          "This system is designed for users aged 18 to 20",
      });
    }

    const [result] = await db.query(
      `UPDATE users
       SET full_name = ?, age = ?, gender = ?, city = ?
       WHERE user_id = ?`,
      [
        full_name,
        age || null,
        gender || null,
        city || null,
        req.user.user_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [updatedUsers] = await db.query(
      `SELECT
         user_id,
         full_name,
         email,
         role,
         age,
         gender,
         city,
         profile_image,
         created_at
       FROM users
       WHERE user_id = ?`,
      [req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// =====================================
// UPLOAD PROFILE IMAGE
// =====================================

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const [users] = await db.query(
      "SELECT profile_image FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    deleteOldProfileImage(users[0].profile_image);

    const profileImagePath =
      `/uploads/profile/${req.file.filename}`;

    await db.query(
      `UPDATE users
       SET profile_image = ?
       WHERE user_id = ?`,
      [profileImagePath, req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      profile_image: profileImagePath,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading profile image",
    });
  }
};

// =====================================
// DELETE PROFILE IMAGE
// =====================================

exports.deleteProfileImage = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT profile_image FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    deleteOldProfileImage(users[0].profile_image);

    await db.query(
      `UPDATE users
       SET profile_image = NULL
       WHERE user_id = ?`,
      [req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
    });
  } catch (error) {
    console.error("Delete profile image error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing profile image",
    });
  }
};
