const mysql = require("mysql2");
require("dotenv").config();

// Netlify: store the Aiven CA certificate as base64 in DB_SSL_CA_B64.
// Locally, the optional TLS config is omitted unless the variable is present.
const ssl = process.env.DB_SSL_CA_B64
  ? {
      ca: Buffer.from(process.env.DB_SSL_CA_B64, "base64").toString("utf8"),
      rejectUnauthorized: true,
    }
  : undefined;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

module.exports = db.promise();
