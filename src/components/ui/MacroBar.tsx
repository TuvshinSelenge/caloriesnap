"use client";

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const total = protein + carbs + fat || 1;
  const proteinPct = (protein / total) * 100;
  const carbsPct = (carbs / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div
          className="bg-blue-400 transition-all duration-500"
          style={{ width: `${proteinPct}%` }}
        />
        <div
          className="bg-[#f97316] transition-all duration-500"
          style={{ width: `${carbsPct}%` }}
        />
        <div
          className="bg-yellow-400 transition-all duration-500"
          style={{ width: `${fatPct}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          Protein {Math.round(protein)}g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f97316] inline-block" />
          Carbs {Math.round(carbs)}g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          Fat {Math.round(fat)}g
        </span>
      </div>
    </div>
  );
}
