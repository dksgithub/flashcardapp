Build a FlashyCardy flashcard app using Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, PostgreSQL 17, and Drizzle ORM.

Requirements:
- Dark modern UI with a polished flashcard app feel
- Homepage shows "FlashyCardy" and the subtitle "Your personal flashcard platform"
- Sign in and sign up forms on the landing page
- Redirect signed-in users to /dashboard
- Use secure session cookies for authentication; no localStorage auth
- Database-backed auth with users table and password hashing
- Dashboard shows the signed-in user, a user chip with initials, and a sign out button
- Dashboard lists the user’s decks and each deck is clickable
- Deck study page at /dashboard/decks/[deckId]
- Each deck has a Back to dashboard link, username chip, sign out, Add Card button with plus icon
- Flashcards flip between question and answer on click
- New cards appear at the top immediately
- Card deletion requires confirmation before removal
- Keep cards ordered newest-first
- Protect pages; if not signed in, redirect to /
- Use PostgreSQL 17 and environment-based configuration
- App runs on port 5000
- Seed a demo user: test@test.com / set local password
- Seed two decks for that user:
  1. English words and their Spanish translations
  2. Questions about British history and their answers
- Use Drizzle schema with users, decks, and cards tables
- Keep backend APIs under app/api and DB logic under backend/db and backend/lib
- Keep frontend components in frontend/components
- Use a real database and actual session logic, not mock auth
- Ensure the app is production-ready and stable

Use these env values:
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
DATABASE_URL=postgresql://your_db_user:your_db_password@127.0.0.1:5432/your_db_name
AUTH_SECRET=replace_with_long_random_secret
NEXT_PUBLIC_APP_URL=http://localhost:5000

Implementation notes:
- Use Next.js App Router structure
- Keep code organized in app/, frontend/, backend/, components/
- Use TypeScript throughout
- Include DB query helpers and route handlers for sign in, sign up, sign out, dashboard, and deck actions
- Keep the project polished and easy to run on another machine
