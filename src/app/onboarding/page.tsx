"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Step = 1 | 2 | 3;

interface FormData {
  displayName: string;
  sex: string;
  age: string;
  heightCm: string;
  currentWeightKg: string;
  targetWeightKg: string;
  activityLevel: string;
  goalType: string;
  weeklyTargetKg: string;
  dailyCalorieTarget: string;
}

function calcTDEE(data: FormData): number {
  const weight = parseFloat(data.currentWeightKg);
  const height = parseFloat(data.heightCm);
  const age = parseInt(data.age);
  if (!weight || !height || !age) return 0;

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (data.sex === "male") bmr += 5;
  else if (data.sex === "female") bmr -= 161;
  else bmr -= 78;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = Math.round(bmr * (multipliers[data.activityLevel] ?? 1.55));

  const deficits: Record<string, number> = { "0.25": 275, "0.5": 550, "0.75": 825 };
  const deficit = deficits[data.weeklyTargetKg] ?? 550;

  if (data.goalType === "lose_weight") return Math.max(1200, tdee - deficit);
  if (data.goalType === "gain_weight") return tdee + deficit;
  return tdee;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    displayName: "",
    sex: "",
    age: "",
    heightCm: "",
    currentWeightKg: "",
    targetWeightKg: "",
    activityLevel: "",
    goalType: "",
    weeklyTargetKg: "0.5",
    dailyCalorieTarget: "",
  });

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const estimatedTarget = calcTDEE(form);

  function handleNext() {
    setError("");
    if (step === 1) {
      if (!form.displayName || !form.sex || !form.age || !form.heightCm || !form.currentWeightKg) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (step === 2) {
      if (!form.activityLevel || !form.goalType) {
        setError("Please select your activity level and goal.");
        return;
      }
      if (estimatedTarget > 0 && !form.dailyCalorieTarget) {
        set("dailyCalorieTarget", String(estimatedTarget));
      }
    }
    setStep((s) => (s + 1) as Step);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const target = form.dailyCalorieTarget || String(estimatedTarget);
    if (!target || parseInt(target) < 800) {
      setError("Please set a valid calorie target (at least 800 kcal).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          sex: form.sex,
          age: parseInt(form.age),
          heightCm: parseFloat(form.heightCm),
          currentWeightKg: parseFloat(form.currentWeightKg),
          targetWeightKg: form.targetWeightKg ? parseFloat(form.targetWeightKg) : null,
          activityLevel: form.activityLevel,
          goalType: form.goalType,
          weeklyTargetKg: form.weeklyTargetKg ? parseFloat(form.weeklyTargetKg) : null,
          calculatedTdee: estimatedTarget || null,
          dailyCalorieTarget: parseInt(target),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] flex flex-col items-center justify-start px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:justify-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <span className="font-bold text-[#f97316] text-xl tracking-tight">CalorieSnap</span>
          <h1 className="text-2xl font-bold text-[#1f1f1f] mt-3 mb-1">Set up your profile</h1>
          <p className="text-sm text-gray-500">We use this to personalise your calorie target</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6 justify-center">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={[
                "h-1.5 w-10 rounded-full transition-colors duration-300",
                s <= step ? "bg-[#f97316]" : "bg-[#fed7aa]",
              ].join(" ")}
            />
          ))}
        </div>

        <Card>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1f1f1f] mb-4">About you</h2>
              <Input
                label="Display name"
                placeholder="How should we call you?"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                required
              />
              <Select
                label="Biological sex"
                value={form.sex}
                onChange={(e) => set("sex", e.target.value)}
                placeholder="Select sex"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer_not_to_say", label: "Prefer not to say" },
                ]}
                hint="Used for calorie calculation (Mifflin-St Jeor formula)"
              />
              <Input
                label="Age"
                type="number"
                placeholder="e.g. 28"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                min={10}
                max={120}
                required
              />
              <Input
                label="Height (cm)"
                type="number"
                placeholder="e.g. 170"
                value={form.heightCm}
                onChange={(e) => set("heightCm", e.target.value)}
                min={50}
                max={300}
                required
              />
              <Input
                label="Current weight (kg)"
                type="number"
                placeholder="e.g. 70"
                step="0.1"
                value={form.currentWeightKg}
                onChange={(e) => set("currentWeightKg", e.target.value)}
                min={20}
                max={500}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1f1f1f] mb-4">Your goals</h2>
              <Select
                label="Activity level"
                value={form.activityLevel}
                onChange={(e) => set("activityLevel", e.target.value)}
                placeholder="Select activity level"
                options={[
                  { value: "sedentary", label: "Sedentary (desk job, little exercise)" },
                  { value: "light", label: "Light (1–3 days/week exercise)" },
                  { value: "moderate", label: "Moderate (3–5 days/week exercise)" },
                  { value: "active", label: "Active (6–7 days/week exercise)" },
                  { value: "very_active", label: "Very active (physical job + exercise)" },
                ]}
              />
              <Select
                label="Goal"
                value={form.goalType}
                onChange={(e) => set("goalType", e.target.value)}
                placeholder="Select your goal"
                options={[
                  { value: "lose_weight", label: "Lose weight" },
                  { value: "maintain_weight", label: "Maintain weight" },
                  { value: "gain_weight", label: "Gain weight" },
                ]}
              />
              {(form.goalType === "lose_weight" || form.goalType === "gain_weight") && (
                <Select
                  label="Weekly target"
                  value={form.weeklyTargetKg}
                  onChange={(e) => set("weeklyTargetKg", e.target.value)}
                  options={
                    form.goalType === "lose_weight"
                      ? [
                          { value: "0.25", label: "Slow (0.25 kg/week)" },
                          { value: "0.5", label: "Moderate (0.5 kg/week)" },
                          { value: "0.75", label: "Fast (0.75 kg/week)" },
                        ]
                      : [
                          { value: "0.25", label: "Slow (0.25 kg/week)" },
                          { value: "0.5", label: "Moderate (0.5 kg/week)" },
                        ]
                  }
                />
              )}
              <Input
                label="Target weight (kg) — optional"
                type="number"
                placeholder="e.g. 65"
                step="0.1"
                value={form.targetWeightKg}
                onChange={(e) => set("targetWeightKg", e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-semibold text-[#1f1f1f] mb-2">Your calorie target</h2>

              {estimatedTarget > 0 && (
                <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-4">
                  <p className="text-sm text-[#ea580c] font-medium mb-1">AI estimate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#f97316]">{estimatedTarget} kcal/day</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on Mifflin-St Jeor formula + activity level
                  </p>
                </div>
              )}

              <Input
                label="Daily calorie target (kcal)"
                type="number"
                placeholder={estimatedTarget > 0 ? String(estimatedTarget) : "e.g. 1800"}
                value={form.dailyCalorieTarget}
                onChange={(e) => set("dailyCalorieTarget", e.target.value)}
                hint="Override the estimate if you prefer a specific target"
                min={800}
                max={10000}
              />

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This is an estimate, not medical advice. Consult a healthcare provider before making significant dietary changes.
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Complete setup
              </Button>
            </form>
          )}

          {error && step < 3 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step < 3 && (
            <div className="mt-6">
              <Button onClick={handleNext} className="w-full" size="lg">
                Continue
              </Button>
            </div>
          )}
        </Card>

        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full text-center"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
