import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const saveMealSchema = z.object({
  name: z.string().min(1).max(255),
  eatenAt: z.string().datetime(),
  source: z.enum(["ai_image", "manual"]).default("ai_image"),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().nonnegative().nullable().optional(),
  carbsG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
  portionDescription: z.string().max(500).nullable().optional(),
  userNotes: z.string().max(1000).nullable().optional(),
  aiConfidence: z.number().min(0).max(1).nullable().optional(),
  aiAssumptions: z.any().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      ...(from && to
        ? {
            eatenAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
    },
    orderBy: { eatenAt: "desc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = saveMealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const meal = await prisma.meal.create({
      data: {
        ...parsed.data,
        eatenAt: new Date(parsed.data.eatenAt),
        userId: session.user.id,
      },
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save meal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing meal id" }, { status: 400 });

  const meal = await prisma.meal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.meal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
