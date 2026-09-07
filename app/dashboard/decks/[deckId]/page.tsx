import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getDeckWithCards } from "@/backend/db/queries/decks";
import { getLatestSubscriptionForUser } from "@/backend/db/queries/subscriptions";
import { getUserById } from "@/backend/db/queries/users";
import { DeckStudyView } from "@/frontend/components/deck-study-view";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = verifySessionToken(sessionValue);

  if (!userId) {
    redirect("/");
  }

  const { deckId } = await params;
  const rows = await getDeckWithCards(deckId);
  const deck = rows[0]?.decks ?? null;

  if (!deck || deck.userId !== userId) {
    redirect("/dashboard");
  }

  const user = await getUserById(userId);
  const subscription = await getLatestSubscriptionForUser(userId);
  const effectivePlan = subscription?.plan === "pro" || user?.accountType === "pro" ? "pro" : "free";
  const cards = rows
    .map((row) => row.cards)
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .map((card) => ({
      ...card,
      createdAt: card.createdAt ? new Date(card.createdAt).toISOString() : undefined,
    }));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <DeckStudyView
        deck={{ id: deck.id, title: deck.title, description: deck.description }}
        cards={cards}
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                accountType: effectivePlan,
                subscriptionStatus: subscription?.status ?? user.subscriptionStatus,
                monthlyFee: subscription?.amount ?? user.monthlyFee,
              }
            : null
        }
      />
    </main>
  );
}
