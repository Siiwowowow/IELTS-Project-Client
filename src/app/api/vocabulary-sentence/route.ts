import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  word: z.string().trim().min(1).max(80),
  meaning: z.string().trim().min(1).max(300),
  sentence: z.string().trim().min(4).max(800),
});

const resultSchema = z.object({
  isCorrect: z.boolean(),
  correctedSentence: z.string(),
  explanationBn: z.string(),
  usageFeedbackBn: z.string(),
  mistakes: z.array(z.object({
    original: z.string(),
    correction: z.string(),
    type: z.enum(["grammar", "spelling", "word-form", "collocation", "meaning", "punctuation"]),
    explanationBn: z.string(),
  })),
});

const jsonSchema = {
  type: "object",
  properties: {
    isCorrect: { type: "boolean" },
    correctedSentence: { type: "string" },
    explanationBn: { type: "string" },
    usageFeedbackBn: { type: "string" },
    mistakes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          correction: { type: "string" },
          type: { type: "string", enum: ["grammar", "spelling", "word-form", "collocation", "meaning", "punctuation"] },
          explanationBn: { type: "string" },
        },
        required: ["original", "correction", "type", "explanationBn"],
        additionalProperties: false,
      },
    },
  },
  required: ["isCorrect", "correctedSentence", "explanationBn", "usageFeedbackBn", "mistakes"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Please provide a valid sentence." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ message: "Sentence checker is not configured." }, { status: 503 });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(50_000),
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        reasoning_effort: "low",
        temperature: 0.1,
        max_completion_tokens: 1200,
        messages: [
          { role: "system", content: "You are an IELTS vocabulary coach. Check whether the target word is used with the correct meaning, word form, grammar, spelling, punctuation, register and natural collocation. Respond only with the required JSON. Explanations must be concise Bangla. If correct, correctedSentence must repeat the original sentence exactly and mistakes must be empty. If incorrect, provide one natural corrected sentence using the target word. In mistakes, list every exact erroneous substring from the student's sentence so the UI can mark it, its correction, category and concise Bangla explanation." },
          { role: "user", content: `Target word: ${parsed.data.word}\nBangla meaning: ${parsed.data.meaning}\nStudent sentence: ${parsed.data.sentence}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "vocabulary_sentence_feedback", strict: true, schema: jsonSchema } },
      }),
    });

    if (!response.ok) return NextResponse.json({ message: response.status === 429 ? "AI limit reached. Please try again shortly." : "Sentence could not be checked." }, { status: response.status === 429 ? 429 : 502 });
    const completion = await response.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("No sentence feedback returned");
    return NextResponse.json({ result: resultSchema.parse(JSON.parse(content)) });
  } catch (error) {
    console.error("Vocabulary sentence check failed", error);
    return NextResponse.json({ message: "Sentence could not be checked. Please try again." }, { status: 502 });
  }
}
