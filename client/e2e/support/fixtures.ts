import { createHash } from "node:crypto";

import { test as base, expect } from "@playwright/test";

// The app's progressive sign-in rate limiter fingerprints the client IP
// (from AUTH_TRUSTED_PROXY_IP_HEADER, x-forwarded-for in CI) as one of its
// two dimensions. Playwright's browser talks directly to the dev server
// with no reverse proxy in front of it, so without this header every test
// in the suite would fingerprint to the same "unknown" IP and share one
// rate-limit bucket — a test that deliberately triggers a restriction
// (e.g. e2e/rate-limits.spec.ts) would then block sign-in for every other
// test that happens to run within the same restriction window. Give each
// test its own synthetic IP so tests stay isolated, matching how distinct
// real clients would behave in production.
function syntheticIpFor(testId: string): string {
  const hash = createHash("sha256").update(testId).digest();
  return `10.${hash[0]}.${hash[1]}.${hash[2]}`;
}

export const test = base.extend({
  // Named `provide`, not Playwright's conventional `use`, so the
  // react-hooks ESLint rule (which special-cases the exact identifier
  // `use` as React's built-in hook) doesn't misfire on this call.
  page: async ({ page }, provide, testInfo) => {
    await page.context().setExtraHTTPHeaders({
      "x-forwarded-for": syntheticIpFor(testInfo.testId),
    });
    await provide(page);
  },
});

export { expect };
