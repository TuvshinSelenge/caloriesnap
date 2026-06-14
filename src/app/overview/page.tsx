"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { WeeklyCaloriesChart } from "@/components/charts/WeeklyCaloriesChart";
import { MonthlyCaloriesChart } from "@/components/charts/MonthlyCaloriesChart";
import { MacroDistributionChart } from "@/components/charts/MacroDistributionChart";
import { FeedbackCard } from "@/components/dashboard/FeedbackCard";

interface OverviewData {
  range: string;
  dailyTarget: number;
  dailyData: {
    date: string;
    label: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealCount: number;
  }[];
  summary: {
    totalCalories: number;
    avgCalories: number;
    trackedDays: number;
    totalDays: number;
    daysOverTarget: number;
    daysUnderTarget: number;
    highestDay: number;
    lowestDay: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

function OverviewContent() {
  const params = useSearchParams();
  const range = params.get("range") ?? "week";
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/overview?range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1f1f1f]">Overview</h1>
        <div className="flex bg-white border border-[#fed7aa]/60 rounded-xl overflow-hidden shadow-sm">
          <Link
            href="/overview?range=week"
            className={[
              "px-4 py-1.5 text-sm font-medium transition-colors",
              range === "week"
                ? "bg-[#f97316] text-white"
                : "text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            Week
          </Link>
          <Link
            href="/overview?range=month"
            className={[
              "px-4 py-1.5 text-sm font-medium transition-colors",
              range === "month"
                ? "bg-[#f97316] text-white"
                : "text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            Month
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <Card>
          <p className="text-center text-gray-400 py-8">Failed to load overview.</p>
        </Card>
      ) : (
        <>
          {/* Chart */}
          <Card>
            <h2 className="font-semibold text-[#1f1f1f] mb-1">
              {range === "week" ? "Last 7 days" : "This month"}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Dashed line = daily target ({data.dailyTarget} kcal)
            </p>
            {range === "week" ? (
              <WeeklyCaloriesChart data={data.dailyData} target={data.dailyTarget} />
            ) : (
              <MonthlyCaloriesChart data={data.dailyData} target={data.dailyTarget} />
            )}
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Avg daily", value: `${data.summary.avgCalories} kcal` },
              { label: "Days tracked", value: `${data.summary.trackedDays}/${data.summary.totalDays}` },
              { label: "Days over target", value: String(data.summary.daysOverTarget), accent: data.summary.daysOverTarget > 0 },
              { label: "Days on target", value: String(data.summary.daysUnderTarget) },
              { label: "Highest day", value: `${data.summary.highestDay} kcal` },
              { label: "Lowest day", value: data.summary.lowestDay > 0 ? `${data.summary.lowestDay} kcal` : "—" },
            ].map((stat) => (
              <Card key={stat.label} padding="sm">
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className={["text-xl font-bold", stat.accent ? "text-red-500" : "text-[#1f1f1f]"].join(" ")}>
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Macro distribution */}
          {(data.summary.totalProtein + data.summary.totalCarbs + data.summary.totalFat) > 0 && (
            <Card>
              <h2 className="font-semibold text-[#1f1f1f] mb-1">Macro distribution</h2>
              <p className="text-xs text-gray-400 mb-3">Total for the period</p>
              <MacroDistributionChart
                protein={data.summary.totalProtein}
                carbs={data.summary.totalCarbs}
                fat={data.summary.totalFat}
              />
            </Card>
          )}

          {/* Weekly feedback */}
          <FeedbackCard />
        </>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <OverviewContent />
      </Suspense>
    </AppShell>
  );
}
