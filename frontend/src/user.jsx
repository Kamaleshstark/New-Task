import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { AppLayout, AuthPage, Button, Message } from "./components";
import "./styles.css";

const TOKEN_KEY = "endUserToken";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationSlug: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "login"
        ? { email: form.email, password: form.password, role: "end_user" }
        : { ...form, role: "end_user" };
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
    <AuthPage title="End User" description="Sign in or create an account for your organization.">
      <div className="tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Signup</button>
      </div>
      <Message error>{error}</Message>
      <form onSubmit={submit}>
        {mode === "signup" && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {mode === "signup" && <label>Organization slug<input value={form.organizationSlug} onChange={(e) => setForm({ ...form, organizationSlug: e.target.value })} required /></label>}
        <Button loading={loading}>{mode === "login" ? "Log in" : "Create account"}</Button>
      </form>
    </AuthPage>
  );
}

function FeatureChecker({ user, onLogout }) {
  const [key, setKey] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkFeature(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      setResult(await api("/flags/check", {
        method: "POST",
        token: localStorage.getItem(TOKEN_KEY),
        body: { key },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Check Feature Availability" user={user} onLogout={onLogout}>
      <section className="card" style={{ maxWidth: 600 }}>
        <p className="muted">Enter a feature key to check it for {user.organization.name}.</p>
        <Message error>{error}</Message>
        <form onSubmit={checkFeature}>
          <label>Feature key<input placeholder="new_dashboard" value={key} onChange={(e) => setKey(e.target.value)} required /></label>
          <Button loading={loading}>Check feature</Button>
        </form>
        {result && (
          <div className={`result ${result.enabled ? "enabled" : "disabled"}`}>
            {result.key} is {result.enabled ? "Enabled" : "Disabled"}
            {!result.exists && <div><small>Feature key not found; it defaults to disabled.</small></div>}
          </div>
        )}
      </section>
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
      .then(({ user: current }) => current.role === "end_user" ? setUser(current) : Promise.reject())
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };
  if (checking) return <div className="loading">Loading...</div>;
  return user ? <FeatureChecker user={user} onLogout={logout} /> : <Auth onLogin={setUser} />;
}

createRoot(document.getElementById("root")).render(<App />);
