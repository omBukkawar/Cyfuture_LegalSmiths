const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  try {
    // Prefer httpOnly cookie, fall back to Authorization header
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token is invalid or expired.",
          expired: err.name === "TokenExpiredError",
        });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
}

module.exports = { verifyToken };

