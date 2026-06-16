import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeFoodText } from "@/lib/gemini/analyzeFoodText";
import { getGeminiHttpError } from "@/lib/gemini/client";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  description: z.string().trim().min(2).max(1000),
  hint: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!rateLimit(`analyze-text:${userId}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json(
      { error: "Please complete your profile first" },
      { status: 400 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please describe what you ate (at least a few words)." },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeFoodText({
      description: parsed.data.description,
      userHint: parsed.data.hint,
      profile: {
        sex: profile.sex,
        age: profile.age,
        heightCm: profile.heightCm,
        currentWeightKg: profile.currentWeightKg,
        dailyCalorieTarget: profile.dailyCalorieTarget,
      },
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Gemini text analysis error:", err);
    const error = getGeminiHttpError(
      err,
      "Failed to estimate from your description. Please try again."
    );
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
}
