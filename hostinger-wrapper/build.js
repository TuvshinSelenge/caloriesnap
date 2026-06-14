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

run("npm", ["ci"]);
run("npx", ["prisma", "db", "push"]);
run("npm", ["run", "build"]);
