const jwt = require("jsonwebtoken");
const config = require("./config");
const db = require("./db");

function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "8h" });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);

    if (payload.role !== "super_admin") {
      const user = db.findUserById(payload.userId);
      if (!user) return res.status(401).json({ message: "User no longer exists" });
    }

    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }
    next();
  };
}

module.exports = { createToken, authenticate, allowRoles };
