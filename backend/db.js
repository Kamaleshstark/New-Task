const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const databasePath =
  process.env.DB_PATH || path.join(__dirname, "data", "database.sqlite");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const connection = new Database(databasePath);
connection.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    admin_signup_code TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('organization_admin', 'end_user')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE (organization_id, feature_key)
  );

  CREATE INDEX IF NOT EXISTS idx_users_organization
    ON users(organization_id);

  CREATE INDEX IF NOT EXISTS idx_flags_organization
    ON feature_flags(organization_id);
`);

function id() {
  return crypto.randomUUID();
}

function mapOrganization(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    adminSignupCode: row.admin_signup_code,
    createdAt: row.created_at,
    ...(row.user_count !== undefined ? { userCount: Number(row.user_count) } : {}),
    ...(row.flag_count !== undefined ? { flagCount: Number(row.flag_count) } : {}),
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapFlag(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    key: row.feature_key,
    description: row.description,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listOrganizations() {
  return connection
    .prepare(`
      SELECT
        o.*,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT f.id) AS flag_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN feature_flags f ON f.organization_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)
    .all()
    .map(mapOrganization);
}

function findOrganizationById(organizationId) {
  return mapOrganization(
    connection.prepare("SELECT * FROM organizations WHERE id = ?").get(organizationId),
  );
}

function findOrganizationBySlug(slug) {
  return mapOrganization(
    connection.prepare("SELECT * FROM organizations WHERE slug = ?").get(slug),
  );
}

function createOrganization({ name, slug, adminSignupCode }) {
  const organization = {
    id: id(),
    name,
    slug,
    adminSignupCode,
    createdAt: new Date().toISOString(),
  };
  connection
    .prepare(`
      INSERT INTO organizations (id, name, slug, admin_signup_code, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      organization.id,
      organization.name,
      organization.slug,
      organization.adminSignupCode,
      organization.createdAt,
    );
  return { ...organization, userCount: 0, flagCount: 0 };
}

function findUserById(userId) {
  return mapUser(connection.prepare("SELECT * FROM users WHERE id = ?").get(userId));
}

function findUserByEmail(email) {
  return mapUser(connection.prepare("SELECT * FROM users WHERE email = ?").get(email));
}

function createUser({ organizationId, name, email, passwordHash, role }) {
  const user = {
    id: id(),
    organizationId,
    name,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  connection
    .prepare(`
      INSERT INTO users
        (id, organization_id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      user.id,
      user.organizationId,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
    );
  return user;
}

function listFlags(organizationId) {
  return connection
    .prepare(`
      SELECT * FROM feature_flags
      WHERE organization_id = ?
      ORDER BY created_at DESC
    `)
    .all(organizationId)
    .map(mapFlag);
}

function findFlagById(idValue, organizationId) {
  return mapFlag(
    connection
      .prepare("SELECT * FROM feature_flags WHERE id = ? AND organization_id = ?")
      .get(idValue, organizationId),
  );
}

function findFlagByKey(key, organizationId) {
  return mapFlag(
    connection
      .prepare(`
        SELECT * FROM feature_flags
        WHERE feature_key = ? AND organization_id = ?
      `)
      .get(key, organizationId),
  );
}

function createFlag({ organizationId, key, description, enabled }) {
  const now = new Date().toISOString();
  const flag = {
    id: id(),
    organizationId,
    key,
    description,
    enabled,
    createdAt: now,
    updatedAt: now,
  };
  connection
    .prepare(`
      INSERT INTO feature_flags
        (id, organization_id, feature_key, description, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      flag.id,
      flag.organizationId,
      flag.key,
      flag.description,
      flag.enabled ? 1 : 0,
      flag.createdAt,
      flag.updatedAt,
    );
  return flag;
}

function updateFlag(idValue, organizationId, changes) {
  const current = findFlagById(idValue, organizationId);
  if (!current) return null;

  const updated = {
    ...current,
    enabled:
      typeof changes.enabled === "boolean" ? changes.enabled : current.enabled,
    description:
      typeof changes.description === "string"
        ? changes.description.trim()
        : current.description,
    updatedAt: new Date().toISOString(),
  };
  connection
    .prepare(`
      UPDATE feature_flags
      SET enabled = ?, description = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `)
    .run(
      updated.enabled ? 1 : 0,
      updated.description,
      updated.updatedAt,
      idValue,
      organizationId,
    );
  return updated;
}

function deleteFlag(idValue, organizationId) {
  return (
    connection
      .prepare("DELETE FROM feature_flags WHERE id = ? AND organization_id = ?")
      .run(idValue, organizationId).changes > 0
  );
}

function close() {
  connection.close();
}

module.exports = {
  databasePath,
  listOrganizations,
  findOrganizationById,
  findOrganizationBySlug,
  createOrganization,
  findUserById,
  findUserByEmail,
  createUser,
  listFlags,
  findFlagById,
  findFlagByKey,
  createFlag,
  updateFlag,
  deleteFlag,
  close,
};
