const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "superadmin@example.com",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
};
