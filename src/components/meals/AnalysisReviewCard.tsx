"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { FoodAnalysisResult } from "@/lib/gemini/schemas";

interface AnalysisReviewCardProps {
  analysis: FoodAnalysisResult;
  imagePreview?: string;
  notice?: string;
  onSave: (data: SaveData) => Promise<void>;
  onDiscard: () => void;
}

export interface SaveData {
  name: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portionDescription: string;
  userNotes: string;
  eatenAt: string;
  aiConfidence: number;
  aiAssumptions: object;
}

export function AnalysisReviewCard({
  analysis,
  imagePreview,
  notice,
  onSave,
  onDiscard,
}: AnalysisReviewCardProps) {
  const [form, setForm] = useState({
    name: analysis.mealName,
    calories: String(analysis.calories.mostLikely),
    proteinG: analysis.macros.proteinG != null ? String(Math.round(analysis.macros.proteinG)) : "",
    carbsG: analysis.macros.carbsG != null ? String(Math.round(analysis.macros.carbsG)) : "",
    fatG: analysis.macros.fatG != null ? String(Math.round(analysis.macros.fatG)) : "",
    portionDescription: analysis.portionDescription,
    userNotes: "",
    eatenAt: toLocalDateTimeInputValue(new Date()),
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave({
      name: form.name,
      calories: parseInt(form.calories) || analysis.calories.mostLikely,
      proteinG: form.proteinG ? parseFloat(form.proteinG) : null,
      carbsG: form.carbsG ? parseFloat(form.carbsG) : null,
      fatG: form.fatG ? parseFloat(form.fatG) : null,
      portionDescription: form.portionDescription,
      userNotes: form.userNotes,
      eatenAt: new Date(form.eatenAt).toISOString(),
      aiConfidence: analysis.confidence,
      aiAssumptions: {
        detectedFoods: analysis.detectedFoods,
        assumptions: analysis.assumptions,
        uncertaintyReasons: analysis.uncertaintyReasons,
      },
    });
    setSaving(false);
  }

  const confidencePct = Math.round(analysis.confidence * 100);
  const confidenceColor =
    confidencePct >= 70 ? "text-green-600" : confidencePct >= 40 ? "text-amber-600" : "text-red-500";

  return (
    <div className="bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#fff7ed] border-b border-[#fed7aa]/60 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Food"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#ea580c] mb-1">AI estimate — please review before saving</p>
            <p className="text-xs text-gray-500">
              Food photos can be inaccurate, especially for hidden oils, sauces, and portion size.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              <span className="text-gray-500">
                Range: {analysis.calories.min}–{analysis.calories.max} kcal
              </span>
              <span className={confidenceColor}>
                Confidence: {confidencePct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {notice}
          </div>
        )}

        {/* Detected foods */}
        {analysis.detectedFoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.detectedFoods.map((food) => (
              <span
                key={food}
                className="px-2 py-0.5 bg-[#fff7ed] border border-[#fed7aa] rounded-full text-xs text-[#ea580c]"
              >
                {food}
              </span>
            ))}
          </div>
        )}

        <Input
          label="Meal name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <Input
          label="Portion description"
          value={form.portionDescription}
          onChange={(e) => set("portionDescription", e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Calories (kcal)"
            type="number"
            value={form.calories}
            onChange={(e) => set("calories", e.target.value)}
            min={0}
          />
          <Input
            label="Protein (g)"
            type="number"
            value={form.proteinG}
            onChange={(e) => set("proteinG", e.target.value)}
            min={0}
          />
          <Input
            label="Carbs (g)"
            type="number"
            value={form.carbsG}
            onChange={(e) => set("carbsG", e.target.value)}
            min={0}
          />
          <Input
            label="Fat (g)"
            type="number"
            value={form.fatG}
            onChange={(e) => set("fatG", e.target.value)}
            min={0}
          />
        </div>

        <Input
          label="Time eaten"
          type="datetime-local"
          value={form.eatenAt}
          onChange={(e) => set("eatenAt", e.target.value)}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="e.g. extra sauce, larger portion..."
          value={form.userNotes}
          onChange={(e) => set("userNotes", e.target.value)}
          rows={2}
        />

        {/* AI assumptions */}
        {(analysis.assumptions.length > 0 || analysis.uncertaintyReasons.length > 0) && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
            {analysis.assumptions.map((a) => (
              <p key={a}>• {a}</p>
            ))}
            {analysis.uncertaintyReasons.map((r) => (
              <p key={r} className="text-amber-600">⚠ {r}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={onDiscard}
            className="flex-1"
            disabled={saving}
          >
            Discard
          </Button>
          <Button onClick={handleSave} className="flex-1" loading={saving}>
            Save meal
          </Button>
        </div>
      </div>
    </div>
  );
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}
