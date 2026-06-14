import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required when using a custom server.js
  // Disables the built-in Next.js server so our server.js takes over
  experimental: {},
};

export default nextConfig;
