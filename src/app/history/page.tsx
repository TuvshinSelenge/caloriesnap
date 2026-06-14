"use client";

import { useEffect, useState } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { MealCard } from "@/components/meals/MealCard";
import { Card } from "@/components/ui/Card";

interface Meal {
  id: string;
  name: string;
  eatenAt: string;
  calories: number;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  portionDescription?: string | null;
  source: string;
  aiConfidence?: number | null;
}

interface DayGroup {
  date: string;
  label: string;
  meals: Meal[];
  totalCalories: number;
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(new Date(), 29));
    fetch(`/api/meals?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        const meals: Meal[] = data.meals ?? [];
        // Group by day
        const map = new Map<string, Meal[]>();
        for (const meal of meals) {
          const day = format(new Date(meal.eatenAt), "yyyy-MM-dd");
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push(meal);
        }
        const grouped: DayGroup[] = [];
        map.forEach((dayMeals, date) => {
          grouped.push({
            date,
            label: format(new Date(date), "EEEE, MMMM d"),
            meals: dayMeals,
            totalCalories: dayMeals.reduce((s, m) => s + m.calories, 0),
          });
        });
        grouped.sort((a, b) => b.date.localeCompare(a.date));
        setGroups(grouped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    setGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          meals: g.meals.filter((m) => m.id !== id),
          totalCalories: g.meals.filter((m) => m.id !== id).reduce((s, m) => s + m.calories, 0),
        }))
        .filter((g) => g.meals.length > 0)
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-[#1f1f1f]">Meal history</h1>
        <p className="text-sm text-gray-500 -mt-3">Last 30 days</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400">No meals logged in the last 30 days</p>
            </div>
          </Card>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-500">{group.label}</h2>
                <span className="text-sm font-medium text-[#f97316]">
                  {group.totalCalories} kcal
                </span>
              </div>
              <div className="space-y-2">
                {group.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
