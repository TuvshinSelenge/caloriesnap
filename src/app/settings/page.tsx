"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Profile {
  displayName: string;
  sex: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number | null;
  activityLevel: string;
  goalType: string;
  weeklyTargetKg: number | null;
  dailyCalorieTarget: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          setForm(d.profile);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          heightCm: Number(form.heightCm),
          currentWeightKg: Number(form.currentWeightKg),
          targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
          weeklyTargetKg: form.weeklyTargetKg ? Number(form.weeklyTargetKg) : null,
          dailyCalorieTarget: Number(form.dailyCalorieTarget),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setProfile(data.profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-[#1f1f1f]">Settings</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          <Card>
            <p className="text-gray-400 text-center py-6">Profile not found.</p>
          </Card>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Card>
              <h2 className="font-semibold text-[#1f1f1f] mb-4">Personal info</h2>
              <div className="space-y-4">
                <Input
                  label="Display name"
                  value={form.displayName ?? ""}
                  onChange={(e) => set("displayName", e.target.value)}
                  required
                />
                <Select
                  label="Biological sex"
                  value={form.sex ?? ""}
                  onChange={(e) => set("sex", e.target.value)}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Age"
                    type="number"
                    value={form.age ?? ""}
                    onChange={(e) => set("age", parseInt(e.target.value))}
                    min={10}
                    max={120}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={form.heightCm ?? ""}
                    onChange={(e) => set("heightCm", parseFloat(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Current weight (kg)"
                    type="number"
                    step="0.1"
                    value={form.currentWeightKg ?? ""}
                    onChange={(e) => set("currentWeightKg", parseFloat(e.target.value))}
                  />
                  <Input
                    label="Target weight (kg)"
                    type="number"
                    step="0.1"
                    value={form.targetWeightKg ?? ""}
                    onChange={(e) =>
                      set("targetWeightKg", e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-[#1f1f1f] mb-4">Goals</h2>
              <div className="space-y-4">
                <Select
                  label="Activity level"
                  value={form.activityLevel ?? ""}
                  onChange={(e) => set("activityLevel", e.target.value)}
                  options={[
                    { value: "sedentary", label: "Sedentary" },
                    { value: "light", label: "Light activity" },
                    { value: "moderate", label: "Moderate" },
                    { value: "active", label: "Active" },
                    { value: "very_active", label: "Very active" },
                  ]}
                />
                <Select
                  label="Goal"
                  value={form.goalType ?? ""}
                  onChange={(e) => set("goalType", e.target.value)}
                  options={[
                    { value: "lose_weight", label: "Lose weight" },
                    { value: "maintain_weight", label: "Maintain weight" },
                    { value: "gain_weight", label: "Gain weight" },
                  ]}
                />
                <Input
                  label="Daily calorie target (kcal)"
                  type="number"
                  value={form.dailyCalorieTarget ?? ""}
                  onChange={(e) => set("dailyCalorieTarget", parseInt(e.target.value))}
                  min={800}
                />
              </div>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                ✓ Profile updated successfully
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={saving}>
              Save changes
            </Button>
          </form>
        )}

        {/* Sign out */}
        <Card>
          <h2 className="font-semibold text-[#1f1f1f] mb-3">Account</h2>
          <Button
            variant="danger"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full"
          >
            Sign out
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
