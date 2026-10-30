const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const gamingRoutes = require("./routes/gamingRoutes");
const stressRoutes = require("./routes/stressRoutes");
const sleepRoutes = require("./routes/sleepRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("GameBalance API is running successfully");
});

app.get("/api/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS database_name");

    res.json({
      success: true,
      message: "Database connected successfully",
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/gaming", gamingRoutes);
app.use("/api/stress", stressRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`GameBalance backend running on port ${PORT}`);
});