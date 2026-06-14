import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, format, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "week";

  const now = new Date();
  let from: Date;
  let to: Date;

  if (range === "month") {
    from = startOfMonth(now);
    to = endOfMonth(now);
  } else {
    // week = last 7 days
    from = startOfDay(subDays(now, 6));
    to = endOfDay(now);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { dailyCalorieTarget: true },
  });

  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      eatenAt: { gte: from, lte: to },
    },
    orderBy: { eatenAt: "asc" },
  });

  // Aggregate by day
  const days = eachDayOfInterval({ start: from, end: to });
  const dailyData = days.map((day) => {
    const dayMeals = meals.filter((m) => {
      const d = new Date(m.eatenAt);
      return d >= startOfDay(day) && d <= endOfDay(day);
    });
    const calories = dayMeals.reduce((sum: number, m) => sum + m.calories, 0);
    const protein = dayMeals.reduce((sum: number, m) => sum + (m.proteinG ?? 0), 0);
    const carbs = dayMeals.reduce((sum: number, m) => sum + (m.carbsG ?? 0), 0);
    const fat = dayMeals.reduce((sum: number, m) => sum + (m.fatG ?? 0), 0);
    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, range === "month" ? "d" : "EEE"),
      calories,
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      mealCount: dayMeals.length,
    };
  });

  const trackedDays = dailyData.filter((d) => d.mealCount > 0);
  const totalCalories = trackedDays.reduce((s, d) => s + d.calories, 0);
  const avgCalories = trackedDays.length ? Math.round(totalCalories / trackedDays.length) : 0;
  const target = profile?.dailyCalorieTarget ?? 2000;

  return NextResponse.json({
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    dailyTarget: target,
    dailyData,
    summary: {
      totalCalories,
      avgCalories,
      trackedDays: trackedDays.length,
      totalDays: days.length,
      daysOverTarget: trackedDays.filter((d) => d.calories > target).length,
      daysUnderTarget: trackedDays.filter((d) => d.calories <= target).length,
      highestDay: trackedDays.length ? Math.max(...trackedDays.map((d) => d.calories)) : 0,
      lowestDay: trackedDays.length ? Math.min(...trackedDays.map((d) => d.calories)) : 0,
      totalProtein: Math.round(trackedDays.reduce((s, d) => s + d.protein, 0)),
      totalCarbs: Math.round(trackedDays.reduce((s, d) => s + d.carbs, 0)),
      totalFat: Math.round(trackedDays.reduce((s, d) => s + d.fat, 0)),
    },
  });
}
