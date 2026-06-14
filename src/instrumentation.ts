// Runs once when the Next.js server starts. Hostinger builds happen in an
// isolated sandbox that cannot reach the production MySQL, so the schema can't
// be created at build time. Here, at runtime, `localhost` is the real database,
// and the bundled Prisma client lets us ensure the tables exist without relying
// on the Prisma CLI (which is pruned from the deployed standalone bundle).
//
// The statements are idempotent (CREATE TABLE IF NOT EXISTS), so this is safe to
// run on every boot. The DDL mirrors prisma/schema.prisma; keep them in sync.
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

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[schema-init] DATABASE_URL not set; skipping schema bootstrap.");
    return;
  }

  // Never let schema setup block server startup indefinitely. If the database is
  // slow or unreachable, log and move on; DB-backed routes will surface errors.
  const bootstrap = (async () => {
    const { prisma } = await import("@/lib/prisma");
    for (const statement of SCHEMA_STATEMENTS) {
      await prisma.$executeRawUnsafe(statement);
    }
  })();

  const timeout = new Promise<never>((_resolve, reject) =>
    setTimeout(() => reject(new Error("schema bootstrap timed out after 15s")), 15000)
  );

  try {
    await Promise.race([bootstrap, timeout]);
    console.log("[schema-init] Database schema verified.");
  } catch (error) {
    console.error("[schema-init] Failed to ensure database schema:", error);
  }
}
