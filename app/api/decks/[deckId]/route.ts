import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/backend/db/client";
import { cards } from "@/backend/db/schema";
import { getDeckById, getDeckWithCards } from "@/backend/db/queries/decks";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;
    const deck = await getDeckById(deckId);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    if (deck.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await getDeckWithCards(deckId);
    const deckCards = rows
      .flatMap((row) => (row.cards ? [row.cards] : []))
      .sort((first, second) => {
        const firstTime = first?.createdAt ? new Date(first.createdAt).getTime() : 0;
        const secondTime = second?.createdAt ? new Date(second.createdAt).getTime() : 0;
        return secondTime - firstTime;
      });

    return NextResponse.json({ deck, cards: deckCards });
  } catch (error) {
    console.error("Deck details error:", error);
    return NextResponse.json({ error: "Unable to load deck details." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;
    const deck = await getDeckById(deckId);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    if (deck.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const front = typeof body?.front === "string" ? body.front.trim() : "";
    const back = typeof body?.back === "string" ? body.back.trim() : "";

    if (!front || !back) {
      return NextResponse.json({ error: "Both question and answer are required." }, { status: 400 });
    }

    const [newCard] = await db
      .insert(cards)
      .values({
        deckId,
        front,
        back,
      })
      .returning();

    return NextResponse.json({ card: newCard }, { status: 201 });
  } catch (error) {
    console.error("Create deck card error:", error);
    return NextResponse.json({ error: "Unable to create card." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;
    const deck = await getDeckById(deckId);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    if (deck.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const cardId = typeof body?.cardId === "string" ? body.cardId : "";

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required." }, { status: 400 });
    }

    const [deletedCard] = await db
      .delete(cards)
      .where(and(eq(cards.id, cardId), eq(cards.deckId, deckId)))
      .returning();

    if (!deletedCard) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json({ deletedCardId: deletedCard.id });
  } catch (error) {
    console.error("Delete deck card error:", error);
    return NextResponse.json({ error: "Unable to delete card." }, { status: 500 });
  }
}
