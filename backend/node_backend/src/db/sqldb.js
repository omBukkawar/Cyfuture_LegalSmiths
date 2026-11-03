const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * TiDB Cloud & Cloud MySQL Connection Pool
 * Explicitly configures TLS 1.2+ encryption required by TiDB Serverless,
 * while allowing local unencrypted MySQL when host is localhost.
 */
let poolConfig;

const connectionUri =
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.TIDBCLOUD_MYSQL_CONN ||
  process.env.IDBCLOUD_MYSQL_CONN;

if (connectionUri) {
  try {
    const parsed = new URL(connectionUri);
    poolConfig = {
      host: parsed.hostname,
      port: Number(parsed.port) || 4000,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "users",
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  } catch (err) {
    console.warn("Failed to parse MYSQL_URL via new URL, falling back to discrete config:", err.message);
  }
}

if (!poolConfig) {
  poolConfig = {
    host: process.env.SQL_HOST || "localhost",
    port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 3306,
    user: process.env.SQL_USER || "root",
    password: process.env.SQL_PASSWORD || "",
    database: process.env.SQL_DATABASE || "users",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Cloud providers (TiDB / Aiven) strictly require TLS 1.2+
  if (
    process.env.SQL_SSL === "true" ||
    (process.env.SQL_HOST &&
      !process.env.SQL_HOST.includes("127.0.0.1") &&
      !process.env.SQL_HOST.includes("localhost"))
  ) {
    poolConfig.ssl = {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    };
  }
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
