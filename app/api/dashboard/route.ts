import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDecksByUserId } from "@/backend/db/queries/decks";
import { getLatestSubscriptionForUser } from "@/backend/db/queries/subscriptions";
import { getUserById } from "@/backend/db/queries/users";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    const decks = await getDecksByUserId(userId);
    const subscription = await getLatestSubscriptionForUser(userId);
    const effectivePlan = subscription?.plan === "pro" || user?.accountType === "pro" ? "pro" : "free";
    const deckLimit = effectivePlan === "pro" ? Number.POSITIVE_INFINITY : 3;

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            accountType: effectivePlan,
            subscriptionStatus: subscription?.status ?? user.subscriptionStatus,
            monthlyFee: subscription?.amount ?? user.monthlyFee,
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            amount: subscription.amount,
            interval: subscription.interval,
          }
        : null,
      decks,
      deckLimit,
      deckCount: decks.length,
      canCreateDeck: effectivePlan === "pro" || decks.length < 3,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Database unavailable. Start the local Postgres instance." },
      { status: 503 }
    );
  }
}
