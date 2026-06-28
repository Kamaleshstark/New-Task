<<<<<<< HEAD
# Multi-Tenant Feature Flag Management System

A complete assignment implementation with one Node.js/Express backend and three separate React applications:

- **Super Admin:** creates and lists organizations
- **Organization Admin:** signs up, logs in, and manages flags for one organization
- **End User:** signs up, logs in, and checks flags for one organization

## Quick start

Requirements: Node.js 18 or newer.

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd start
```

Open [http://localhost:4000](http://localhost:4000).

`npm.cmd start` builds the React applications and then starts Express.

The default Super Admin credentials are:

```text
Email: superadmin@example.com
Password: SuperAdmin123!
```

Change these credentials and `JWT_SECRET` in `.env` for anything beyond local demonstration.

## Demo workflow

1. Open **Super Admin** and log in.
2. Create an organization, for example:
   - Name: `Acme`
   - Slug: `acme`
   - Admin signup code: `acme-secret`
3. Open **Organization Admin**.
4. Sign up using organization slug `acme` and code `acme-secret`.
5. Create a flag such as `new_dashboard` and enable it.
6. Open **End User**.
7. Sign up using organization slug `acme` (end users do not need the admin code).
8. Enter `new_dashboard` and click **Check feature**.

## How the frontends connect to the backend

In production, Vite builds all React applications into `frontend/dist` and Express serves them. They call relative URLs such as `/api/auth/login`. The shared request helper is:

```js
const response = await fetch("/api/flags", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

See [`frontend/src/api.js`](frontend/src/api.js). It:

1. Adds the `/api` prefix.
2. Sends request bodies as JSON.
3. Adds the JWT as a Bearer token.
4. Converts backend errors into JavaScript errors the UI can display.

After login or signup, each frontend stores its JWT in `localStorage`. Protected backend routes verify that token and use its `organizationId`; they do not accept an organization ID from the browser for flag operations. This prevents an admin or user from switching to another tenant by changing a request body.

## REST API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/super-admin/login` | Public | Static Super Admin login |
| `GET` | `/api/super-admin/organizations` | Super Admin | List organizations |
| `POST` | `/api/super-admin/organizations` | Super Admin | Create organization |
| `POST` | `/api/auth/signup` | Public | Create organization admin or end-user account |
| `POST` | `/api/auth/login` | Public | Organization user login |
| `GET` | `/api/auth/me` | Authenticated | Current user and organization |
| `GET` | `/api/flags` | Organization Admin | List own organization's flags |
| `POST` | `/api/flags` | Organization Admin | Create a flag |
| `PATCH` | `/api/flags/:id` | Organization Admin | Update a flag |
| `DELETE` | `/api/flags/:id` | Organization Admin | Delete a flag |
| `POST` | `/api/flags/check` | Admin or End User | Check a flag in token's organization |

## Project structure

```text
backend/
  auth.js                 JWT authentication and role authorization
  config.js               Environment configuration
  db.js                   SQLite connection, schema, and SQL queries
  routes/
    auth.js               Organization admin/end-user signup and login
    flags.js              Tenant-scoped flag operations
    superAdmin.js         Super Admin operations
  server.js               Express application and static frontend hosting
frontend/
  super-admin/            Super Admin HTML entry
  admin/                  Organization Admin HTML entry
  user/                   End User HTML entry
  src/
    super-admin.jsx       Super Admin React application
    admin.jsx             Organization Admin React application
    user.jsx              End User React application
    components.jsx        Shared React components
    styles.css            Shared basic responsive styling
  vite.config.js          Multi-page React build and API proxy
```

## Data model

The backend uses **SQLite**, a relational SQL database. It automatically creates:

```text
backend/data/database.sqlite
```

No separate database server, username, or password is needed. Node.js opens this
file through the `better-sqlite3` driver when the backend starts.

The normalized SQL tables are:

```text
organizations
  id, name, slug, admin_signup_code, created_at

users
  id, organization_id, name, email, password_hash, role, created_at

feature_flags
  id, organization_id, feature_key, description, enabled, created_at, updated_at
```

`users.organization_id` and `feature_flags.organization_id` are foreign keys to
`organizations.id`. Feature keys are unique inside an organization, not globally.
Passwords are hashed with bcrypt, and roles are persisted in the `users` table.

To inspect the database visually, install the VS Code extension
**SQLite Viewer**, then open `backend/data/database.sqlite`.

## Engineering trade-offs

- SQLite keeps the assignment easy to run while demonstrating normalized SQL tables, foreign keys, indexes, uniqueness constraints, and parameterized queries. For high concurrent production traffic, PostgreSQL would be the natural next step.
- JWTs are valid for eight hours. A production version should use secure HTTP-only cookies or a refresh-token strategy, token revocation, rate limiting, and HTTPS.
- Admin signup codes are deliberately simple for the exercise. In production they should be hashed, expiring, and single-use invitations.
- Unknown feature keys safely evaluate to `disabled`.
- Tenant isolation happens in backend queries using the authenticated token's `organizationId`.

## Useful commands

```powershell
npm.cmd run dev     # React dev server + Express API with live reload
npm.cmd run build   # build all three React applications
npm.cmd start       # production build followed by Express server
npm.cmd test        # backend integration tests
```

During development:

- React/Vite: [http://localhost:5173](http://localhost:5173)
- Express API: [http://localhost:4000/api](http://localhost:4000/api)

Vite proxies `/api` requests to Express, so the React code uses the same relative API URLs in development and production.
=======
# New-Task
>>>>>>> f944bbb8d83b2c550dc555fb4530de6f17bd6a20
