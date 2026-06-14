import { GoogleGenAI } from "@google/genai";
import { FoodAnalysisSchema, type FoodAnalysisResult } from "./schemas";
import { buildFoodPrompt } from "./prompts";

interface AnalyzeOptions {
  imageBuffer: Buffer;
  mimeType: string;
  userHint?: string;
  profile: {
    sex: string;
    age: number;
    heightCm: number;
    currentWeightKg: number;
    dailyCalorieTarget: number;
  };
}

export async function analyzeFoodImage({
  imageBuffer,
  mimeType,
  userHint,
  profile,
}: AnalyzeOptions): Promise<FoodAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to analyze meal images.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const base64Image = imageBuffer.toString("base64");
  const prompt = buildFoodPrompt({ userHint, profile });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return FoodAnalysisSchema.parse(parsed);
}
