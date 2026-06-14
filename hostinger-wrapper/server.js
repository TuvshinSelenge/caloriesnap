process.env.NODE_ENV = process.env.NODE_ENV || "production";
// Force bind to all interfaces. Hostinger sets HOSTNAME to the machine hostname,
// which makes the Next standalone server bind to the wrong interface so the
// LiteSpeed proxy can't reach it (502/503). Overriding to 0.0.0.0 fixes this.
process.env.HOSTNAME = "0.0.0.0";

const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "app");
const envPath = path.join(appDir, ".env");

// Load app/.env into the process environment (DATABASE_URL, AUTH_SECRET, etc.).
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Boot the self-contained Next standalone server. It reads PORT/HOSTNAME from the
// environment and binds to 0.0.0.0:$PORT, which Hostinger's proxy connects to.
const serverPaths = [
  path.join(appDir, ".next", "standalone", "server.js"),
  path.join(appDir, ".next", "standalone", "app", "server.js"),
];

const serverPath = serverPaths.find((candidate) => fs.existsSync(candidate));

if (!serverPath) {
  console.error(
    `Next standalone server not found. Checked:\n  ${serverPaths.join("\n  ")}`
  );
  process.exit(1);
}

require(serverPath);
