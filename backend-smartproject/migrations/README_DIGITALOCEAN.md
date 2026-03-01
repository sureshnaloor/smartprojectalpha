# DigitalOcean PostgreSQL – migrations and schema sync

## Sync full schema from local to remote (recommended if tables are out of sync)

To make the **remote** database match your **local** schema (tables, columns, relations, indexes from `src/schema.ts`), use the push script. **All data on the remote DB will be dropped.**

From your laptop (with the repo and remote DB reachable):

```bash
cd backend-smartproject
# Set your DigitalOcean DB URL (get from DO control panel → Databases → connection string)
export REMOTE_DATABASE_URL="postgresql://user:password@your-do-host:25060/defaultdb?sslmode=require"
npm run db:push:remote
```

Or add `REMOTE_DATABASE_URL` to `.env` and run:

```bash
npm run db:push:remote
```

This will:
1. Connect to the remote DB
2. Drop the `public` schema (and all tables) on remote
3. Run `drizzle-kit push` so remote gets the same schema as `src/schema.ts`

Your local DB is unchanged. Use this when remote is missing tables/columns or has different structure.

## Sync schema from the *actual local database* (source of truth = local Postgres)

If you don’t want to rely on `src/schema.ts` and instead want to copy the schema from the **local PostgreSQL database itself**, use the clone script. This uses `pg_dump --schema-only` from local and applies it to remote via `psql`.

**This drops the remote `public` schema and recreates it. Remote data will be lost.**

Requirements: `pg_dump` and `psql` in PATH.

```bash
cd backend-smartproject
export LOCAL_DATABASE_URL="postgresql://user:pass@localhost:5432/your_local_db"
export REMOTE_DATABASE_URL="postgresql://user:pass@your-do-host:25060/defaultdb?sslmode=require"
npm run db:clone:schema:to-remote
```

---

# Fix "allocation_version does not exist" on DigitalOcean

The `projects` table is **not** deleted. It is missing the **allocation_version** column that the app expects. Add it with one of the options below.

## Option A: Run the migration script (uses your app’s DATABASE_URL)

Wherever your **DigitalOcean DATABASE_URL** is set (e.g. App Platform env, or a `.env` that points at DO):

```bash
cd backend-smartproject
# DATABASE_URL is loaded from .env, or set it explicitly:
# export DATABASE_URL="postgresql://user:password@your-do-db-host:25060/defaultdb?sslmode=require"
npm run db:migrate:allocation-version
```

If your app runs on DigitalOcean App Platform, you can run this same command as a **one-off job** or **console** with the same env vars as your app (so it uses the DO database).

## Option B: Run SQL in DigitalOcean’s UI

If you use **DigitalOcean Managed Database**:

1. In the control panel go to **Databases** → your cluster.
2. Open the **Connection** or **Connection details** section.
3. If there is a **“Query”** / **“SQL”** / **“Web SQL”** or similar, open it and run:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS allocation_version INTEGER;
```

4. If there is no SQL runner, use **“Connection parameters”** to get host, port, user, database. Reset the user password if needed, then use **Option C**.

## Option C: Use psql with DO connection details

After you have the connection string (or host, port, user, password, database) from the DO control panel:

```bash
cd backend-smartproject
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -f migrations/0023_add_allocation_version_to_projects.sql
```

Or reset the DB user password in **Databases** → **Users & Databases** → **Reset password**, then run the script or `npm run db:migrate:allocation-version` with the new URL.

---

After the column exists, restart your app (or let it redeploy). Projects list and create should work again.
