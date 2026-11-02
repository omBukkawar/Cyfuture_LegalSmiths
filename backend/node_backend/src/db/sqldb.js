const mysql = require("mysql2/promise");
require("dotenv").config();

// Priority 1: Direct Cloud Connection URL (e.g. TiDB Cloud / Aiven)
const connectionUri =
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.TIDBCLOUD_MYSQL_CONN ||
  process.env.IDBCLOUD_MYSQL_CONN;

let pool;

if (connectionUri) {
  // Directly create pool from connection URI (handles user, pass, host, port, ssl query params)
  pool = mysql.createPool(connectionUri);
} else {
  // Priority 2: Discrete environment parameters (Local or Cloud)
  const poolConfig = {
    host: process.env.SQL_HOST || "localhost",
    port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 3306,
    user: process.env.SQL_USER || "root",
    password: process.env.SQL_PASSWORD || "",
    database: process.env.SQL_DATABASE || "users",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (
    process.env.SQL_SSL === "true" ||
    (process.env.SQL_HOST &&
      !process.env.SQL_HOST.includes("127.0.0.1") &&
      !process.env.SQL_HOST.includes("localhost"))
  ) {
    poolConfig.ssl = {
      rejectUnauthorized: true,
    };
  }

  pool = mysql.createPool(poolConfig);
}

module.exports = pool;
