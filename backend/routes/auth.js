const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { createToken, authenticate } = require("../auth");

const router = express.Router();
const validRoles = ["organization_admin", "end_user"];

function safeUser(user, organization) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: organization
      ? { id: organization.id, name: organization.name, slug: organization.slug }
      : null,
  };
}

router.post("/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const organizationSlug = String(req.body.organizationSlug || "").trim().toLowerCase();
  const role = String(req.body.role || "");
  const adminSignupCode = String(req.body.adminSignupCode || "").trim();

  if (!name || !email || password.length < 8 || !organizationSlug || !validRoles.includes(role)) {
    return res.status(400).json({
      message: "Name, valid email, organization, role, and password of at least 8 characters are required",
    });
  }

  const organization = db.findOrganizationBySlug(organizationSlug);
  if (!organization) return res.status(404).json({ message: "Organization not found" });

  if (role === "organization_admin" && adminSignupCode !== organization.adminSignupCode) {
    return res.status(403).json({ message: "Invalid admin signup code" });
  }

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = db.createUser({
    organizationId: organization.id,
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role,
  });

  const token = createToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });
  res.status(201).json({ token, user: safeUser(user, organization) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const expectedRole = String(req.body.role || "");
  const user = db.findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({ message: "This account cannot use this application" });
  }

  const organization = db.findOrganizationById(user.organizationId);
  const token = createToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });
  res.json({ token, user: safeUser(user, organization) });
});

router.get("/me", authenticate, (req, res) => {
  if (req.auth.role === "super_admin") {
    return res.json({ user: { email: req.auth.email, role: "super_admin" } });
  }
  const user = db.findUserById(req.auth.userId);
  const organization = db.findOrganizationById(user.organizationId);
  res.json({ user: safeUser(user, organization) });
});

module.exports = router;
