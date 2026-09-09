# FlashyCardy

This project uses the PostgreSQL 17 instance already running on the laptop.

## Local Postgres 17 setup

1. Make sure your local PostgreSQL 17 server is running and `.env` has your `POSTGRES_*` / `DATABASE_URL` values set (see `.env.example`).

2. Run the complete setup in one command — creates the database if missing, applies `db/schema.sql` (extension, tables, triggers), and seeds the demo user/deck/card data:

   ```bash
   npm run db:init
   ```

   This runs `db:setup` (database + schema) followed by `db:seed` (demo data). You can also run each step on its own:

   ```bash
   npm run db:setup   # create database + apply schema.sql
   npm run db:seed    # seed demo user, decks, and cards (src/index.ts)
   ```

   Equivalent manual steps, if you prefer raw psql:

   ```bash
   createdb -h localhost -U postgres flashycardy
   psql -h localhost -U postgres -d flashycardy -f db/schema.sql
   npx tsx src/index.ts
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

## Database connection

The app uses the shared Postgres client at [db/client.ts](db/client.ts) and all queries should be wrapped in helper functions inside [db/queries](db/queries). The connection string is configured to use the local PostgreSQL 17 instance on port 5432 with the `flashycardy` database.

## Git security checks

This repo includes a local pre-commit hook that scans staged files for common secret patterns.

1. Install the hook path once per clone:

   ```bash
   npm run hooks:install
   ```

2. Run a manual scan any time:

   ```bash
   npm run secrets:check
   ```

3. Commit normally. The hook runs automatically and blocks commits if potential secrets are detected.

### Rules enforced by the scanner

- Private key blocks
- Common token formats (for example GitHub or cloud keys)
- Hardcoded AUTH_SECRET values
- Hardcoded POSTGRES_PASSWORD values (except approved placeholders)
- Hardcoded DATABASE_URL credentials (except approved placeholders)

### If a commit is blocked

1. Remove the secret from the staged file.
2. Replace with environment variables or placeholders.
3. Re-stage the file and commit again.
