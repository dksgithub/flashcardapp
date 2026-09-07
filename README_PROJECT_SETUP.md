# FlashyCardy Project Setup Guide

This guide explains how to set up and run the FlashyCardy flashcard application on a fresh machine.

## 1. Project overview

FlashyCardy is a modern flashcard learning app built with:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL 17
- Drizzle ORM
- Node.js

The app includes:

- sign up and sign in
- protected dashboard
- deck browsing
- deck study view with flip cards
- add card flow
- delete card with confirmation
- newest-first ordering
- PostgreSQL-backed session auth

## 2. Prerequisites

Before running the project, install:

- Node.js 20+
- PostgreSQL 17
- npm
- a local PostgreSQL database server running on port 5432

## 3. Clone and install dependencies

```bash
git clone <your-repo-url>
cd flashcardapp
npm install
```

## 4. Database setup

Make sure PostgreSQL 17 is running locally.

Create the database:

```bash
createdb -h localhost -U postgres flashycardy
```

Then create the required schema using Drizzle or SQL.

### Recommended option: Drizzle

```bash
npm run db:generate
npm run db:push
```

If the project includes a setup helper:

```bash
npm run db:setup
```

## 5. Environment configuration

Create a `.env` file in the project root with:

```env
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
DATABASE_URL=postgresql://your_db_user:your_db_password@127.0.0.1:5432/your_db_name
AUTH_SECRET=replace_with_long_random_secret
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

## 6. Seed demo data

If you want sample content immediately, create a demo user and deck data. The app expects a user like:

- Email: test@test.com
- Password: set locally (do not commit real credentials)

Seed at least these decks:

1. English words and their Spanish translations
2. Questions about British history and their answers

## 7. Run the app

Start the development server:

```bash
npm run dev
```

The app is configured to run on port 5000.

Open:

```text
http://localhost:5000
```

## 8. Production build

```bash
npm run build
npm run start
```

## 9. Key project conventions

- Auth is database-backed and uses server-side cookies
- No localStorage-based auth
- API routes live under `app/api`
- Data access logic lives under `backend/db` and `backend/lib`
- Frontend UI components live under `frontend/components` and `components`
- Protected routes redirect to `/` if the session is invalid

## 10. Notes for future reproduction

When rebuilding this project:

- keep the app on port 5000
- use Drizzle with PostgreSQL 17
- use real session cookies, not frontend-only auth
- ensure the dashboard and deck pages are protected
- maintain newest-first card ordering
- include delete confirmation before removing cards

---

This project should be run as a fully functional database-backed flashcard application, not as a mock or static demo.
