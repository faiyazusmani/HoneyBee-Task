const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require('dotenv')

dotenv.config()
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));


const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "internship_assignment",
  port: Number(process.env.DB_PORT || 3306)
};

const PORT = Number(process.env.PORT || 3000);

let pool;
let dbReady = false;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\d{10,15}$/.test(phone);
}

async function initDatabase() {
  const rootConnection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  await rootConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
  );
  await rootConnection.end();

  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [uniqueIndexes] = await pool.query(
    `
      SELECT DISTINCT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'email'
        AND NON_UNIQUE = 0
        AND INDEX_NAME <> 'PRIMARY'
    `,
    [dbConfig.database]
  );

  for (const row of uniqueIndexes) {
    await pool.query(`ALTER TABLE users DROP INDEX \`${row.INDEX_NAME}\``);
  }

  dbReady = true;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  const safeName = typeof name === "string" ? name.trim() : "";
  const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const safePassword = typeof password === "string" ? password : "";
  const digitsPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : "";

  if (!safeName || !safeEmail || !safePassword || !digitsPhone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!isValidEmail(safeEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (safePassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  if (!isValidPhone(digitsPhone)) {
    return res.status(400).json({ message: "Phone should contain 10 to 15 digits" });
  }

  try {
    if (!pool || !dbReady) {
      return res.status(503).json({
        message:
          "Database is not connected. Please start MySQL and set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT."
      });
    }

    const hashedPassword = await bcrypt.hash(safePassword, 10);

    await pool.execute(
      "INSERT INTO users (full_name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
      [safeName, safeEmail, hashedPassword, digitsPhone]
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

async function startServer() {
  try {
    await initDatabase();
    console.log("MySQL connected and users table is ready.");
  } catch (error) {
    console.error("Database setup failed:", error.message || error.code || "Unknown error");
    console.error(
      "Server started without DB. Registration API will return 503 until MySQL is configured."
    );
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();