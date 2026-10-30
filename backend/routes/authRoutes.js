
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Use a writable temporary folder for Netlify Functions.
// On a local computer, this uses the system's temp directory.
const uploadPath = path.join(
  os.tmpdir(),
  "gamebalance",
  "uploads",
  "profile"
);

// Create the directory if it does not exist.
fs.mkdirSync(uploadPath, { recursive: true });

// Configure profile image storage.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const fileName = `user_${req.user.user_id}_${Date.now()}${extension}`;
    cb(null, fileName);
  },
});

// Allow only supported profile image types.
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG, and WEBP image files are allowed")
    );
  }

  cb(null, true);
};

// Set upload limits.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// Handle Multer upload errors.
const uploadProfileMiddleware = (req, res, next) => {
  upload.single("profile_image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Profile image must be less than 2MB"
            : error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

// Public authentication routes.
router.post("/register", register);
router.post("/login", login);

// Protected profile routes.
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.put(
  "/profile/image",
  protect,
  uploadProfileMiddleware,
  uploadProfileImage
);

router.delete(
  "/profile/image",
  protect,
  deleteProfileImage
);

router.put("/change-password", protect, changePassword);

module.exports = router;
