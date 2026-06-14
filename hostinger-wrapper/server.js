process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

// Sync the Prisma schema to the database at runtime. This must happen here,
// not during build: the Hostinger build container cannot reach the production
// MySQL server, but at runtime `localhost:3306` is the real database. `db push`
// is idempotent, so running it on every boot is safe.
function syncDatabaseSchema() {
  const schemaPath = path.join(appDir, "prisma", "schema.prisma");
  if (!fs.existsSync(schemaPath)) {
    console.warn("> Skipping DB sync: prisma/schema.prisma not found.");
    return;
  }

  const localBin = path.join(
    appDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma"
  );
  const useLocalBin = fs.existsSync(localBin);
  const command = useLocalBin ? localBin : "npx";
  const args = useLocalBin
    ? ["db", "push", "--schema", schemaPath, "--skip-generate"]
    : ["prisma", "db", "push", "--schema", schemaPath, "--skip-generate"];

  console.log("> Syncing database schema (prisma db push)...");
  const result = spawnSync(command, args, {
    cwd: appDir,
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(
      "> WARNING: prisma db push failed. The app will still start, but " +
        "database-backed features will error until the schema is applied."
    );
  } else {
    console.log("> Database schema is up to date.");
  }
}

syncDatabaseSchema();

const serverPaths = [
  path.join(__dirname, "app/.next/standalone/server.js"),
  path.join(__dirname, "app/.next/standalone/app/server.js"),
];

const serverPath = serverPaths.find((candidate) => fs.existsSync(candidate));

if (!serverPath) {
  throw new Error(`Next standalone server not found. Checked: ${serverPaths.join(", ")}`);
}

require(serverPath);
