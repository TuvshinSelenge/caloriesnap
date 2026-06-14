import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) redirect("/onboarding");

  const now = new Date();
  const todayMeals = await prisma.meal.findMany({
    where: {
      userId,
      eatenAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { eatenAt: "desc" },
  });

  const consumed = todayMeals.reduce((s: number, m) => s + m.calories, 0);
  const protein = todayMeals.reduce((s: number, m) => s + (m.proteinG ?? 0), 0);
  const carbs = todayMeals.reduce((s: number, m) => s + (m.carbsG ?? 0), 0);
  const fat = todayMeals.reduce((s: number, m) => s + (m.fatG ?? 0), 0);

  return (
    <AppShell>
      <DashboardClient
        profile={{
          displayName: profile.displayName,
          dailyCalorieTarget: profile.dailyCalorieTarget,
        }}
        initialMeals={todayMeals.map((m) => ({
          ...m,
          eatenAt: m.eatenAt.toISOString(),
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
          aiAssumptions: m.aiAssumptions as object | null,
        }))}
        initialTotals={{ consumed, protein, carbs, fat }}
      />
    </AppShell>
  );
}
