import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

// Diagnostic endpoint for DB connectivity and schema readiness.
// Works for Postgres/Supabase without executing provider-specific DDL.
export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  const result: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    directUrlSet: Boolean(process.env.DIRECT_URL),
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

  try {
    result.userCount = await prisma.user.count();
    result.schema = "ready";
  } catch (error) {
    result.schema = "missing_or_not_migrated";
    result.schemaError = error instanceof Error ? error.message : String(error);
  }

  try {
    // Postgres table introspection
    result.tables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    result.userCount = await prisma.user.count();
  } catch (error) {
    result.introspectError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(jsonSafe(result), { status: 200 });
}
