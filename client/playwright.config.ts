import { defineConfig, devices } from "@playwright/test";

import {
  BASE_URL,
  SMTP_FAILURE_BASE_URL,
  SMTP_FAILURE_PORT,
  UNREACHABLE_SMTP_HOST,
  UNREACHABLE_SMTP_PORT,
} from "./e2e/support/config";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // These journeys chain several real network round trips (Mailpit polling,
  // password hashing, Redis-backed rate limits) and, in dev mode, on-demand
  // route compilation — longer than the 30s/5s defaults comfortably cover.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  webServer: [
    {
      command: "pnpm dev -p 4173",
      env: {
        ...process.env,
        BETTER_AUTH_URL: BASE_URL,
      },
      url: BASE_URL,
      reuseExistingServer: false,
    },
    {
      command: `pnpm dev -p ${SMTP_FAILURE_PORT}`,
      env: {
        ...process.env,
        BETTER_AUTH_URL: SMTP_FAILURE_BASE_URL,
        NEXT_DIST_DIR: ".next-smtp-failure",
        SMTP_HOST: UNREACHABLE_SMTP_HOST,
        SMTP_PORT: UNREACHABLE_SMTP_PORT,
      },
      url: SMTP_FAILURE_BASE_URL,
      reuseExistingServer: false,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
