/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger runs the app via hostinger-wrapper/server.js, which boots the
  // minimal server emitted by standalone output (.next/standalone/server.js).
  output: "standalone",
};

module.exports = nextConfig;
