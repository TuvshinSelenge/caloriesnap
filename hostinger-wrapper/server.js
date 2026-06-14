process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "app");
const envPath = path.join(appDir, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

// NOTE: Database schema creation happens in-process via Next's instrumentation
// hook (src/instrumentation.ts) using the bundled Prisma client. We intentionally
// do NOT shell out to `prisma db push` here: it would block startup synchronously
// and the CLI is pruned from the deployed standalone bundle.

const serverPaths = [
  path.join(__dirname, "app/.next/standalone/server.js"),
  path.join(__dirname, "app/.next/standalone/app/server.js"),
];

const serverPath = serverPaths.find((candidate) => fs.existsSync(candidate));

if (!serverPath) {
  throw new Error(`Next standalone server not found. Checked: ${serverPaths.join(", ")}`);
}

require(serverPath);
