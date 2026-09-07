"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { UserHeader } from "@/frontend/components/user-header";

type Card = {
  id: string;
  front: string;
  back: string;
  createdAt?: string;
};

type DeckStudyViewProps = {
  deck: {
    id: string;
    title: string;
    description: string | null;
  };
  cards: Card[];
  user: {
    id: string;
    name: string;
    email: string;
    accountType: "free" | "pro";
    subscriptionStatus: "active" | "inactive";
    monthlyFee: number;
  } | null;
};

export function DeckStudyView({ deck, cards: initialCards, user }: DeckStudyViewProps) {
  const [cards, setCards] = useState<Card[]>(() =>
    [...initialCards].sort((first, second) => {
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return secondTime - firstTime;
    })
  );
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState("");
  const [paymentCvv, setPaymentCvv] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">(user?.accountType ?? "free");

  const cardCount = useMemo(() => cards.length, [cards]);

  const toggleCard = (cardId: string) => {
    setFlipped((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }));
  };

  const handleCreateCard = async () => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || !trimmedBack) {
      setError("Both the question and answer are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: trimmedFront, back: trimmedBack }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create card.");
      }

      const newCard = payload.card as Card;
      setCards((current) => {
        const next = [newCard, ...current];
        return next.sort((first, second) => {
          const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
          const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
          return secondTime - firstTime;
        });
      });
      setFront("");
      setBack("");
      setFlipped((current) => ({ ...current, [newCard.id]: false }));
      setIsFormOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create card.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCardId(cardId);
    setError("");

    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete card.");
      }

      setCards((current) => current.filter((card) => card.id !== cardId));
      setFlipped((current) => {
        const next = { ...current };
        delete next[cardId];
        return next;
      });
      setPendingDeleteId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete card.");
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleUpgradeToPro = async () => {
    const cardNumber = paymentNumber.replace(/\s+/g, "");
    const expiry = paymentExpiry.trim();
    const cvv = paymentCvv.trim();

    if (cardNumber.length < 12 || expiry.length < 4 || cvv.length < 3) {
      setError("Please enter a valid dummy payment method to activate Pro.");
      return;
    }

    setUpgrading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          cardHolder: user?.name ?? "Learner",
          cardNumber,
          expiry,
          cvv,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to upgrade to Pro.");
      }

      setPlan("pro");
      setIsUpgradeOpen(false);
      setPaymentNumber("");
      setPaymentExpiry("");
      setPaymentCvv("");
      setError("");
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "Unable to process payment.");
    } finally {
      setUpgrading(false);
    }
  };

  const cardToDelete = cards.find((card) => card.id === pendingDeleteId) ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/60 hover:text-sky-200"
          >
            ← Back to dashboard
          </a>

          <h1 className="text-4xl font-bold">{deck.title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <UserHeader userName={user?.name ?? "User"} onSignOut={handleSignOut} compact />
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <div className="flex items-center gap-3">
          {plan === "free" ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setIsUpgradeOpen((value) => !value)}>
              Upgrade to Pro
            </Button>
          ) : null}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsFormOpen((value) => !value)}
            className="gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
              <path d="M10 3.25a.75.75 0 0 1 .75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4a.75.75 0 0 1 .75-.75Z" />
            </svg>
            Add Card
          </Button>
        </div>
      </div>

      {isUpgradeOpen && plan === "free" ? (
        <div className="mb-8 rounded-2xl border border-sky-500/30 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick upgrade to Pro</h2>
              <p className="text-sm text-slate-300">Unlock unlimited decks for $20/month.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUpgradeOpen(false)}>
              Close
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

            <label className="block md:col-span-1">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-300">CVV</span>
              <input
                value={paymentCvv}
                onChange={(event) => setPaymentCvv(event.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="123"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <Button type="button" onClick={() => void handleUpgradeToPro()} disabled={upgrading}>
              {upgrading ? "Processing..." : "Pay $20/month"}
            </Button>
          </div>
        </div>
      ) : null}

      {pendingDeleteId && cardToDelete ? (
        <div className="mb-8 rounded-2xl border border-rose-500/30 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
          <p className="text-lg font-semibold text-white">Delete this card?</p>
          <p className="mt-2 text-sm text-slate-300">
            “{cardToDelete.front}” will be removed from this deck.
          </p>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteCard(cardToDelete.id)}
              disabled={deletingCardId === cardToDelete.id}
            >
              {deletingCardId === cardToDelete.id ? "Deleting..." : "Confirm delete"}
            </Button>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Create a new card</h2>
            <span className="text-sm text-slate-400">{cardCount} cards</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-sky-300">Question</span>
              <textarea
                value={front}
                onChange={(event) => setFront(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="Enter the question or prompt"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-emerald-300">Answer</span>
              <textarea
                value={back}
                onChange={(event) => setBack(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                placeholder="Enter the answer"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {error ? <p className="mr-auto text-sm text-rose-300">{error}</p> : null}
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateCard} disabled={saving}>
              {saving ? "Saving..." : "Save card"}
            </Button>
          </div>
        </div>
      ) : null}

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-slate-300">
          No cards available in this deck yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const isFlipped = Boolean(flipped[card.id]);

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleCard(card.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCard(card.id);
                  }
                }}
                className="group h-72 w-full cursor-pointer rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label={isFlipped ? `Show question for ${card.front}` : `Show answer for ${card.front}`}
              >
                <div className="relative h-full w-full rounded-2xl [perspective:1000px]">
                  <div
                    className="relative h-full w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d]"
                    style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                  >
                    <div className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-lg shadow-slate-950/20 [backface-visibility:hidden]">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDeleteId(card.id);
                        }}
                        className="absolute right-3 top-3 z-10 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingCardId === card.id}
                        aria-label={`Delete card ${card.front}`}
                      >
                        {deletingCardId === card.id ? "Deleting..." : "Delete"}
                      </button>

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-sky-300">Question</p>
                        <p className="text-xl font-medium text-slate-50">{card.front}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Click to reveal answer</span>
                        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                          Front
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-300">Answer</p>
                        <p className="text-xl font-medium text-slate-50">{card.back}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Click to show question</span>
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                          Back
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
