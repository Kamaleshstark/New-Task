# SQLite database setup

This project uses SQLite, which satisfies the assignment requirement:

> Database: Any (SQL or NoSQL)

SQLite is a real relational SQL database stored in one local file. It does not
require MySQL, MongoDB, Docker, a database account, or a separate database
server.

## Start the database connection

The database connection starts automatically with the backend:

```powershell
cd "C:\Users\Kamal\OneDrive\Documents\New project 2"
npm.cmd run dev:server
```

The backend creates this file:

```text
backend\data\database.sqlite
```

The connection and SQL schema are defined in:

```text
backend\db.js
```

## Tables

### organizations

Stores organizations created by the Super Admin.

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `name` | Organization name |
| `slug` | Unique organization identifier |
| `admin_signup_code` | Code required for admin signup |
| `created_at` | Creation timestamp |

### users

Stores Organization Admin and End User accounts.

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `organization_id` | Foreign key to organizations |
| `name` | User name |
| `email` | Unique login email |
| `password_hash` | bcrypt password hash |
| `role` | `organization_admin` or `end_user` |
| `created_at` | Creation timestamp |

### feature_flags

Stores organization-scoped feature flags.

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `organization_id` | Foreign key to organizations |
| `feature_key` | Feature identifier |
| `description` | Human-readable description |
| `enabled` | `1` for enabled, `0` for disabled |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

The combination of `organization_id` and `feature_key` is unique. This lets two
organizations use the same feature key while preventing duplicates inside one
organization.

## View the database in VS Code

1. Open VS Code Extensions with `Ctrl+Shift+X`.
2. Search for **SQLite Viewer**.
3. Install it.
4. Start the backend once so the database file is created.
5. Open `backend/data/database.sqlite`.

You can then inspect all three tables and their saved rows.

## Use a different database file

The default location is normally enough. To change it, add an absolute path to
your `.env` file:

```env
DB_PATH=C:/data/feature-flags.sqlite
```

Restart the backend after changing `.env`.

## Reset local data

Stop the backend, delete `backend/data/database.sqlite` and its optional `-wal`
and `-shm` files, then start the backend again. The empty tables will be
recreated automatically.
