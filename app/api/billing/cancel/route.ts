import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserById, updateUserPlan } from "@/backend/db/queries/users";
import { createOrUpdateSubscription } from "@/backend/db/queries/subscriptions";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = await updateUserPlan(userId, {
      accountType: "free",
      monthlyFee: 0,
    });

    const subscription = await createOrUpdateSubscription(userId, {
      plan: "free",
      status: "inactive",
      amount: 0,
      interval: "monthly",
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
        ? {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            accountType: updatedUser.accountType,
            subscriptionStatus: updatedUser.subscriptionStatus,
            monthlyFee: updatedUser.monthlyFee,
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
    });
  } catch (error) {
    console.error("Billing cancel error:", error);
    return NextResponse.json({ error: "Unable to cancel the subscription." }, { status: 500 });
  }
}
