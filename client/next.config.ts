import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  // Lets the browser SMTP-failure test run a second `next dev` instance
  // against its own build output, so it doesn't race the primary instance's
  // .next directory.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The repo root has its own pnpm-lock.yaml for tooling (husky, prettier),
  // which makes Next.js infer the wrong workspace root. Pin it to this app.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
