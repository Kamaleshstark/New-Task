import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { AppLayout, AuthPage, Button, Message } from "./components";
import "./styles.css";

const TOKEN_KEY = "superAdminToken";

function Login({ onLogin }) {
  const [email, setEmail] = useState("superadmin@example.com");
  const [password, setPassword] = useState("SuperAdmin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/super-admin/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage title="Super Admin Login" description="Use the configured static credentials.">
      <Message error>{error}</Message>
      <form onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <Button loading={loading}>Log in</Button>
      </form>
    </AuthPage>
  );
}

function Dashboard({ user, onLogout }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "", adminSignupCode: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrganizations() {
    try {
      setOrganizations(await api("/super-admin/organizations", { token }));
    } catch {
      onLogout();
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadOrganizations(); }, []);

  async function createOrganization(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api("/super-admin/organizations", { method: "POST", token, body: form });
      setForm({ name: "", slug: "", adminSignupCode: "" });
      setMessage("Organization created successfully.");
      loadOrganizations();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout title="Super Admin" user={user} onLogout={onLogout}>
      <div className="two-column">
        <section className="card">
          <h2>Create Organization</h2>
          <Message>{message}</Message>
          <Message error>{error}</Message>
          <form onSubmit={createOrganization}>
            <label>Organization name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Organization slug<input placeholder="example-company" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></label>
            <label>Admin signup code<input value={form.adminSignupCode} onChange={(e) => setForm({ ...form, adminSignupCode: e.target.value })} required /></label>
            <Button>Create organization</Button>
          </form>
        </section>
        <section className="card">
          <div className="section-header">
            <div><h2>Organizations</h2><p className="muted">All registered organizations.</p></div>
          </div>
          {loading ? <div className="loading">Loading...</div> : organizations.length ? (
            <div className="list">
              {organizations.map((organization) => (
                <article className="list-item" key={organization.id}>
                  <div>
                    <h3>{organization.name}</h3>
                    <p>Slug: {organization.slug}</p>
                  </div>
                  <small>{organization.userCount} users · {organization.flagCount} flags</small>
                </article>
              ))}
            </div>
          ) : <div className="empty">No organizations created yet.</div>}
        </section>
      </div>
    </AppLayout>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    api("/auth/me", { token })
      .then(({ user: current }) => setUser(current))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };
  if (checking) return <div className="loading">Loading...</div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Login onLogin={setUser} />;
}

createRoot(document.getElementById("root")).render(<App />);
