import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cards, decks, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const demoEmail = "demo@flashycardy.com";
const demoName = "Demo User";
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "demo-password-change-me";

const englishSpanishCards = [
  { front: "hello", back: "hola" },
  { front: "goodbye", back: "adiós" },
  { front: "thank you", back: "gracias" },
  { front: "please", back: "por favor" },
  { front: "water", back: "agua" },
  { front: "bread", back: "pan" },
  { front: "house", back: "casa" },
  { front: "friend", back: "amigo" },
  { front: "book", back: "libro" },
  { front: "school", back: "escuela" },
  { front: "city", back: "ciudad" },
  { front: "cat", back: "gato" },
  { front: "dog", back: "perro" },
  { front: "sun", back: "sol" },
  { front: "moon", back: "luna" },
];

const britishHistoryCards = [
  { front: "Who was the first Norman king of England?", back: "William the Conqueror" },
  { front: "In which year did the Battle of Hastings take place?", back: "1066" },
  { front: "What was the Magna Carta?", back: "A charter limiting the king's power in 1215" },
  { front: "Which queen was known as the Virgin Queen?", back: "Elizabeth I" },
  { front: "What happened in 1666 that devastated London?", back: "The Great Fire of London" },
  { front: "Who was the British prime minister during most of World War II?", back: "Winston Churchill" },
  { front: "Which ship sank in 1912 on its maiden voyage?", back: "The Titanic" },
  { front: "What event began in 1939 and lasted until 1945?", back: "World War II" },
  { front: "Who was the first woman to serve as British prime minister?", back: "Margaret Thatcher" },
  { front: "Which monarch reigned during the Victorian era?", back: "Queen Victoria" },
  { front: "What was the main purpose of the Roman walls in Britain?", back: "To defend the empire from invasions" },
  { front: "Which battle was won by the English in 1415?", back: "The Battle of Agincourt" },
  { front: "What was the name of the 17th-century conflict between the Crown and Parliament?", back: "The English Civil War" },
  { front: "Which London landmark began construction in 1066?", back: "Westminster Abbey" },
  { front: "Which year did the United Kingdom vote to leave the European Union?", back: "2016" },
];

async function main() {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  let userId: string;

  if (existingUser.length === 0) {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: demoEmail,
        name: demoName,
        passwordHash: hashPassword(demoPassword),
      })
      .returning({ id: users.id });

    userId = createdUser.id;
  } else {
    userId = existingUser[0].id;
  }

  const deckSeeds = [
    {
      title: "English to Spanish",
      description: "Learn key English words and their Spanish meanings.",
      category: "Languages",
      cards: englishSpanishCards,
    },
    {
      title: "British History Essentials",
      description: "Questions and answers covering major British history milestones.",
      category: "History",
      cards: britishHistoryCards,
    },
  ];

  for (const deckSeed of deckSeeds) {
    const existingDeck = await db
      .select()
      .from(decks)
      .where(eq(decks.title, deckSeed.title))
      .limit(1);

    if (existingDeck.length > 0) {
      continue;
    }

    const [createdDeck] = await db
      .insert(decks)
      .values({
        userId,
        title: deckSeed.title,
        description: deckSeed.description,
        category: deckSeed.category,
        isPublic: true,
      })
      .returning({ id: decks.id });

    if (createdDeck) {
      await db.insert(cards).values(
        deckSeed.cards.map((card) => ({
          deckId: createdDeck.id,
          front: card.front,
          back: card.back,
        }))
      );
    }
  }

  console.log(`Seed complete for user: ${userId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
