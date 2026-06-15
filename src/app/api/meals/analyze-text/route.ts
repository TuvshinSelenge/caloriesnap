import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeFoodText } from "@/lib/gemini/analyzeFoodText";
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
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI is not configured: GEMINI_API_KEY is missing on the server." },
        { status: 503 }
      );
    }
    if (/api key|API_KEY_INVALID|permission|401|403/i.test(message)) {
      return NextResponse.json(
        { error: "AI rejected the request — check that GEMINI_API_KEY is valid." },
        { status: 502 }
      );
    }
    if (/not found|404|model/i.test(message)) {
      return NextResponse.json(
        { error: `AI model error — check GEMINI_MODEL. (${message})` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to estimate from your description. Please try again." },
      { status: 500 }
    );
  }
}
