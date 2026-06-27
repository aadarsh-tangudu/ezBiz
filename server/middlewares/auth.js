const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ezbiz_jwt_secret_key_12345";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Access denied. No authorization header provided." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Access denied. Invalid token format (must be Bearer <token>)." });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Access denied. Invalid or expired authentication token." });
  }
};
