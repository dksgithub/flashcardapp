import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db/client";
import { subscriptions } from "@/backend/db/schema";

export async function getLatestSubscriptionForUser(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return subscription ?? null;
}

export async function createOrUpdateSubscription(
  userId: string,
  input: {
    plan: "free" | "pro";
    status?: "active" | "inactive";
    amount?: number;
    interval?: string;
  }
) {
  const existing = await getLatestSubscriptionForUser(userId);

  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        plan: input.plan,
        status: input.status ?? (input.plan === "pro" ? "active" : "inactive"),
        amount: input.amount ?? (input.plan === "pro" ? 20 : 0),
        interval: input.interval ?? "monthly",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing.id))
      .returning();

    return updated ?? null;
  }

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan: input.plan,
      status: input.status ?? (input.plan === "pro" ? "active" : "inactive"),
      amount: input.amount ?? (input.plan === "pro" ? 20 : 0),
      interval: input.interval ?? "monthly",
    })
    .returning();

  return created ?? null;
}
