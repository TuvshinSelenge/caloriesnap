import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyFeedback } from "@/lib/gemini/weeklyFeedback";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const now = new Date();
  const from = startOfDay(subDays(now, 6));
  const to = endOfDay(now);

  const meals = await prisma.meal.findMany({
    where: { userId, eatenAt: { gte: from, lte: to } },
    orderBy: { eatenAt: "asc" },
  });

  // Aggregate per day
  const days: Record<string, { calories: number; protein: number; carbs: number; fat: number; mealCount: number }> = {};
  for (let i = 0; i < 7; i++) {
    const day = format(subDays(now, 6 - i), "yyyy-MM-dd");
    days[day] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
  }

  for (const meal of meals) {
    const day = format(new Date(meal.eatenAt), "yyyy-MM-dd");
    if (days[day]) {
      days[day].calories += meal.calories;
      days[day].protein += meal.proteinG ?? 0;
      days[day].carbs += meal.carbsG ?? 0;
      days[day].fat += meal.fatG ?? 0;
      days[day].mealCount++;
    }
  }

  const trackedDays = Object.values(days).filter((d) => d.mealCount > 0);
  const avgCalories = trackedDays.length
    ? Math.round(trackedDays.reduce((s, d) => s + d.calories, 0) / trackedDays.length)
    : 0;

  const weeklySummary = {
    days,
    trackedDaysCount: trackedDays.length,
    avgDailyCalories: avgCalories,
    targetCalories: profile.dailyCalorieTarget,
    avgDailyCalorieDifference: avgCalories - profile.dailyCalorieTarget,
    avgProteinG: trackedDays.length
      ? Math.round(trackedDays.reduce((s, d) => s + d.protein, 0) / trackedDays.length)
      : 0,
    avgCarbsG: trackedDays.length
      ? Math.round(trackedDays.reduce((s, d) => s + d.carbs, 0) / trackedDays.length)
      : 0,
    avgFatG: trackedDays.length
      ? Math.round(trackedDays.reduce((s, d) => s + d.fat, 0) / trackedDays.length)
      : 0,
  };

  try {
    const feedback = await generateWeeklyFeedback({
      profile: {
        sex: profile.sex,
        age: profile.age,
        heightCm: profile.heightCm,
        currentWeightKg: profile.currentWeightKg,
        goalType: profile.goalType,
        dailyCalorieTarget: profile.dailyCalorieTarget,
      },
      weeklySummary,
    });

    const saved = await prisma.aiFeedback.create({
      data: {
        userId,
        periodStart: from,
        periodEnd: to,
        type: "weekly",
        summary: feedback.summary,
        jsonPayload: feedback as object,
      },
    });

    return NextResponse.json({ feedback, id: saved.id });
  } catch (err) {
    console.error("Weekly feedback error:", err);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await prisma.aiFeedback.findFirst({
    where: { userId: session.user.id, type: "weekly" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedback: latest });
}
