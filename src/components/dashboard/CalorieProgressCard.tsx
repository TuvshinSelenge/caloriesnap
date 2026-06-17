"use client";

import { ProgressRing } from "@/components/ui/ProgressRing";
import { MacroBar } from "@/components/ui/MacroBar";

interface CalorieProgressCardProps {
  consumed: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function CalorieProgressCard({
  consumed,
  target,
  protein,
  carbs,
  fat,
}: CalorieProgressCardProps) {
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target;

  return (
    <div className="bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <ProgressRing
          value={consumed}
          max={target}
          size={104}
          stroke={10}
          label={String(consumed)}
          sublabel="kcal"
        />
        <div className="w-full flex-1">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-center sm:text-left">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Target</p>
              <p className="text-lg font-bold text-[#1f1f1f]">{target}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{over ? "Over by" : "Remaining"}</p>
              <p className={["text-lg font-bold", over ? "text-red-500" : "text-[#f97316]"].join(" ")}>
                {over ? consumed - target : remaining}
              </p>
            </div>
          </div>
          <MacroBar protein={protein} carbs={carbs} fat={fat} />
        </div>
      </div>
    </div>
  );
}
