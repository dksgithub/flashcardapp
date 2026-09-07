# FlashyCardy — Current Project Prompt

This file reflects the current working state of the FlashyCardy app after the real implementation and fixes completed for database-backed auth, deck ownership, seeded demo data, and subscription handling.

## Project goal
Build and maintain a modern flashcard learning app called FlashyCardy using Next.js App Router, TypeScript, Tailwind styling, and PostgreSQL 17. The app supports:

- user sign up and sign in
- session-based authenticated dashboard
- protected deck routes
- flashcard study pages with flip interaction
- adding and deleting cards with confirmation
- deck creation with plan limits
- pro subscription flow with dummy payment processing
- unsubscribe flow back to free
- seeded user and deck data for real PostgreSQL-backed use

The app is database-driven and does not use localStorage for authentication.

---

## Current stack

- Next.js 16.3.0
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL 17
- Drizzle ORM
- pg client
- Node.js

App Router is used with server-side route handlers in app/api and data access in backend/.

---

## Current folder structure

```text
app/
  page.tsx
  dashboard/page.tsx
  dashboard/decks/[deckId]/page.tsx
  api/
    auth/
      signin/route.ts
      signup/route.ts
      signout/route.ts
    billing/
      upgrade/route.ts
      cancel/route.ts
    dashboard/route.ts
    decks/route.ts
    decks/[deckId]/route.ts
components/
  ui/
    button.tsx
frontend/
  components/
    auth-form.tsx
    dashboard-shell.tsx
    deck-study-view.tsx
    user-header.tsx
backend/
  db/
    client.ts
    schema.ts
    queries/
      users.ts
      decks.ts
      subscriptions.ts
  lib/
    auth.ts
scripts/
  seed-demo.mjs
  setup-db.mjs
db/
  schema.sql
  schema.ts
.env
```

---

## Real implemented behavior

### 1. Landing page
- Homepage shows the branded heading:
  - FlashyCardy
  - Your personal flashcard platform
- If a valid session cookie exists, the user is redirected to /dashboard.
- Otherwise they see the auth form for sign in or sign up.

### 2. Authentication flow
- Sign-up creates a real user in Postgres.
- Passwords are hashed before storing.
- Sign-in checks the DB and issues a session cookie.
- Sign-out clears the session cookie.
- Protected routes redirect to / when no valid session exists.

### 3. Dashboard
- Dashboard shows the authenticated user and active plan.
- It loads the user’s own decks from Postgres.
- Decks are clickable and open /dashboard/decks/[deckId].
- The dashboard includes create-deck, delete-deck, and subscription controls.

### 4. Deck page
- Each deck has a dedicated study page.
- The header includes the deck title and a Back to dashboard link.
- There is a user chip and sign-out control.
- Add Card allows new card creation.
- Each card flips between front and back on click.
- New cards appear at the top.
- Card deletion requires confirmation.

### 5. Card behavior
Each flashcard supports:
- front/question face
- back/answer face
- click/tap flip interaction
- immediate append-to-top display after creation
- delete confirmation before removal

---

## Database model and live setup

Use PostgreSQL 17 and the database name `flashycardy`.

The supported schema includes:

```sql
users
- id (uuid, primary key, defaultRandom)
- email (text, unique, not null)
- name (text, not null)
- password_hash (text, not null)
- account_type (text, default 'free')
- subscription_status (text, default 'inactive')
- monthly_fee (integer, default 0)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

decks
- id (uuid, primary key, defaultRandom)
- user_id (uuid, foreign key to users.id, cascade delete)
- title (text, not null)
- description (text)
- category (text)
- is_public (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)

subscriptions
- id (uuid, primary key, defaultRandom)
- user_id (uuid, foreign key to users.id, cascade delete)
- plan (text, default 'free')
- status (text, default 'inactive')
- amount (integer, default 0)
- interval (text, default 'monthly')
- started_at (timestamp)
- ends_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

cards
- id (uuid, primary key, defaultRandom)
- deck_id (uuid, foreign key to decks.id, cascade delete)
- front (text, not null)
- back (text, not null)
- created_at (timestamp)
- updated_at (timestamp)
```

Drizzle schema definitions live in backend/db/schema.ts and the live SQL schema is mirrored in db/schema.sql.

---

## Environment configuration

Use the following values in `.env`:

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

Important notes:
- The app runs on port 5000.
- The Postgres 17 database must be the live local instance, not a mock.
- The app requires real DB connectivity and session cookies for login.

---

## Required API routes

### Auth
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout

### Dashboard
- GET /api/dashboard

### Decks
- POST /api/decks
- DELETE /api/decks
- GET /api/decks/[deckId]
- POST /api/decks/[deckId]
- DELETE /api/decks/[deckId]

### Billing
- POST /api/billing/upgrade
- POST /api/billing/cancel

The app validates ownership before deck mutations and before deck retrievals.

---

## Subscription model

The app supports a simple but working subscription flow:

- Free plan allows up to 3 decks.
- Pro plan is $20/month.
- Upgrade requires dummy payment form validation: card number, expiry, and CVV.
- The payment is handled as a simulated successful payment flow.
- The user account and subscription record are updated as active Pro.
- Unsubscribe changes the user back to Free and sets the subscription inactive.

Important:
- This is not a real external payment gateway.
- It behaves like a working in-app payment flow for development and testing.

---

## Seed data and demo accounts

The app includes seeded data for two real users:

1. Demo user
   - email: demo@flashycardy.com
  - password: set locally (do not commit real credentials)

2. Test user
   - email: test@test.com
  - password: set locally (do not commit real credentials)

The original demo decks are:

1. English words and their Spanish translations
2. Questions about British history and their answers

The same deck patterns are also restored for the test user when the seed script is run.

---

## Frontend styling and UX

The app uses a polished dark theme with:

- slate/black backgrounds
- blue accent highlights
- rounded panels and cards
- subtle shadows and hover states
- strong text contrast for accessibility

The dashboard also includes plan status messaging and a simple subscription CTA.

---

## Default behaviors to preserve

- newest cards appear first
- created cards appear at the top immediately
- card flip interaction works on click
- delete requires confirmation
- dashboard and deck pages show sign-out and user identity
- deck creation is limited by account type
- free users are capped at 3 decks and pro users can create unlimited decks

---

## Run and verify commands

```bash
npm install
npm run dev
```

Optional database setup:

```bash
npm run db:setup
```

Production build:

```bash
npm run build
```

---

## Copy-paste rebuild prompt

```text
Build a FlashyCardy flashcard app using Next.js 16 App Router, TypeScript, React 19, Tailwind CSS, PostgreSQL 17, and Drizzle ORM.

Requirements:
- Dark modern dashboard and landing page
- Home page with heading “FlashyCardy” and subheading “Your personal flashcard platform”
- Sign in and sign up forms on the homepage
- Redirect signed-in users to /dashboard when they visit /
- Use real database-backed authentication with secure session cookies, no localStorage auth
- Use PostgreSQL 17 and keep connection details in the .env file
- Implement user, deck, card, and subscription tables in the database
- Seed demo user data and original flashcard decks
- Dashboard shows the authenticated user and their decks
- Each deck opens on a dedicated route and displays cards
- Flashcards support front/back flip behavior
- Add card flow and delete card flow with confirmation
- New cards appear at the top of the deck
- Deck creation is allowed up to 3 for free users and unlimited for pro users
- Implement a working dummy Pro payment flow with $20/month billing
- Include an unsubscribe option that returns the user to Free
- Use live Postgres 17 on host 127.0.0.1, port 5432, database flashycardy
- Demo accounts:
  - demo@flashycardy.com / set local demo password
  - test@test.com / set local test password
- Seed the original deck names:
  1. English words and their Spanish translations
  2. Questions about British history and their answers
- Keep route handlers under app/api and keep DB access in backend/
- Ensure the app runs on port 5000
- Keep the implementation production-ready and working in a real browser
```

---

## Final note
This is a real Postgres-backed flashcard application. The implementation is not a static mock and includes the complete user session flow, database schema, deck ownership, account plans, and a working dummy billing model for Pro upgrades and cancellations.
