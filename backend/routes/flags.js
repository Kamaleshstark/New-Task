const express = require("express");
const db = require("../db");
const { authenticate, allowRoles } = require("../auth");

const router = express.Router();
router.use(authenticate);

router.get("/", allowRoles("organization_admin"), (req, res) => {
  res.json(db.listFlags(req.auth.organizationId));
});

router.post("/", allowRoles("organization_admin"), (req, res) => {
  const key = String(req.body.key || "").trim().toLowerCase();
  const description = String(req.body.description || "").trim();
  const enabled = Boolean(req.body.enabled);

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(key)) {
    return res.status(400).json({
      message: "Key must be 2-64 characters and contain lowercase letters, numbers, _ or -",
    });
  }

  if (db.findFlagByKey(key, req.auth.organizationId)) {
    return res.status(409).json({ message: "This feature key already exists" });
  }

  const flag = db.createFlag({
    organizationId: req.auth.organizationId,
    key,
    description,
    enabled,
  });
  res.status(201).json(flag);
});

router.patch("/:id", allowRoles("organization_admin"), (req, res) => {
  const flag = db.updateFlag(
    req.params.id,
    req.auth.organizationId,
    req.body,
  );
  if (!flag) return res.status(404).json({ message: "Feature flag not found" });
  res.json(flag);
});

router.delete("/:id", allowRoles("organization_admin"), (req, res) => {
  const deleted = db.deleteFlag(req.params.id, req.auth.organizationId);
  if (!deleted) return res.status(404).json({ message: "Feature flag not found" });
  res.status(204).end();
});

router.post("/check", allowRoles("end_user", "organization_admin"), (req, res) => {
  const key = String(req.body.key || "").trim().toLowerCase();
  if (!key) return res.status(400).json({ message: "Feature key is required" });

  const flag = db.findFlagByKey(key, req.auth.organizationId);
  res.json({ key, enabled: flag?.enabled ?? false, exists: Boolean(flag) });
});

module.exports = router;
