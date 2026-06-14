"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MacroDistributionChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

const COLORS = ["#60a5fa", "#fb923c", "#facc15"];

export function MacroDistributionChart({ protein, carbs, fat }: MacroDistributionChartProps) {
  const total = protein + carbs + fat;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No macro data yet
      </div>
    );
  }

  const data = [
    { name: "Protein", value: Math.round(protein), pct: Math.round((protein / total) * 100) },
    { name: "Carbs", value: Math.round(carbs), pct: Math.round((carbs / total) * 100) },
    { name: "Fat", value: Math.round(fat), pct: Math.round((fat / total) * 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          dataKey="value"
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value}g`, String(name)]}
          contentStyle={{
            background: "white",
            border: "1px solid #fed7aa",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        />
        <Legend
          formatter={(value, entry) => {
            const item = data.find((d) => d.name === value);
            return `${value} ${item?.pct ?? 0}%`;
          }}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
