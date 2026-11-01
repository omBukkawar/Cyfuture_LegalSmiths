const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/sqldb.js");

// Helper: Generate Access Token (Short-lived: 15m)
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
}

// Helper: Generate Refresh Token (Long-lived: 7d)
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
}

// Safely save refresh token to database (handles case where column might not exist yet)
async function saveRefreshToken(userId, token) {
  try {
    await pool.query("UPDATE users SET refresh_token = ? WHERE id = ?", [token, userId]);
  } catch (err) {
    // If the refresh_token column does not exist yet, log reminder without failing request
    if (err.code === "ER_BAD_FIELD_ERROR") {
      console.warn("Notice: 'refresh_token' column not found in MySQL 'users' table. Run: ALTER TABLE users ADD COLUMN refresh_token TEXT;");
    } else {
      console.error("Error saving refresh token to DB:", err);
    }
  }
}

// 1. REGISTER
async function registerUser(req, res) {
  try {
    const { name, email, password, phone_number } = req.body;

    if (!name || !email || !password || !phone_number) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const [exist] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exist.length) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, phone_number) VALUES (?, ?, ?, ?)",
      [name, email, hashed, phone_number]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      phone_number,
    };

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    await saveRefreshToken(newUser.id, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: newUser,
    });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

// 2. LOGIN
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken);

    delete user.password;
    delete user.refresh_token;

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user,
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

// 3. REFRESH TOKEN
async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
      }

      const [rows] = await pool.query("SELECT id, name, email, phone_number, refresh_token FROM users WHERE id = ?", [decoded.id]);
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User no longer exists" });
      }

      const user = rows[0];

      // Optional check if refresh token matches the one in DB (if stored)
      if (user.refresh_token && user.refresh_token !== refreshToken) {
        return res.status(403).json({ success: false, message: "Refresh token mismatch or revoked" });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await saveRefreshToken(user.id, newRefreshToken);

      return res.json({
        success: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (e) {
    console.error("Refresh token error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

// 4. LOGOUT
async function logoutUser(req, res) {
  try {
    const userId = req.user?.id;
    if (userId) {
      await saveRefreshToken(userId, null);
    }
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (e) {
    console.error("Logout error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

// 5. GET CURRENT USER PROFILE
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      "SELECT id, name, email, phone_number FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (e) {
    console.error("Get profile error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getProfile,
};
