import { z } from "zod";

export const FoodAnalysisSchema = z.object({
  mealName: z.string().min(1),
  detectedFoods: z.array(z.string()).default([]),
  portionDescription: z.string().min(1),
  calories: z.object({
    min: z.number().int().nonnegative(),
    mostLikely: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
  macros: z.object({
    proteinG: z.number().nonnegative().nullable(),
    carbsG: z.number().nonnegative().nullable(),
    fatG: z.number().nonnegative().nullable(),
  }),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()).default([]),
  uncertaintyReasons: z.array(z.string()).default([]),
  userHintUsed: z.boolean(),
  healthNotes: z.array(z.string()).default([]),
});

export type FoodAnalysisResult = z.infer<typeof FoodAnalysisSchema>;

export const WeeklyFeedbackSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  positivePatterns: z.array(z.string()).default([]),
  improvementAreas: z.array(z.string()).default([]),
  nextWeekSuggestions: z.array(z.string()).default([]),
  safetyNote: z.string(),
});

export type WeeklyFeedbackResult = z.infer<typeof WeeklyFeedbackSchema>;
