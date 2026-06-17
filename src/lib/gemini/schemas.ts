import { z } from "zod";

const roundedNonnegativeNumber = z.coerce
  .number()
  .nonnegative()
  .transform((value) => Math.round(value));

const nullableNonnegativeNumber = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().nonnegative().nullable()
);

export const FoodAnalysisSchema = z.object({
  mealName: z.string().min(1),
  detectedFoods: z.array(z.string()).default([]),
  portionDescription: z.string().min(1),
  calories: z.object({
    min: roundedNonnegativeNumber,
    mostLikely: roundedNonnegativeNumber,
    max: roundedNonnegativeNumber,
  }),
  macros: z.object({
    proteinG: nullableNonnegativeNumber,
    carbsG: nullableNonnegativeNumber,
    fatG: nullableNonnegativeNumber,
  }),
  confidence: z.coerce.number().min(0).max(1),
  assumptions: z.array(z.string()).default([]),
  uncertaintyReasons: z.array(z.string()).default([]),
  userHintUsed: z.coerce.boolean(),
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
