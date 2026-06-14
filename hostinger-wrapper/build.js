const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const separator = trimmed.indexOf("=");
      if (separator === -1) return env;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = value;
      return env;
    }, {});
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: path.join(__dirname, "app"),
    env: {
      ...process.env,
      ...loadEnvFile(path.join(__dirname, "app", ".env")),
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Hostinger runs this build on the hosting server itself (under
// .builds/source), so `localhost:3306` is the real production MySQL and the
// Prisma CLI is available here. Push the schema during build to create/update
// tables — this is verifiable in the build logs. (server.js also attempts an
// idempotent runtime push as a backup, in case the CLI is pruned at runtime.)
// The earlier P1000 failures were a stale DB password, now corrected.
run("npm", ["ci"]);
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npm", ["run", "build"]);

// `output: "standalone"` does not copy static assets or the public/ folder into
// the standalone bundle, so the minimal server we boot in server.js would serve
// HTML with no CSS/JS/images. Copy them in so the deployed site is complete.
const appDir = path.join(__dirname, "app");
const standaloneDir = path.join(appDir, ".next", "standalone");

function copyDirIfExists(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`> Copied ${path.relative(appDir, from)} -> ${path.relative(appDir, to)}`);
}

if (fs.existsSync(standaloneDir)) {
  copyDirIfExists(
    path.join(appDir, ".next", "static"),
    path.join(standaloneDir, ".next", "static")
  );
  copyDirIfExists(
    path.join(appDir, "public"),
    path.join(standaloneDir, "public")
  );
} else {
  console.warn(
    "> WARNING: .next/standalone not found after build. Ensure next.config.js sets output: 'standalone'."
  );
}
