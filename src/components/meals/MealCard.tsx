"use client";

import { format } from "date-fns";

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    eatenAt: string | Date;
    calories: number;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    portionDescription?: string | null;
    source: string;
    aiConfidence?: number | null;
  };
  onDelete?: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-[#fff7ed] flex items-center justify-center text-lg flex-shrink-0">
        {meal.source === "ai_image" ? "📸" : "✏️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-[#1f1f1f] text-sm truncate">{meal.name}</p>
            {meal.portionDescription && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{meal.portionDescription}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-[#f97316] text-sm">{meal.calories} kcal</p>
            <p className="text-xs text-gray-400">
              {format(new Date(meal.eatenAt), "HH:mm")}
            </p>
          </div>
        </div>
        {(meal.proteinG || meal.carbsG || meal.fatG) && (
          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
            {meal.proteinG != null && <span>P {Math.round(meal.proteinG)}g</span>}
            {meal.carbsG != null && <span>C {Math.round(meal.carbsG)}g</span>}
            {meal.fatG != null && <span>F {Math.round(meal.fatG)}g</span>}
          </div>
        )}
        {meal.aiConfidence != null && meal.source === "ai_image" && (
          <div className="mt-1.5">
            <span className="text-xs text-gray-400">
              AI confidence: {Math.round(meal.aiConfidence * 100)}%
            </span>
          </div>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(meal.id)}
          className="-m-2 min-h-11 min-w-11 p-2 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Delete meal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}
