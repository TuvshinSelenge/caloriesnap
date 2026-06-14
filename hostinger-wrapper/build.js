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

// NOTE: Do NOT run `prisma db push` here. Hostinger runs the build inside an
// isolated sandbox whose `localhost:3306` is a throwaway MySQL (connections are
// accepted but our production user is rejected with P1000), so build-time pushes
// can never reach the real database. The schema is created via the
// /api/auth/dbcheck endpoint (or phpMyAdmin) once after deploy.
run("npm", ["ci"]);
run("npm", ["run", "build"]);

// Standalone output does not copy static assets or public/ into the bundle, so
// the minimal server would serve HTML with no CSS/JS/images. Copy them in.
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
  copyDirIfExists(path.join(appDir, "public"), path.join(standaloneDir, "public"));
} else {
  console.warn(
    "> WARNING: .next/standalone not found after build. Ensure next.config.js sets output: 'standalone'."
  );
}
