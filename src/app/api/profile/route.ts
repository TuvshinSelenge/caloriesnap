import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  displayName: z.string().min(1).max(100),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  age: z.number().int().min(10).max(120),
  heightCm: z.number().min(50).max(300),
  currentWeightKg: z.number().min(20).max(500),
  targetWeightKg: z.number().nullable().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goalType: z.enum(["lose_weight", "maintain_weight", "gain_weight"]),
  weeklyTargetKg: z.number().nullable().optional(),
  calculatedTdee: z.number().int().nullable().optional(),
  dailyCalorieTarget: z.number().int().min(800),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { ...parsed.data, userId: session.user.id },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = profileSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: parsed.data,
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
