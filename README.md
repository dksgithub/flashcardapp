# FlashyCardy

This project uses the PostgreSQL 17 instance already running on the laptop.

## Local Postgres 17 setup

1. Make sure your local PostgreSQL 17 server is running.

2. Create the database if it does not already exist:

   ```bash
   createdb -h localhost -U postgres flashycardy
   ```

3. Initialize the schema:

   ```bash
   psql -h localhost -U postgres -d flashycardy -f db/schema.sql
   ```

4. Seed the demo user and flashcard data:

   ```bash
   npx tsx src/index.ts
   ```

5. Start the app:

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
