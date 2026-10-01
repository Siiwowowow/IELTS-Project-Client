import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const GROQ_TIMEOUT_MS = 120_000;

const requestSchema = z.object({
  questionId: z.string().min(1),
  answerId: z.string().min(1),
  audioUrl: z.string().nullable().optional(),
  partNumber: z.number().int().min(1).max(3),
  partTitle: z.string().min(1),
  questionText: z.string().min(1),
  instruction: z.string().nullable().optional(),
});

const speakingResponseJsonSchema = {
  type: "object",
  properties: {
    questionId: { type: "string" },
    answerId: { type: "string" },
    transcript: { type: "string" },
    modelAnswer: { type: "string" },
    fluencyScore: { type: "number" },
    lexicalScore: { type: "number" },
    grammarScore: { type: "number" },
    pronunciationScore: { type: "number" },
    bandScore: { type: "number" },
    feedbackBn: { type: "string" },
    grammarErrors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanationBn: { type: "string" },
          improvedVersion: { type: "string" },
        },
        required: ["original", "corrected", "explanationBn", "improvedVersion"],
        additionalProperties: false,
      },
    },
    vocabularyImprovements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          suggested: { type: "string" },
          explanationBn: { type: "string" },
        },
        required: ["original", "suggested", "explanationBn"],
        additionalProperties: false,
      },
    },
    pronunciationNotes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          wordOrPhrase: { type: "string" },
          phoneticTipBn: { type: "string" },
        },
        required: ["wordOrPhrase", "phoneticTipBn"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "questionId",
    "answerId",
    "transcript",
    "modelAnswer",
    "fluencyScore",
    "lexicalScore",
    "grammarScore",
    "pronunciationScore",
    "bandScore",
    "feedbackBn",
    "grammarErrors",
    "vocabularyImprovements",
    "pronunciationNotes",
  ],
  additionalProperties: false,
} as const;

const SPEAKING_SYSTEM_PROMPT = `You are a certified IELTS Speaking examiner and assessor. Assess the student's spoken response transcript strictly according to the official IELTS Speaking Band Descriptors (scale 0 to 9 in 0.5 increments):
1. Fluency and Coherence (FC): Flow of speech, continuity, natural pacing, discourse markers, logical progression.
2. Lexical Resource (LR): Range and precision of vocabulary, idiomatic expressions, collocations, avoiding repetitive terms.
3. Grammatical Range and Accuracy (GRA): Range of simple and complex sentence structures, accuracy of tenses, prepositions, clauses.
4. Pronunciation (PR): Spoken clarity, word stress, intonation patterns, and rhythm deduced from phrasing and structure.

You must respond with a single, strictly valid JSON object adhering precisely to the JSON schema. Ensure all fields including modelAnswer are present. Do not output markdown code blocks (such as \`\`\`json), thinking tags, or conversational text. Output only raw JSON.

Rules:
- Score all 4 criteria (fluencyScore, lexicalScore, grammarScore, pronunciationScore) from 0 to 9 in 0.5 increments only (e.g. 5.5, 6.0, 6.5, 7.0).
- bandScore is the arithmetic mean of the four criteria rounded to the nearest 0.5.
- transcript must contain the exact transcribed English text of what the student said.
- modelAnswer: provide a realistic, Band 8.0 - 8.5 natural spoken English response suitable for this specific question and part. Keep it natural, conversational, fluent, with natural idioms and varied sentence structures.
- For grammarErrors: 'original' MUST be an exact verbatim substring from the transcript. 'corrected' must fix the error naturally. 'explanationBn' must explain the rule clearly in Bengali. 'improvedVersion' should be a natural higher-band spoken version. If no grammar error, return empty array.
- For vocabularyImprovements: 'original' is the word/phrase used by the candidate, 'suggested' is a more natural or high-band collocation/idiom, with 'explanationBn' in Bengali.
- For pronunciationNotes: identify 1-3 words or phrases in the answer that candidates commonly mispronounce or where word stress/intonation is critical, and provide a clear tip in Bengali.
- feedbackBn: provide clear, constructive, and actionable evaluation in Bengali explaining why the candidate received this score and what specific changes would raise their score by 1 band.`;

function clampHalfBand(value: number) {
  return Math.max(0, Math.min(9, Math.round(value * 2) / 2));
}

async function transcribeAudio(apiKey: string, audioUrl: string): Promise<string> {
  const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(60_000) });
  if (!audioRes.ok) {
    throw new Error(`Failed to download audio from ${audioUrl} (status: ${audioRes.status})`);
  }

  const audioBuffer = await audioRes.arrayBuffer();
  const contentType = audioRes.headers.get("content-type") || "audio/webm";
  const audioBlob = new Blob([audioBuffer], { type: contentType });

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");
  formData.append("language", "en");

  const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!whisperRes.ok) {
    const errorText = await whisperRes.text().catch(() => "");
    throw new Error(`Groq Whisper transcription failed (${whisperRes.status}): ${errorText}`);
  }

  const data = (await whisperRes.json()) as { text?: string };
  return (data.text || "").trim();
}

async function callGroqLLM(apiKey: string, body: string) {
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status === 400) {
      const cloned = response.clone();
      const err = await cloned.json().catch(() => null);
      if (err?.error?.code === "json_validate_failed" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        continue;
      }
    }

    if (![429, 503].includes(response.status) || attempt === 2) break;
    const retryAfterSeconds = Number.parseFloat(response.headers.get("retry-after") ?? "");
    const fallbackMs = attempt === 0 ? 15_000 : 30_000;
    const retryMs = Number.isFinite(retryAfterSeconds)
      ? Math.min(60_000, Math.max(10_000, retryAfterSeconds * 1_000 + 1_500))
      : fallbackMs;
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }
  return response;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { message: "GROQ_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let parsedBody: z.infer<typeof requestSchema>;
  try {
    parsedBody = requestSchema.parse(await request.json());
  } catch (error) {
    const details = error instanceof z.ZodError ? error.issues : undefined;
    return NextResponse.json({ message: "Invalid speaking assessment request.", details }, { status: 400 });
  }

  const { questionId, answerId, audioUrl, partNumber, partTitle, questionText, instruction } = parsedBody;

  // Handle case where no audio recording was submitted
  if (!audioUrl || !audioUrl.trim()) {
    return NextResponse.json({
      assessment: {
        questionId,
        answerId,
        transcript: "(No audio recorded)",
        modelAnswer: "An ideal response requires active speaking. Please record an answer to receive full AI band analysis.",
        fluencyScore: 1.0,
        lexicalScore: 1.0,
        grammarScore: 1.0,
        pronunciationScore: 1.0,
        bandScore: 1.0,
        feedbackBn: "এই প্রশ্নের জন্য কোনো অডিও রেকর্ডিং জমা দেওয়া হয়নি। সম্পূর্ণ মূল্যায়নের জন্য অনুগ্রহ করে আপনার উত্তর রেকর্ড করুন।",
        grammarErrors: [],
        vocabularyImprovements: [],
        pronunciationNotes: [],
      },
    });
  }

  try {
    // 1. Transcribe audio with Whisper Large v3 Turbo
    let transcript = "";
    try {
      transcript = await transcribeAudio(apiKey, audioUrl);
    } catch (err) {
      console.error("Whisper transcription error:", err);
      return NextResponse.json(
        { message: "Failed to transcribe speech audio. Please verify your recording and try again." },
        { status: 502 },
      );
    }

    // Handle silence / empty speech
    if (!transcript) {
      return NextResponse.json({
        assessment: {
          questionId,
          answerId,
          transcript: "(No audible speech detected)",
          modelAnswer: "Speak clearly into your microphone during the allotted time.",
          fluencyScore: 2.0,
          lexicalScore: 2.0,
          grammarScore: 2.0,
          pronunciationScore: 2.0,
          bandScore: 2.0,
          feedbackBn: "রেকর্ডিংয়ে স্পষ্ট কোনো ইংরেজি বক্তব্য শনাক্ত করা যায়নি। পরবর্তীতে মাইক্রোফোনের কাছে এসে স্পষ্টভাবে উত্তর বলুন।",
          grammarErrors: [],
          vocabularyImprovements: [],
          pronunciationNotes: [],
        },
      });
    }

    // 2. Evaluate with Groq LLM
    const userPrompt = JSON.stringify({
      questionId,
      answerId,
      partNumber,
      partTitle,
      instruction: instruction || undefined,
      questionText,
      transcript,
    });

    const requestBody = JSON.stringify({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      temperature: 0.2,
      max_completion_tokens: 4_096,
      messages: [
        { role: "system", content: SPEAKING_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ielts_speaking_question_assessment",
          strict: true,
          schema: speakingResponseJsonSchema,
        },
      },
    });

    const groqResponse = await callGroqLLM(apiKey, requestBody);

    if (!groqResponse?.ok) {
      const groqError = await groqResponse?.json().catch(() => null);
      const status = groqResponse?.status ?? 502;
      const message = status === 429
        ? "Groq free-tier rate limit reached. Please wait a minute and try again."
        : "Groq speaking evaluation is temporarily unavailable. Please try again.";
      console.error("Groq speaking assessment error", status, groqError);
      return NextResponse.json({ message }, { status: status === 429 ? 429 : 502 });
    }

    const completion = await groqResponse.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content) {
      throw new Error("Groq returned no speaking assessment content.");
    }

    const assessment = JSON.parse(content);
    assessment.questionId = questionId;
    assessment.answerId = answerId;
    assessment.transcript = transcript;
    assessment.fluencyScore = clampHalfBand(assessment.fluencyScore);
    assessment.lexicalScore = clampHalfBand(assessment.lexicalScore);
    assessment.grammarScore = clampHalfBand(assessment.grammarScore);
    assessment.pronunciationScore = clampHalfBand(assessment.pronunciationScore);
    assessment.bandScore = clampHalfBand(
      (assessment.fluencyScore + assessment.lexicalScore + assessment.grammarScore + assessment.pronunciationScore) / 4,
    );

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Speaking assessment failed:", error);
    return NextResponse.json(
      { message: "Speaking assessment failed. Please try again." },
      { status: 500 },
    );
  }
}
