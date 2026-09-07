import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/backend/db/client";
import { cards, decks } from "@/backend/db/schema";

export async function getDeckById(deckId: string) {
  const [deck] = await db.select().from(decks).where(eq(decks.id, deckId)).limit(1);

  return deck ?? null;
}

export async function getDecksByUserId(userId: string) {
  return db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(asc(decks.createdAt));
}

export async function getDeckWithCards(deckId: string) {
  return db
    .select()
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .where(eq(decks.id, deckId))
    .orderBy(desc(cards.createdAt));
}

export async function createDeckWithCards(input: {
  userId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  cards: Array<{ front: string; back: string }>;
}) {
  const [deck] = await db
    .insert(decks)
    .values({
      userId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      isPublic: true,
    })
    .returning();

  if (!deck) {
    throw new Error("Deck could not be created.");
  }

  if (input.cards.length > 0) {
    await db.insert(cards).values(
      input.cards.map((card) => ({
        deckId: deck.id,
        front: card.front,
        back: card.back,
      }))
    );
  }

  return deck;
}

export async function addCardsToDeck(
  deckId: string,
  deckCards: Array<{ front: string; back: string }>
) {
  if (deckCards.length === 0) {
    return;
  }

  await db.insert(cards).values(
    deckCards.map((card) => ({
      deckId,
      front: card.front,
      back: card.back,
    }))
  );
}
