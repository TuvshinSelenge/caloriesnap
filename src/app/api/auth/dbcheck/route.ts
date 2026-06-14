import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

// TEMPORARY diagnostic endpoint. Remove after verifying the database works.
// Lives under /api/auth/* so middleware treats it as public.
export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  const result: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    databaseUrl: masked,
  };

  try {
    const ping = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    result.connection = "ok";
    result.ping = ping;
  } catch (error) {
    result.connection = "failed";
    result.connectionError = error instanceof Error ? error.message : String(error);
    return NextResponse.json(jsonSafe(result), { status: 200 });
  }

  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    result.tables = tables;
  } catch (error) {
    result.tablesError = error instanceof Error ? error.message : String(error);
  }

  try {
    result.userCount = await prisma.user.count();
  } catch (error) {
    result.userCountError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(jsonSafe(result), { status: 200 });
}
