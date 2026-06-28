import { Flag, LogOut } from "lucide-react";

export function Brand() {
  return (
    <a className="brand" href="/">
      <Flag size={20} /> Feature Flags
    </a>
  );
}

export function Message({ error, children }) {
  if (!children) return null;
  return <div className={`message ${error ? "error" : ""}`}>{children}</div>;
}

export function Button({ children, loading, secondary = false, ...props }) {
  return (
    <button className={secondary ? "secondary" : ""} disabled={loading} {...props}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

export function AuthPage({ title, description, children }) {
  return (
    <main className="auth-page">
      <section className="card auth-card">
        <Brand />
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        {children}
        <a className="back-link" href="/">← Back to applications</a>
      </section>
    </main>
  );
}

export function AppLayout({ title, user, onLogout, children }) {
  return (
    <>
      <header className="topbar">
        <Brand />
        <div className="user-area">
          <span>{user?.organization?.name || user?.email}</span>
          <button className="secondary small" onClick={onLogout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </header>
      <main className="container">
        <h1>{title}</h1>
        {children}
      </main>
    </>
  );
}
