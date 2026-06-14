import { GoogleGenAI } from "@google/genai";
import { WeeklyFeedbackSchema, type WeeklyFeedbackResult } from "./schemas";
import { buildWeeklyFeedbackPrompt } from "./prompts";

interface FeedbackOptions {
  profile: {
    sex: string;
    age: number;
    heightCm: number;
    currentWeightKg: number;
    goalType: string;
    dailyCalorieTarget: number;
  };
  weeklySummary: object;
}

export async function generateWeeklyFeedback({
  profile,
  weeklySummary,
}: FeedbackOptions): Promise<WeeklyFeedbackResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to generate weekly feedback.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const prompt = buildWeeklyFeedbackPrompt({ profile, weeklySummary });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return WeeklyFeedbackSchema.parse(parsed);
}
