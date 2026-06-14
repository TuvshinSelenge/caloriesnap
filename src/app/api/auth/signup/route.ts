import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function getSignupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("Unknown authentication plugin") &&
    message.includes("sha256_password")
  ) {
    return {
      error:
        "Database login is misconfigured. The MySQL user uses sha256_password, which Prisma cannot use here.",
      status: 503,
    };
  }

  if (message.includes("Environment variable not found: DATABASE_URL")) {
    return {
      error: "Database connection is missing. Please set DATABASE_URL.",
      status: 503,
    };
  }

  return {
    error: "Something went wrong. Please try again.",
    status: 500,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, passwordHash } });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    const response = getSignupError(error);

    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    );
  }
}
