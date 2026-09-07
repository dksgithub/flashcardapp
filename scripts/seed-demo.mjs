import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Client } from "pg";
import "dotenv/config";

const dbUser = process.env.POSTGRES_USER ?? "postgres";
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbHost = process.env.POSTGRES_HOST ?? "127.0.0.1";
const dbPort = Number(process.env.POSTGRES_PORT ?? 5432);
const dbName = process.env.POSTGRES_DB ?? "flashycardy";

const demoEmail = "demo@flashycardy.com";
const demoName = "Demo User";
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "demo-password-change-me";

const testEmail = "test@test.com";
const testName = "Test User";
const testPassword = process.env.SEED_TEST_PASSWORD ?? "test-password-change-me";

if (!dbPassword) {
  throw new Error("Missing POSTGRES_PASSWORD. Set it in your environment or .env before seeding.");
}

function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, "flashycardy-salt", 100000, 64, "sha512")
    .toString("hex");
}

const deckSeeds = [
  {
    title: "English words and their Spanish translations",
    description: "Learn key English words and their Spanish meanings.",
    category: "Languages",
    cards: [
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
    ],
  },
  {
    title: "Questions about British history and their answers",
    description: "Questions and answers covering major British history milestones.",
    category: "History",
    cards: [
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
    ],
  },
];

async function main() {
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  await client.connect();

  const schemaSql = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  await client.query(schemaSql);

  const usersToSeed = [
    { email: demoEmail, name: demoName, password: demoPassword, accountType: "free", monthlyFee: 0 },
    { email: testEmail, name: testName, password: testPassword, accountType: "pro", monthlyFee: 20 },
  ];

  const userIds = {};

  for (const userSeed of usersToSeed) {
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [userSeed.email]);

    if (existingUser.rowCount > 0) {
      userIds[userSeed.email] = existingUser.rows[0].id;
    } else {
      const insertUser = await client.query(
        "INSERT INTO users (email, name, password_hash, account_type, subscription_status, monthly_fee) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [userSeed.email, userSeed.name, hashPassword(userSeed.password), userSeed.accountType, userSeed.accountType === "pro" ? "active" : "inactive", userSeed.monthlyFee]
      );
      userIds[userSeed.email] = insertUser.rows[0].id;
    }
  }

  for (const userSeed of usersToSeed) {
    const userId = userIds[userSeed.email];

    for (const deckSeed of deckSeeds) {
      const existingDeck = await client.query(
        "SELECT id FROM decks WHERE user_id = $1 AND title = $2",
        [userId, deckSeed.title]
      );

      let deckId;
      if (existingDeck.rowCount > 0) {
        deckId = existingDeck.rows[0].id;
      } else {
        const insertDeck = await client.query(
          "INSERT INTO decks (user_id, title, description, category, is_public) VALUES ($1, $2, $3, $4, true) RETURNING id",
          [userId, deckSeed.title, deckSeed.description, deckSeed.category]
        );
        deckId = insertDeck.rows[0].id;
      }

      for (const card of deckSeed.cards) {
        const existingCard = await client.query(
          "SELECT id FROM cards WHERE deck_id = $1 AND front = $2 AND back = $3",
          [deckId, card.front, card.back]
        );

        if (existingCard.rowCount === 0) {
          await client.query(
            "INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)",
            [deckId, card.front, card.back]
          );
        }
      }
    }
  }

  const userCount = await client.query("SELECT COUNT(*) AS count FROM users");
  const deckCount = await client.query("SELECT COUNT(*) AS count FROM decks");
  const cardCount = await client.query("SELECT COUNT(*) AS count FROM cards");

  console.log("Seed complete.");
  console.log(JSON.stringify({
    demoEmail,
    testEmail,
    users: Number(userCount.rows[0].count),
    decks: Number(deckCount.rows[0].count),
    cards: Number(cardCount.rows[0].count),
  }, null, 2));

  await client.end();
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
