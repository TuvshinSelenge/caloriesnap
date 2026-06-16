import { ThinkingLevel } from "@google/genai";
import { FoodAnalysisSchema, type FoodAnalysisResult } from "./schemas";
import { buildFoodTextPrompt } from "./prompts";
import { getGeminiClient, getGeminiModel, parseGeminiJson, runGeminiRequest } from "./client";

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
  const ai = getGeminiClient();
  const model = getGeminiModel();
  const prompt = buildFoodTextPrompt({ description, userHint, profile });

  const response = await runGeminiRequest(() =>
    ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        // Text estimation is a simple task; keep latency low.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  return parseGeminiJson(response.text, FoodAnalysisSchema);
}
