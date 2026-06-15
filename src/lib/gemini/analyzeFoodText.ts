import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { FoodAnalysisSchema, type FoodAnalysisResult } from "./schemas";
import { buildFoodTextPrompt } from "./prompts";

interface AnalyzeTextOptions {
  description: string;
  userHint?: string;
  profile: {
    sex: string;
    age: number;
    heightCm: number;
    currentWeightKg: number;
    dailyCalorieTarget: number;
  };
}

export async function analyzeFoodText({
  description,
  userHint,
  profile,
}: AnalyzeTextOptions): Promise<FoodAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to analyze meal descriptions.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const prompt = buildFoodTextPrompt({ description, userHint, profile });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      // Text estimation is a simple task; keep latency low.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return FoodAnalysisSchema.parse(parsed);
}
