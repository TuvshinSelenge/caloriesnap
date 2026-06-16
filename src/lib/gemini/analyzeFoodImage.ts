import { ThinkingLevel } from "@google/genai";
import { FoodAnalysisSchema, type FoodAnalysisResult } from "./schemas";
import { buildFoodPrompt } from "./prompts";
import { getGeminiClient, getGeminiModel, parseGeminiJson, runGeminiRequest } from "./client";

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
  const ai = getGeminiClient();
  const model = getGeminiModel();
  const base64Image = imageBuffer.toString("base64");
  const prompt = buildFoodPrompt({ userHint, profile });

  const response = await runGeminiRequest(() =>
    ai.models.generateContent({
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
        // Food estimation is a simple, low-reasoning task. Default for 3.x Flash is
        // MEDIUM thinking, which adds latency. LOW keeps quality while responding fast.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  return parseGeminiJson(response.text, FoodAnalysisSchema);
}
