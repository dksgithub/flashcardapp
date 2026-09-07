import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AuthForm } from "@/frontend/components/auth-form";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = verifySessionToken(sessionValue);

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-xl text-center lg:text-left">
          <p className="mb-4 inline-flex rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">
            Flashcard learning, simplified
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">FlashyCardy</h1>
          <p className="mt-5 text-lg text-slate-300 sm:text-xl">
            Your personal flashcard platform
          </p>
        </div>

        <AuthForm />
      </div>
    </main>
  );
}
