import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeFoodImage } from "@/lib/gemini/analyzeFoodImage";
import { getGeminiHttpError } from "@/lib/gemini/client";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = parseInt(process.env.MAX_IMAGE_UPLOAD_MB ?? "6") * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit: 10 analyses per minute per user
  if (!rateLimit(`analyze:${userId}`, 10, 60_000)) {
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  const hint = (formData.get("hint") as string | null) ?? undefined;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image too large. Max ${process.env.MAX_IMAGE_UPLOAD_MB ?? 6}MB.` },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const analysis = await analyzeFoodImage({
      imageBuffer,
      mimeType: file.type,
      userHint: hint,
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
    console.error("Gemini analysis error:", err);
    const error = getGeminiHttpError(err, "Failed to analyze image. Please try again.");
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
}
