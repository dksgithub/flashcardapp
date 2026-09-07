import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/backend/db/client";
import { cards, decks } from "@/backend/db/schema";
import { addCardsToDeck, getDecksByUserId, createDeckWithCards } from "@/backend/db/queries/decks";
import { getUserById } from "@/backend/db/queries/users";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";
import { generateDefaultCardsForDeck } from "@/backend/lib/llm-cards";

export async function POST(request: Request) {
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

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    const category = typeof body?.category === "string" ? body.category.trim() : null;
    const generateDefaultCards = body?.generateDefaultCards === true;
    const defaultCardsPrompt = typeof body?.defaultCardsPrompt === "string" ? body.defaultCardsPrompt.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Deck title is required." }, { status: 400 });
    }

    const decks = await getDecksByUserId(userId);
    const isPro = user.accountType === "pro";
    if (!isPro && decks.length >= 3) {
      return NextResponse.json(
        { error: "Free accounts can create up to 3 decks. Upgrade to Pro for unlimited decks." },
        { status: 403 }
      );
    }

    const deck = await createDeckWithCards({
      userId,
      title,
      description: description || null,
      category: category || null,
      cards: [],
    });

    let generatedCardsCount = 0;
    let generationNote: string | undefined;

    if (generateDefaultCards) {
      const generated = await generateDefaultCardsForDeck({
        title,
        description,
        category,
        customPrompt: defaultCardsPrompt,
      });

      if (generated.cards.length > 0) {
        await addCardsToDeck(deck.id, generated.cards);
        generatedCardsCount = generated.cards.length;
      }

      generationNote = generated.note;
    }

    return NextResponse.json(
      {
        deck,
        generatedCardsCount,
        generationNote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create deck error:", error);
    return NextResponse.json({ error: "Unable to create deck." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const userId = verifySessionToken(sessionValue);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const deckId = typeof body?.deckId === "string" ? body.deckId : "";

    if (!deckId) {
      return NextResponse.json({ error: "Deck ID is required." }, { status: 400 });
    }

    const [deletedDeck] = await db
      .delete(decks)
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
      .returning();

    if (!deletedDeck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    await db.delete(cards).where(eq(cards.deckId, deckId));

    return NextResponse.json({ deletedDeckId: deletedDeck.id });
  } catch (error) {
    console.error("Delete deck error:", error);
    return NextResponse.json({ error: "Unable to delete deck." }, { status: 500 });
  }
}
