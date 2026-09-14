import type { Locator, Page } from "@playwright/test";

// Two things collide with getByRole("alert") on these auth pages: Next.js's
// App Router route-change announcer (#__next-route-announcer__, present on
// every page), and each field's own validation-error placeholder (e.g.
// AuthTextField's <p role="alert" id="...-error">, always in the DOM, just
// empty and visually hidden until that field has an error). Both are empty
// when inactive, so excluding empty alerts (along with the announcer, for
// the rare moment it isn't) leaves only a real, populated alert message.
export function pageAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__):not(:empty)');
}
