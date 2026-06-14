const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle. Hostinger boots it via hostinger-wrapper/server.js.
  // Standalone bundles its own node_modules, so it survives runtime pruning of the
  // app's node_modules (which broke the plain custom-server approach).
  output: "standalone",
  // The wrapper nests this project under app/ next to its own package.json, creating
  // two lockfiles. Pin the tracing root here so the server lands predictably at
  // .next/standalone/server.js (not nested under .next/standalone/app/).
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
