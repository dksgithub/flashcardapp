import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createUser, getUserByEmail } from "@/backend/db/queries/users";
import { SESSION_COOKIE_NAME, createSessionToken, hashPassword } from "@/backend/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const accountType = body.accountType === "pro" ? "pro" : "free";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const user = await createUser({
      name,
      email,
      passwordHash: hashPassword(password),
      accountType,
      monthlyFee: accountType === "pro" ? 20 : 0,
      subscriptionStatus: accountType === "pro" ? "active" : "inactive",
    });

    if (!user) {
      return NextResponse.json({ error: "Account creation failed." }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken(user.id),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, redirectTo: "/dashboard" });
  } catch (error) {
    console.error("Sign-up database error:", error);

    return NextResponse.json(
      {
        error: "The database is unavailable. Start the local Postgres 17 instance.",
      },
      { status: 503 }
    );
  }
}
