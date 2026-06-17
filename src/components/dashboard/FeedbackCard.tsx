"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { WeeklyFeedbackResult } from "@/lib/gemini/schemas";

interface FeedbackPayload extends WeeklyFeedbackResult {
  // stored in jsonPayload field
}

export function FeedbackCard() {
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/feedback/weekly")
      .then((r) => r.json())
      .then((d) => {
        if (d.feedback?.jsonPayload) {
          setFeedback(d.feedback.jsonPayload as FeedbackPayload);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/feedback/weekly", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate feedback");
        return;
      }
      setFeedback(data.feedback);
    } catch {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading feedback...</span>
        </div>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <h2 className="font-semibold text-[#1f1f1f] mb-2">Weekly AI feedback</h2>
        <p className="text-sm text-gray-500 mb-4">
          Get personalised feedback on your last 7 days of eating patterns.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-3">
            {error}
          </div>
        )}
        <Button onClick={handleGenerate} loading={generating} className="w-full">
          Generate weekly feedback
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#ea580c] mb-1">AI Weekly Feedback</p>
          <h2 className="font-bold text-[#1f1f1f] text-lg leading-tight">{feedback.headline}</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="min-h-9 self-start text-sm sm:text-xs text-[#f97316] hover:underline flex-shrink-0 disabled:opacity-50"
        >
          {generating ? "Updating..." : "Refresh"}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{feedback.summary}</p>

      {feedback.positivePatterns.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-green-700 mb-2">What went well</p>
          <ul className="space-y-1">
            {feedback.positivePatterns.map((p) => (
              <li key={p} className="text-sm text-gray-600 flex gap-2">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvementAreas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">Could improve</p>
          <ul className="space-y-1">
            {feedback.improvementAreas.map((a) => (
              <li key={a} className="text-sm text-gray-600 flex gap-2">
                <span className="text-amber-500 flex-shrink-0">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.nextWeekSuggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#ea580c] mb-2">Next week</p>
          <ul className="space-y-1">
            {feedback.nextWeekSuggestions.map((s) => (
              <li key={s} className="text-sm text-gray-600 flex gap-2">
                <span className="text-[#f97316] flex-shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.safetyNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ {feedback.safetyNote}
        </div>
      )}
    </Card>
  );
}
