"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Deck = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
};

type User = {
  id: string;
  name: string;
  email: string;
};

export function DashboardShell() {
  const [user, setUser] = useState<User | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/";
            return;
          }

          throw new Error("Unable to load dashboard data.");
        }

        const data = await response.json();
        setUser(data.user);
        setDecks(data.decks ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
        <div className="mx-auto max-w-5xl">Loading your dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Welcome back, {user?.name ?? "Learner"}</h1>
          </div>

          <Button type="button" variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-6 text-amber-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {decks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-slate-300 md:col-span-2 xl:col-span-3">
              No decks yet. Create your first study deck to get started.
            </div>
          ) : (
            decks.map((deck) => (
              <article key={deck.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-slate-50">{deck.title}</h2>
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                    {deck.category ?? "General"}
                  </span>
                </div>

                <p className="min-h-12 text-sm text-slate-300">{deck.description ?? "A study deck ready for review."}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
