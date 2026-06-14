import { GoogleGenAI } from "@google/genai";
import { WeeklyFeedbackSchema, type WeeklyFeedbackResult } from "./schemas";
import { buildWeeklyFeedbackPrompt } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
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
