const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getProfile,
} = require("../controllers/auth.controller.js");
const { verifyToken } = require("../middlewares/auth.middleware.js");

// Public auth endpoints
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Protected auth endpoints
router.post("/logout", verifyToken, logoutUser);
router.get("/me", verifyToken, getProfile);

module.exports = router;

