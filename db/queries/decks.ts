import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cards, decks } from "@/db/schema";

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
    .where(eq(decks.id, deckId));
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
