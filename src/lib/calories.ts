type Sex = "male" | "female" | "other" | "prefer_not_to_say";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type GoalType = "lose_weight" | "maintain_weight" | "gain_weight";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const WEEKLY_TARGET_DEFICIT: Record<number, number> = {
  0.25: 275,
  0.5: 550,
  0.75: 825,
};

export function calculateBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base + (5 + -161) / 2;
}

export function calculateTDEE(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(sex, weightKg, heightCm, age);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateDailyTarget(
  tdee: number,
  goalType: GoalType,
  weeklyTargetKg?: number | null
): number {
  if (goalType === "maintain_weight") return tdee;
  const deficit = weeklyTargetKg ? WEEKLY_TARGET_DEFICIT[weeklyTargetKg] ?? 550 : 550;
  if (goalType === "lose_weight") return Math.max(1200, tdee - deficit);
  return tdee + deficit;
}
