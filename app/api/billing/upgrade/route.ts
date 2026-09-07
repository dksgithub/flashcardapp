import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserById, updateUserPlan } from "@/backend/db/queries/users";
import { createOrUpdateSubscription } from "@/backend/db/queries/subscriptions";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = body?.plan === "pro" ? "pro" : "free";
    const cardNumber = String(body?.cardNumber ?? "").replace(/\s+/g, "");
    const expiry = String(body?.expiry ?? "").trim();
    const cvv = String(body?.cvv ?? "").trim();

    if (requestedPlan !== "pro") {
      return NextResponse.json({ error: "Only Pro upgrades are supported." }, { status: 400 });
    }

    if (cardNumber.length < 12 || expiry.length < 4 || cvv.length < 3) {
      return NextResponse.json({ error: "Enter a valid dummy card to complete the payment." }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = await updateUserPlan(userId, {
      accountType: "pro",
      monthlyFee: 20,
    });

    const subscription = await createOrUpdateSubscription(userId, {
      plan: "pro",
      status: "active",
      amount: 20,
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
    console.error("Billing upgrade error:", error);
    return NextResponse.json({ error: "Unable to process payment." }, { status: 500 });
  }
}
