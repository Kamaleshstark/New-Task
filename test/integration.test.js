const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const testDatabase = path.join(__dirname, "..", "backend", "data", "integration.test.sqlite");
process.env.DB_PATH = testDatabase;
process.env.JWT_SECRET = "integration-test-secret";

if (fs.existsSync(testDatabase)) fs.unlinkSync(testDatabase);
const app = require("../backend/server");

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  require("../backend/db").close();
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = `${testDatabase}${suffix}`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

async function request(route, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

test("full workflow and tenant isolation", async () => {
  const health = await request("/api/health");
  assert.equal(health.status, 200);

  const superLogin = await request("/api/super-admin/login", {
    method: "POST",
    body: { email: "superadmin@example.com", password: "SuperAdmin123!" },
  });
  assert.equal(superLogin.status, 200);

  for (const organization of [
    { name: "Acme", slug: "acme", adminSignupCode: "acme-secret" },
    { name: "Beta", slug: "beta", adminSignupCode: "beta-secret" },
  ]) {
    const created = await request("/api/super-admin/organizations", {
      method: "POST",
      token: superLogin.data.token,
      body: organization,
    });
    assert.equal(created.status, 201);
  }

  const adminSignup = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Acme Admin",
      email: "admin@acme.test",
      password: "Password123!",
      organizationSlug: "acme",
      adminSignupCode: "acme-secret",
      role: "organization_admin",
    },
  });
  assert.equal(adminSignup.status, 201);

  const flag = await request("/api/flags", {
    method: "POST",
    token: adminSignup.data.token,
    body: { key: "new_dashboard", description: "Dashboard rollout", enabled: true },
  });
  assert.equal(flag.status, 201);

  const acmeUser = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Acme User",
      email: "user@acme.test",
      password: "Password123!",
      organizationSlug: "acme",
      role: "end_user",
    },
  });
  const acmeCheck = await request("/api/flags/check", {
    method: "POST",
    token: acmeUser.data.token,
    body: { key: "new_dashboard" },
  });
  assert.deepEqual(acmeCheck.data, { key: "new_dashboard", enabled: true, exists: true });

  const betaUser = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Beta User",
      email: "user@beta.test",
      password: "Password123!",
      organizationSlug: "beta",
      role: "end_user",
    },
  });
  const betaCheck = await request("/api/flags/check", {
    method: "POST",
    token: betaUser.data.token,
    body: { key: "new_dashboard" },
  });
  assert.deepEqual(betaCheck.data, { key: "new_dashboard", enabled: false, exists: false });

  const forbiddenList = await request("/api/flags", { token: acmeUser.data.token });
  assert.equal(forbiddenList.status, 403);

  const toggled = await request(`/api/flags/${flag.data.id}`, {
    method: "PATCH",
    token: adminSignup.data.token,
    body: { enabled: false },
  });
  assert.equal(toggled.data.enabled, false);
});
