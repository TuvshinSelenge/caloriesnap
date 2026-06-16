import { ThinkingLevel } from "@google/genai";
import { WeeklyFeedbackSchema, type WeeklyFeedbackResult } from "./schemas";
import { buildWeeklyFeedbackPrompt } from "./prompts";
import { getGeminiClient, getGeminiModel, parseGeminiJson, runGeminiRequest } from "./client";

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
  const ai = getGeminiClient();
  const model = getGeminiModel();
  const prompt = buildWeeklyFeedbackPrompt({ profile, weeklySummary });

  const response = await runGeminiRequest(() =>
    ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  return parseGeminiJson(response.text, WeeklyFeedbackSchema);
}
