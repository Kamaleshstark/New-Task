import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { AppLayout, AuthPage, Button, Message } from "./components";
import "./styles.css";

const TOKEN_KEY = "organizationAdminToken";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "", email: "", password: "", organizationSlug: "", adminSignupCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "login"
        ? { email: form.email, password: form.password, role: "organization_admin" }
        : { ...form, role: "organization_admin" };
      const data = await api(mode === "login" ? "/auth/login" : "/auth/signup", {
        method: "POST", body,
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
    <AuthPage title="Organization Admin" description="Sign in or create an admin account.">
      <div className="tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Signup</button>
      </div>
      <Message error>{error}</Message>
      <form onSubmit={submit}>
        {mode === "signup" && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {mode === "signup" && <>
          <label>Organization slug<input value={form.organizationSlug} onChange={(e) => setForm({ ...form, organizationSlug: e.target.value })} required /></label>
          <label>Admin signup code<input type="password" value={form.adminSignupCode} onChange={(e) => setForm({ ...form, adminSignupCode: e.target.value })} required /></label>
        </>}
        <Button loading={loading}>{mode === "login" ? "Log in" : "Create account"}</Button>
      </form>
    </AuthPage>
  );
}

function Dashboard({ user, onLogout }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const [flags, setFlags] = useState([]);
  const [form, setForm] = useState({ key: "", description: "", enabled: false });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadFlags() {
    try { setFlags(await api("/flags", { token })); }
    catch { onLogout(); }
  }
  useEffect(() => { loadFlags(); }, []);

  async function createFlag(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/flags", { method: "POST", token, body: form });
      setForm({ key: "", description: "", enabled: false });
      setMessage("Feature flag created.");
      loadFlags();
    } catch (err) { setError(err.message); }
  }

  async function toggleFlag(flag) {
    await api(`/flags/${flag.id}`, {
      method: "PATCH", token, body: { enabled: !flag.enabled },
    });
    setMessage(`Feature ${flag.enabled ? "disabled" : "enabled"}.`);
    loadFlags();
  }

  async function updateDescription(event) {
    event.preventDefault();
    await api(`/flags/${editing.id}`, {
      method: "PATCH", token, body: { description: editing.description },
    });
    setEditing(null);
    setMessage("Feature flag updated.");
    loadFlags();
  }

  async function deleteFlag(flag) {
    if (!window.confirm(`Delete ${flag.key}?`)) return;
    await api(`/flags/${flag.id}`, { method: "DELETE", token });
    setMessage("Feature flag deleted.");
    loadFlags();
  }

  return (
    <AppLayout title="Feature Flag Management" user={user} onLogout={onLogout}>
      <Message>{message}</Message>
      <Message error>{error}</Message>
      <div className="two-column">
        <section className="card">
          <h2>Create Feature Flag</h2>
          <form onSubmit={createFlag}>
            <label>Feature key<input placeholder="new_dashboard" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required /></label>
            <label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
            <Button>Create flag</Button>
          </form>
        </section>
        <section className="card">
          <h2>Feature Flags</h2>
          {flags.length ? <div className="list">
            {flags.map((flag) => (
              <article className="list-item" key={flag.id}>
                <div>
                  <h3>{flag.key}<span className={`status ${flag.enabled ? "enabled" : ""}`}>{flag.enabled ? "Enabled" : "Disabled"}</span></h3>
                  <p>{flag.description || "No description"}</p>
                </div>
                <div className="actions">
                  <Button className="small" onClick={() => toggleFlag(flag)}>{flag.enabled ? "Disable" : "Enable"}</Button>
                  <Button secondary className="small" onClick={() => setEditing({ ...flag })}>Edit</Button>
                  <button className="danger small" onClick={() => deleteFlag(flag)}>Delete</button>
                </div>
              </article>
            ))}
          </div> : <div className="empty">No feature flags created yet.</div>}
        </section>
      </div>
      {editing && <section className="card" style={{ marginTop: 20 }}>
        <h2>Edit {editing.key}</h2>
        <form onSubmit={updateDescription}>
          <label>Description<textarea rows="3" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
          <div className="actions">
            <Button>Save changes</Button>
            <Button type="button" secondary onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      </section>}
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
      .then(({ user: current }) => current.role === "organization_admin" ? setUser(current) : Promise.reject())
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };
  if (checking) return <div className="loading">Loading...</div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Auth onLogin={setUser} />;
}

createRoot(document.getElementById("root")).render(<App />);
