"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DayData {
  label: string;
  calories: number;
  mealCount: number;
}

interface MonthlyCaloriesChartProps {
  data: DayData[];
  target: number;
}

export function MonthlyCaloriesChart({ data, target }: MonthlyCaloriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa40" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value} kcal`, "Calories"]}
          contentStyle={{
            background: "white",
            border: "1px solid #fed7aa",
            borderRadius: "12px",
            fontSize: "13px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "#fff7ed" }}
        />
        <ReferenceLine y={target} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1.5} />
        <Bar
          dataKey="calories"
          fill="#fb923c"
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
