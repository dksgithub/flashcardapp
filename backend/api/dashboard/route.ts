import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDecksByUserId } from "@/backend/db/queries/decks";
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

    return NextResponse.json({
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      decks,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Database unavailable. Start the local Postgres instance." },
      { status: 503 }
    );
  }
}
