process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

const fs = require("node:fs");
const path = require("node:path");
const { createServer } = require("node:http");
const { parse } = require("node:url");

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

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Run Next as a custom server (no standalone output). This boots Next from the
// app/ project directory and binds explicitly to the platform-assigned PORT on
// 0.0.0.0, which is what Hostinger's LiteSpeed proxy connects to.
const next = require(path.join(appDir, "node_modules", "next"));
const nextApp = next({ dev: false, dir: appDir, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res, parse(req.url, true)).catch((err) => {
        console.error("Error handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      });
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
