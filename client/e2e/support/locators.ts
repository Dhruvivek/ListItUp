import type { Locator, Page } from "@playwright/test";

// Next.js's App Router renders its own route-change announcer with
// role="alert" on every page (#__next-route-announcer__), which collides
// with getByRole("alert") whenever a page also renders its own inline alert.
export function pageAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
