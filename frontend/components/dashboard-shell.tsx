"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { UserHeader } from "@/frontend/components/user-header";

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
  accountType: "free" | "pro";
  subscriptionStatus: "active" | "inactive";
  monthlyFee: number;
};

export function DashboardShell() {
  const [user, setUser] = useState<User | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckLimit, setDeckLimit] = useState<number>(3);
  const [canCreateDeck, setCanCreateDeck] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formInfo, setFormInfo] = useState("");
  const [generateDefaultCards, setGenerateDefaultCards] = useState(true);
  const [defaultCardsPrompt, setDefaultCardsPrompt] = useState("");
  const [pendingDeleteDeckId, setPendingDeleteDeckId] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentName, setPaymentName] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState("");
  const [paymentCvv, setPaymentCvv] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

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
        setDeckLimit(data.deckLimit ?? 3);
        setCanCreateDeck(Boolean(data.canCreateDeck));
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

  async function handleUpgradeToPro() {
    const cardNumber = paymentNumber.replace(/\s+/g, "");
    const expiry = paymentExpiry.trim();
    const cvv = paymentCvv.trim();

    if (!paymentName.trim() || cardNumber.length < 12 || expiry.length < 4 || cvv.length < 3) {
      setError("Please enter a valid dummy payment method to activate the Pro plan.");
      return;
    }

    setPaymentSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          cardHolder: paymentName.trim(),
          cardNumber,
          expiry,
          cvv,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to upgrade to Pro.");
      }

      setUser(payload.user ?? null);
      setCanCreateDeck(true);
      setDeckLimit(Number.POSITIVE_INFINITY);
      setIsPaymentOpen(false);
      setPaymentName("");
      setPaymentNumber("");
      setPaymentExpiry("");
      setPaymentCvv("");
      setError("");
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "Unable to process payment.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleCancelSubscription() {
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to cancel the subscription.");
      }

      setUser(payload.user ?? null);
      setCanCreateDeck(true);
      setDeckLimit(3);
      setError("");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel the subscription.");
    }
  }

  async function handleDeleteDeck(deckId: string) {
    setDeletingDeckId(deckId);
    setError("");

    try {
      const response = await fetch("/api/decks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete deck.");
      }

      setDecks((current) => current.filter((deck) => deck.id !== deckId));
      setPendingDeleteDeckId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete deck.");
    } finally {
      setDeletingDeckId(null);
    }
  }

  async function handleCreateDeck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError("Deck title is required.");
      return;
    }

    if (!canCreateDeck && user?.accountType !== "pro") {
      setFormError("Free accounts can create up to 3 decks. Upgrade to Pro for unlimited decks.");
      return;
    }

    setCreating(true);
    setFormError("");
    setFormInfo("");

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim(),
          category: category.trim() || null,
          generateDefaultCards,
          defaultCardsPrompt: defaultCardsPrompt.trim() || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create deck.");
      }

      const createdDeck = payload.deck as Deck;
      setDecks((current) => [createdDeck, ...current]);
      setTitle("");
      setDescription("");
      setCategory("");
      setDefaultCardsPrompt("");
      setIsFormOpen(false);
      setCanCreateDeck(user?.accountType === "pro" || decks.length + 1 < deckLimit);

      const generatedCardsCount = Number(payload.generatedCardsCount ?? 0);
      const generationNote = typeof payload.generationNote === "string" ? payload.generationNote : "";
      if (generateDefaultCards) {
        setFormInfo(
          generatedCardsCount > 0
            ? `Deck created with ${generatedCardsCount} starter cards.`
            : generationNote || "Deck created. No starter cards were generated."
        );
      } else {
        setFormInfo("Deck created.");
      }
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : "Unable to create deck.");
    } finally {
      setCreating(false);
    }
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
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">
                {user?.accountType === "pro" ? "Pro plan" : "Free plan"}
              </span>
              <span className="text-sm text-slate-300">
                {user?.accountType === "pro"
                  ? `Unlimited decks • $${user.monthlyFee}/month`
                  : `${decks.length}/${deckLimit} decks used`}
              </span>
            </div>
          </div>

          <UserHeader userName={user?.name ?? "User"} onSignOut={handleSignOut} compact />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-300">
              {user?.accountType === "pro"
                ? `Subscription active: Pro plan (${user.subscriptionStatus}). You have unlimited deck creation and a $${user.monthlyFee}/month membership.`
                : `Free plan limit: ${deckLimit} decks. Upgrade to Pro for unlimited creation and a $20 monthly subscription.`}
            </div>

            <div className="flex items-center gap-3">
              {user?.accountType === "pro" ? (
                <>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">
                    Active subscription
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => void handleCancelSubscription()}>
                    Unsubscribe
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" onClick={() => setIsPaymentOpen(true)}>
                  Upgrade to Pro • $20/month
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                variant={user?.accountType === "pro" ? "secondary" : "default"}
                disabled={user?.accountType !== "pro" && !canCreateDeck}
                onClick={() => setIsFormOpen((value) => !value)}
              >
                {user?.accountType === "pro" ? "Create a deck" : "Add deck"}
              </Button>
            </div>
          </div>
        </div>

        {isPaymentOpen ? (
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Activate Pro plan</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentOpen(false)}>
                Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-sky-300">Cardholder name</span>
                <input
                  value={paymentName}
                  onChange={(event) => setPaymentName(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="Jane Doe"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">Card number</span>
                <input
                  value={paymentNumber}
                  onChange={(event) => setPaymentNumber(event.target.value.replace(/[^\d\s]/g, ""))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="4242 4242 4242 4242"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">Expiry</span>
                <input
                  value={paymentExpiry}
                  onChange={(event) => setPaymentExpiry(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="12/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">CVV</span>
                <input
                  value={paymentCvv}
                  onChange={(event) => setPaymentCvv(event.target.value.replace(/[^\d]/g, ""))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="123"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-300">Dummy payment: $20/month recurring</p>
              <Button type="button" onClick={() => void handleUpgradeToPro()} disabled={paymentSubmitting}>
                {paymentSubmitting ? "Processing..." : "Pay $20/month"}
              </Button>
            </div>
          </div>
        ) : null}

        {isFormOpen ? (
          <form onSubmit={handleCreateDeck} className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Create a new deck</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-sky-300">Deck title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="Example: Spanish travel phrases"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="Optional description for the deck"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">Category</span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  placeholder="Languages, History, Science..."
                />
              </label>

              <label className="block md:col-span-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={generateDefaultCards}
                    onChange={(event) => setGenerateDefaultCards(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  Generate up to 12 default cards with AI (only once when this deck is created)
                </span>
              </label>

              {generateDefaultCards ? (
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">
                    AI guidance (optional)
                  </span>
                  <textarea
                    value={defaultCardsPrompt}
                    onChange={(event) => setDefaultCardsPrompt(event.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    placeholder="Example: Beginner Spanish travel phrases with pronunciation hints"
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {formError ? <p className="mr-auto text-sm text-rose-300">{formError}</p> : null}
              {!formError && formInfo ? <p className="mr-auto text-sm text-emerald-300">{formInfo}</p> : null}
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating
                  ? generateDefaultCards
                    ? "Creating deck and AI cards..."
                    : "Creating deck..."
                  : "Save deck"}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-6 text-amber-200">
            {error}
          </div>
        ) : null}

        {pendingDeleteDeckId ? (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
            <p className="text-lg font-semibold text-white">Delete this deck?</p>
            <p className="mt-2 text-sm text-slate-300">
              This will permanently remove the deck and all of its cards.
            </p>
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setPendingDeleteDeckId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDeleteDeck(pendingDeleteDeckId)}
                disabled={deletingDeckId === pendingDeleteDeckId}
              >
                {deletingDeckId === pendingDeleteDeckId ? "Deleting..." : "Confirm delete"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {decks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-slate-300 md:col-span-2 xl:col-span-3">
              No decks yet. Create your first study deck to get started.
            </div>
          ) : (
            decks.map((deck) => (
              <div key={deck.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-slate-50">{deck.title}</h2>
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                    {deck.category ?? "General"}
                  </span>
                </div>

                <p className="min-h-12 text-sm text-slate-300">{deck.description ?? "A study deck ready for review."}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link href={`/dashboard/decks/${deck.id}`} className="inline-flex text-sm font-medium text-sky-300">
                    Open deck →
                  </Link>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setPendingDeleteDeckId(deck.id)}
                    disabled={deletingDeckId === deck.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
