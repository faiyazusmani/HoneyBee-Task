const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "internship_assignment",
  port: Number(process.env.DB_PORT || 3306)
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\d{10,15}$/.test(phone);
}

async function initDatabase() {
  try {
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

    const pool = mysql.createPool({
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

    return pool;
  } catch (error) {
    console.error("Database init error:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    const pool = await initDatabase();
    const hashedPassword = await bcrypt.hash(safePassword, 10);

    await pool.execute(
      "INSERT INTO users (full_name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
      [safeName, safeEmail, hashedPassword, digitsPhone]
    );

    await pool.end();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}
