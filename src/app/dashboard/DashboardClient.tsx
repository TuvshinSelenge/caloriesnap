"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalorieProgressCard } from "@/components/dashboard/CalorieProgressCard";
import { UploadMealCard } from "@/components/meals/UploadMealCard";
import { MealCard } from "@/components/meals/MealCard";

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

interface Props {
  profile: { displayName: string; dailyCalorieTarget: number };
  initialMeals: Meal[];
  initialTotals: { consumed: number; protein: number; carbs: number; fat: number };
}

export function DashboardClient({ profile, initialMeals, initialTotals }: Props) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [totals, setTotals] = useState(initialTotals);

  async function refreshMeals() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const res = await fetch(`/api/meals?from=${from}&to=${to}`);
    if (!res.ok) return;
    const data = await res.json();
    setMeals(data.meals);
    const consumed = data.meals.reduce((s: number, m: Meal) => s + m.calories, 0);
    const protein = data.meals.reduce((s: number, m: Meal) => s + (m.proteinG ?? 0), 0);
    const carbs = data.meals.reduce((s: number, m: Meal) => s + (m.carbsG ?? 0), 0);
    const fat = data.meals.reduce((s: number, m: Meal) => s + (m.fatG ?? 0), 0);
    setTotals({ consumed, protein, carbs, fat });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await refreshMeals();
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#1f1f1f]">
          {greeting}, {profile.displayName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Calorie progress */}
      <CalorieProgressCard
        consumed={totals.consumed}
        target={profile.dailyCalorieTarget}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
      />

      {/* Upload */}
      <UploadMealCard onMealSaved={refreshMeals} />

      {/* Today's meals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1f1f1f]">
            Today&apos;s meals
            {meals.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({meals.length})
              </span>
            )}
          </h2>
          <Link href="/history" className="text-sm text-[#f97316] hover:underline">
            See all →
          </Link>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-[#fed7aa]/60">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm text-gray-400">No meals logged yet today</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/overview?range=week"
          className="bg-white rounded-2xl border border-[#fed7aa]/60 p-4 shadow-sm hover:border-[#f97316]/40 transition-colors"
        >
          <div className="text-xl mb-1">📈</div>
          <p className="font-semibold text-sm text-[#1f1f1f]">Weekly overview</p>
          <p className="text-xs text-gray-400 mt-0.5">See your 7-day trend</p>
        </Link>
        <Link
          href="/overview?range=month"
          className="bg-white rounded-2xl border border-[#fed7aa]/60 p-4 shadow-sm hover:border-[#f97316]/40 transition-colors"
        >
          <div className="text-xl mb-1">📅</div>
          <p className="font-semibold text-sm text-[#1f1f1f]">Monthly overview</p>
          <p className="text-xs text-gray-400 mt-0.5">Patterns across the month</p>
        </Link>
      </div>
    </div>
  );
}
