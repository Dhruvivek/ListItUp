import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const smtpFailureBaseURL =
  process.env.PLAYWRIGHT_SMTP_FAILURE_BASE_URL ?? "http://127.0.0.1:4174";
// An unreachable local port: real SMTP-failure browser coverage needs a
// server whose mailer genuinely cannot deliver, not a mocked send.
const UNREACHABLE_SMTP_PORT = "65500";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // These journeys chain several real network round trips (Mailpit polling,
  // password hashing, Redis-backed rate limits) and, in dev mode, on-demand
  // route compilation — longer than the 30s/5s defaults comfortably cover.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: [
    {
      command: "pnpm dev -p 4173",
      env: {
        ...process.env,
        BETTER_AUTH_URL: baseURL,
      },
      url: baseURL,
      reuseExistingServer: false,
    },
    {
      command: "pnpm dev -p 4174",
      env: {
        ...process.env,
        BETTER_AUTH_URL: smtpFailureBaseURL,
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: UNREACHABLE_SMTP_PORT,
        NEXT_DIST_DIR: ".next-smtp-failure",
      },
      url: smtpFailureBaseURL,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "chromium",
      testIgnore: /smtp-failure\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-smtp-failure",
      testMatch: /smtp-failure\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: smtpFailureBaseURL },
    },
  ],
});
