const express = require("express");
const config = require("../config");
const db = require("../db");
const { createToken, authenticate, allowRoles } = require("../auth");

const router = express.Router();

function publicOrganization(organization) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.createdAt,
    userCount: organization.userCount,
    flagCount: organization.flagCount,
  };
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== config.superAdminEmail || password !== config.superAdminPassword) {
    return res.status(401).json({ message: "Invalid super admin credentials" });
  }

  const token = createToken({ role: "super_admin", email });
  res.json({ token, user: { email, role: "super_admin" } });
});

router.use(authenticate, allowRoles("super_admin"));

router.get("/organizations", (req, res) => {
  res.json(db.listOrganizations().map(publicOrganization));
});

router.post("/organizations", (req, res) => {
  const name = String(req.body.name || "").trim();
  const slug = String(req.body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const adminSignupCode = String(req.body.adminSignupCode || "").trim();

  if (!name || !slug || !adminSignupCode) {
    return res.status(400).json({ message: "Name, slug, and admin signup code are required" });
  }

  if (db.findOrganizationBySlug(slug)) {
    return res.status(409).json({ message: "An organization with this slug already exists" });
  }

  const organization = db.createOrganization({
    name,
    slug,
    adminSignupCode,
  });

  res.status(201).json(publicOrganization(organization));
});

module.exports = router;
