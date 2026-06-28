import React from "react";
import { createRoot } from "react-dom/client";
import { Brand } from "./components";
import "./styles.css";

function Home() {
  return (
    <>
      <header className="topbar"><Brand /></header>
      <main className="container">
        <section className="card intro">
          <h1>Multi-Tenant Feature Flag System</h1>
          <p className="muted">Select the application for your role.</p>
        </section>
        <section className="app-links">
          <a className="card app-link" href="/super-admin/">
            <h2>Super Admin</h2>
            <p>Create and view organizations.</p>
            <span>Open application →</span>
          </a>
          <a className="card app-link" href="/admin/">
            <h2>Organization Admin</h2>
            <p>Sign up, log in, and manage feature flags.</p>
            <span>Open application →</span>
          </a>
          <a className="card app-link" href="/user/">
            <h2>End User</h2>
            <p>Check whether a feature is enabled.</p>
            <span>Open application →</span>
          </a>
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<Home />);
