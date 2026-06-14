import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Idempotent DDL mirroring prisma/schema.prisma. CREATE TABLE IF NOT EXISTS makes
// this safe to run repeatedly.
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`User\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`email\` VARCHAR(191) NOT NULL,
    \`passwordHash\` VARCHAR(191) NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL,
    UNIQUE INDEX \`User_email_key\`(\`email\`),
    PRIMARY KEY (\`id\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`Profile\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`userId\` VARCHAR(191) NOT NULL,
    \`displayName\` VARCHAR(191) NOT NULL,
    \`sex\` ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    \`age\` INTEGER NOT NULL,
    \`heightCm\` DOUBLE NOT NULL,
    \`currentWeightKg\` DOUBLE NOT NULL,
    \`targetWeightKg\` DOUBLE NULL,
    \`activityLevel\` ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') NOT NULL,
    \`goalType\` ENUM('lose_weight', 'maintain_weight', 'gain_weight') NOT NULL,
    \`weeklyTargetKg\` DOUBLE NULL,
    \`calculatedTdee\` INTEGER NULL,
    \`dailyCalorieTarget\` INTEGER NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL,
    UNIQUE INDEX \`Profile_userId_key\`(\`userId\`),
    PRIMARY KEY (\`id\`),
    CONSTRAINT \`Profile_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`Meal\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`userId\` VARCHAR(191) NOT NULL,
    \`name\` VARCHAR(191) NOT NULL,
    \`eatenAt\` DATETIME(3) NOT NULL,
    \`source\` ENUM('ai_image', 'manual') NOT NULL DEFAULT 'ai_image',
    \`calories\` INTEGER NOT NULL,
    \`proteinG\` DOUBLE NULL,
    \`carbsG\` DOUBLE NULL,
    \`fatG\` DOUBLE NULL,
    \`portionDescription\` VARCHAR(191) NULL,
    \`userNotes\` VARCHAR(191) NULL,
    \`aiConfidence\` DOUBLE NULL,
    \`aiAssumptions\` JSON NULL,
    \`imageStored\` BOOLEAN NOT NULL DEFAULT false,
    \`imageUrl\` VARCHAR(191) NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL,
    INDEX \`Meal_userId_eatenAt_idx\`(\`userId\`, \`eatenAt\`),
    PRIMARY KEY (\`id\`),
    CONSTRAINT \`Meal_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`AiFeedback\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`userId\` VARCHAR(191) NOT NULL,
    \`periodStart\` DATETIME(3) NOT NULL,
    \`periodEnd\` DATETIME(3) NOT NULL,
    \`type\` VARCHAR(191) NOT NULL,
    \`summary\` TEXT NOT NULL,
    \`jsonPayload\` JSON NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX \`AiFeedback_userId_periodStart_periodEnd_idx\`(\`userId\`, \`periodStart\`, \`periodEnd\`),
    PRIMARY KEY (\`id\`),
    CONSTRAINT \`AiFeedback_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

function jsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

// TEMPORARY setup/diagnostic endpoint. Call once after deploy to create the
// schema, then it doubles as a health check. Lives under /api/auth/* so the
// middleware treats it as public. Remove before going fully public.
export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  const result: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    databaseUrl: masked,
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    result.connection = "ok";
  } catch (error) {
    result.connection = "failed";
    result.connectionError = error instanceof Error ? error.message : String(error);
    return NextResponse.json(jsonSafe(result), { status: 200 });
  }

  const created: string[] = [];
  try {
    for (const statement of SCHEMA_STATEMENTS) {
      await prisma.$executeRawUnsafe(statement);
      created.push(statement.split("`")[1]);
    }
    result.schema = "ensured";
    result.tablesEnsured = created;
  } catch (error) {
    result.schemaError = error instanceof Error ? error.message : String(error);
  }

  try {
    result.tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    result.userCount = await prisma.user.count();
  } catch (error) {
    result.introspectError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(jsonSafe(result), { status: 200 });
}
