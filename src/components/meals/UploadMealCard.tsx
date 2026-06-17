"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { AnalysisReviewCard, type SaveData } from "./AnalysisReviewCard";
import type { FoodAnalysisResult } from "@/lib/gemini/schemas";

interface UploadMealCardProps {
  onMealSaved: () => void;
}

type Mode = "photo" | "text";
type AnalysisSource = "ai_image" | "manual";

interface AnalysisResponse {
  analysis?: FoodAnalysisResult;
  error?: string;
  source?: AnalysisSource;
  notice?: string;
}

const MAX_ANALYSIS_IMAGE_DIMENSION = 960;
const MAX_DIRECT_IMAGE_BYTES = 600_000;
const ANALYSIS_IMAGE_QUALITY = 0.72;
const ANALYSIS_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function UploadMealCard({ onMealSaved }: UploadMealCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [hint, setHint] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string>();
  const [file, setFile] = useState<File>();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysisResult>();
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>("ai_image");
  const [analysisNotice, setAnalysisNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError("");
    setAnalysisNotice("");
    setAnalysis(undefined);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setAnalysisNotice("");
    setAnalysis(undefined);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  async function handleAnalyze() {
    if (!file) return;
    setError("");
    setAnalysisNotice("");
    setAnalyzing(true);

    try {
      const fd = new FormData();
      const analysisFile = await prepareImageForAnalysis(file);
      if (!ANALYSIS_UPLOAD_TYPES.includes(analysisFile.type)) {
        setError("This image format could not be prepared. Please take a JPEG photo or describe the meal.");
        return;
      }
      fd.append("image", analysisFile);
      if (hint) fd.append("hint", hint);

      const res = await fetch("/api/meals/analyze", { method: "POST", body: fd });
      const data = await readAnalysisResponse(res);

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      if (!data.analysis) {
        setError("Analysis finished but returned no result. Please try describing the meal.");
        return;
      }

      setAnalysisSource(data.source ?? "ai_image");
      setAnalysisNotice(data.notice ?? "");
      setAnalysis(data.analysis);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyzeText() {
    if (description.trim().length < 2) {
      setError("Please describe what you ate.");
      return;
    }
    setError("");
    setAnalysisNotice("");
    setAnalyzing(true);

    try {
      const res = await fetch("/api/meals/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), hint: hint || undefined }),
      });
      const data = await readAnalysisResponse(res);

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      if (!data.analysis) {
        setError("Analysis finished but returned no result. Please try again.");
        return;
      }

      setAnalysisSource("manual");
      setAnalysisNotice(data.notice ?? "");
      setAnalysis(data.analysis);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave(saveData: SaveData) {
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...saveData, source: analysisSource }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save meal");
      return;
    }

    resetAll();
    onMealSaved();
  }

  function resetAll() {
    setFile(undefined);
    setPreview(undefined);
    setHint("");
    setDescription("");
    setAnalysis(undefined);
    setAnalysisNotice("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDiscard() {
    resetAll();
  }

  if (analysis) {
    return (
      <AnalysisReviewCard
        analysis={analysis}
        imagePreview={analysisSource === "ai_image" ? preview : undefined}
        notice={analysisNotice}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm p-4 sm:p-5">
      <h3 className="font-semibold text-[#1f1f1f] mb-1">Log a meal</h3>
      <p className="text-sm text-gray-500 mb-4">
        Use a photo or describe the meal. Add portions for the best estimate.
      </p>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#fff7ed] rounded-xl mb-4">
        <button
          type="button"
          onClick={() => switchMode("photo")}
          className={[
            "rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "photo" ? "bg-white text-[#ea580c] shadow-sm" : "text-gray-500 hover:text-[#ea580c]",
          ].join(" ")}
        >
          📸 Photo
        </button>
        <button
          type="button"
          onClick={() => switchMode("text")}
          className={[
            "rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "text" ? "bg-white text-[#ea580c] shadow-sm" : "text-gray-500 hover:text-[#ea580c]",
          ].join(" ")}
        >
          ✏️ Describe
        </button>
      </div>

      {mode === "photo" ? (
        <>
          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className={[
              "min-h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 mb-4 active:scale-[0.99]",
              preview ? "border-[#f97316] p-2" : "border-[#fed7aa] hover:border-[#f97316] p-6",
            ].join(" ")}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Selected food"
                className="max-h-60 rounded-xl object-contain"
              />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#fff7ed] flex items-center justify-center text-2xl mb-3">
                  📸
                </div>
                <p className="text-sm font-medium text-[#1f1f1f] mb-1">Take or upload a photo</p>
                <p className="text-xs text-gray-400">JPEG, PNG or WebP · max 6MB</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {file && (
            <div className="space-y-3">
              <Textarea
                label="Food hint (optional)"
                placeholder="e.g. chicken rice, large portion, with mayo..."
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={2}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => switchMode("text")}
                    className="mt-2 min-h-9 text-sm font-medium text-red-700 underline underline-offset-2"
                  >
                    Describe the meal instead
                  </button>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                loading={analyzing}
                className="w-full"
                size="lg"
              >
                {analyzing ? "Analysing with AI..." : "Analyse with AI"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <Textarea
            label="What did you eat?"
            placeholder="e.g. two scrambled eggs, a slice of buttered toast, and a black coffee"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-gray-400 -mt-1">
            Add portion sizes for a better estimate (e.g. &quot;200g&quot;, &quot;1 cup&quot;, &quot;large bowl&quot;).
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            onClick={handleAnalyzeText}
            loading={analyzing}
            className="w-full"
            size="lg"
            disabled={description.trim().length < 2}
          >
            {analyzing ? "Estimating..." : "Estimate calories"}
          </Button>
        </div>
      )}
    </div>
  );
}

async function readAnalysisResponse(res: Response): Promise<AnalysisResponse> {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as AnalysisResponse;
  } catch {
    return {
      error: res.ok
        ? "The server returned an unreadable analysis response. Please try again."
        : "The server returned an unexpected error. Please try again.",
    };
  }
}

async function prepareImageForAnalysis(file: File): Promise<File> {
  try {
    const image = await loadImage(file);
    const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, MAX_ANALYSIS_IMAGE_DIMENSION / largestSide);

    if (scale === 1 && file.size <= MAX_DIRECT_IMAGE_BYTES && file.type === "image/jpeg") {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", ANALYSIS_IMAGE_QUALITY);
    });

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], replaceFileExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    image.src = url;
  });
}

function replaceFileExtension(fileName: string, extension: string): string {
  return fileName.includes(".")
    ? fileName.replace(/\.[^.]+$/, `.${extension}`)
    : `${fileName}.${extension}`;
}
