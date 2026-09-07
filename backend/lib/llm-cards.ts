type GeneratedCard = {
  front: string;
  back: string;
};

type GenerateDeckCardsInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  customPrompt?: string | null;
};

type GenerateDeckCardsResult = {
  cards: GeneratedCard[];
  usedLlm: boolean;
  note?: string;
};

const MAX_CARDS = 12;

function sanitizeCards(cards: unknown): GeneratedCard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .map((card) => {
      const front = typeof card?.front === "string" ? card.front.trim() : "";
      const back = typeof card?.back === "string" ? card.back.trim() : "";
      return { front, back };
    })
    .filter((card) => card.front.length > 0 && card.back.length > 0)
    .slice(0, MAX_CARDS);
}

function extractCardsFromContent(content: string): GeneratedCard[] {
  try {
    const parsed = JSON.parse(content) as { cards?: unknown };
    return sanitizeCards(parsed.cards);
  } catch {
    return [];
  }
}

function fallbackCards(title: string): GeneratedCard[] {
  return [
    {
      front: `What is the core idea of ${title}?`,
      back: `The core idea is the main concept this deck focuses on in ${title}.`,
    },
    {
      front: `Why is ${title} important?`,
      back: `${title} is important because it helps build understanding through repeated recall.`,
    },
    {
      front: `Name one practical example of ${title}.`,
      back: `A practical example depends on context; add one from your own use case.`,
    },
    {
      front: `What is a common mistake in ${title}?`,
      back: `A common mistake is memorizing facts without understanding when to apply them.`,
    },
    {
      front: `How can you improve retention for ${title}?`,
      back: `Use spaced repetition and active recall with short, focused card sessions.`,
    },
    {
      front: `Which prerequisite topic helps before studying ${title}?`,
      back: `Review the basic terms and definitions related to ${title} first.`,
    },
    {
      front: `What is one real-world use of ${title}?`,
      back: `Use ${title} to solve a practical problem in projects or daily work.`,
    },
    {
      front: `How do you test your understanding of ${title}?`,
      back: `Explain the concept in your own words and answer practice questions.`,
    },
    {
      front: `What is a key term in ${title} and its meaning?`,
      back: `Choose one key term from ${title} and define it clearly in one sentence.`,
    },
    {
      front: `What makes ${title} hard for beginners?`,
      back: `Beginners often struggle with too much detail before understanding fundamentals.`,
    },
    {
      front: `What study strategy works best for ${title}?`,
      back: `Short daily review sessions with active recall and spaced repetition work best.`,
    },
  ];
}

function ensureCardLimit(cards: GeneratedCard[], title: string): GeneratedCard[] {
  if (cards.length >= MAX_CARDS) {
    return cards.slice(0, MAX_CARDS);
  }

  const fallback = fallbackCards(title);
  const combined = [...cards, ...fallback];
  const unique = new Map<string, GeneratedCard>();

  for (const card of combined) {
    const key = `${card.front.toLowerCase()}|${card.back.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, card);
    }
    if (unique.size >= MAX_CARDS) {
      break;
    }
  }

  return Array.from(unique.values()).slice(0, MAX_CARDS);
}

export async function generateDefaultCardsForDeck(
  input: GenerateDeckCardsInput
): Promise<GenerateDeckCardsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return {
      cards: ensureCardLimit([], input.title),
      usedLlm: false,
      note: "OPENAI_API_KEY is not configured; fallback starter cards were created.",
    };
  }

  const systemPrompt =
    "You generate high-quality flashcards. Return only valid JSON with shape {\"cards\":[{\"front\":\"...\",\"back\":\"...\"}]}. No markdown.";

  const userPrompt = [
    `Create ${MAX_CARDS} concise flashcards for this new deck.`,
    `Title: ${input.title}`,
    `Category: ${input.category ?? "General"}`,
    `Description: ${input.description ?? "None"}`,
    `User guidance: ${input.customPrompt?.trim() || "Create practical starter cards for a beginner."}`,
    "Keep fronts as clear questions and backs as accurate short answers.",
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        cards: ensureCardLimit([], input.title),
        usedLlm: false,
        note: `LLM request failed (${response.status}). Fallback starter cards were created. ${text.slice(0, 180)}`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content ?? "";
    const cards = ensureCardLimit(extractCardsFromContent(content), input.title);

    if (cards.length === 0) {
      return {
        cards: ensureCardLimit([], input.title),
        usedLlm: false,
        note: "LLM returned no usable cards; fallback starter cards were created.",
      };
    }

    return { cards, usedLlm: true };
  } catch {
    return {
      cards: ensureCardLimit([], input.title),
      usedLlm: false,
      note: "LLM call failed unexpectedly; fallback starter cards were created.",
    };
  }
}
