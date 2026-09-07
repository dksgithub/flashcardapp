import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyUserCredentials } from "@/backend/db/queries/users";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/backend/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const user = await verifyUserCredentials({ email, password });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
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
    console.error("Sign-in database error:", error);

    return NextResponse.json(
      {
        error: "The database is unavailable. Start the local Postgres 17 instance.",
      },
      { status: 503 }
    );
  }
}
