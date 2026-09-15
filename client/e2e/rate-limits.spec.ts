import { expect, test } from "@playwright/test";

import { signUpAndVerify, uniqueTestUser } from "./support/auth-flows";
import { pageAlert } from "./support/locators";

const WRONG_PASSWORD = "definitely-the-wrong-password";
const FAILURES_TO_TRIGGER_RESTRICTION = 5;

test("repeated password failures temporarily restrict sign-in, even with the correct password", async ({
  page,
}) => {
  const user = uniqueTestUser("rate-limit-password");
  await signUpAndVerify(page, user);

  await page.context().clearCookies();
  await page.goto("/sign-in");

  for (let attempt = 0; attempt < FAILURES_TO_TRIGGER_RESTRICTION; attempt += 1) {
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("textbox", { name: "Password" }).fill(WRONG_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(pageAlert(page)).toContainText("Incorrect email or password.");
  }

  // The 6th attempt uses the correct password, but the identity is now
  // temporarily restricted — the User must still see the generic failure,
  // not a successful sign-in.
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(pageAlert(page)).toContainText("Incorrect email or password.");
  await expect(page).toHaveURL(/sign-in/);
});

test("requesting a second magic link for the same address too soon is rejected as retryable", async ({
  page,
}) => {
  const email = uniqueTestUser("rate-limit-magic-link").email;

  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Email magic link" }).click();
  await expect(
    page.getByRole("button", { name: "Send sign-in link" })
  ).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "sign-in link is on its way"
  );

  // The per-recipient magic-link limit allows one request per minute, so an
  // immediate second request for the same address must be turned away.
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(pageAlert(page)).toContainText(
    "We couldn't send that email. Please try again."
  );
});
