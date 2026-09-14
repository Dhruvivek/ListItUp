import { expect, test } from "@playwright/test";

import { signUpAndVerify, uniqueTestUser } from "./support/auth-flows";
import { pageAlert } from "./support/locators";
import { waitForMailpitLink } from "./support/mailpit";
import { currentTotpCode, enrollTwoFactorViaUI } from "./support/two-factor";

test("a User must acknowledge saved recovery codes before 2FA enrollment confirms", async ({
  page,
}) => {
  // This flow makes several full round trips (sign-up, verify, enable,
  // confirm) — under CI load that's occasionally slower than the default
  // 30-60s test budget affords.
  test.setTimeout(90_000);

  const user = uniqueTestUser("two-factor-enroll");
  await signUpAndVerify(page, user);

  const { backupCodes } = await enrollTwoFactorViaUI(page, user.password);
  expect(backupCodes).toHaveLength(10);
});

test("a 2FA-enabled User is challenged at sign-in, and password reset still requires the challenge afterward", async ({
  page,
  context,
}) => {
  // This is the heaviest journey in the suite: two full round trips
  // (enrollment, then a fresh sign-in/reset/challenge cycle), so give it
  // more room than the default budget under CI load.
  test.setTimeout(150_000);

  const user = uniqueTestUser("two-factor-challenge");
  await signUpAndVerify(page, user);
  const { secret, backupCodes } = await enrollTwoFactorViaUI(
    page,
    user.password
  );

  // Password sign-in for a 2FA-enabled User must challenge, not grant a session.
  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/two-factor/);
  await expect(
    page.getByRole("heading", { name: "Enter your two-factor code" })
  ).toBeVisible();

  await page.getByLabel("Authenticator code").fill("000000");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(pageAlert(page)).toContainText(
    "That code didn't work. Try again."
  );

  await page
    .getByLabel("Authenticator code")
    .fill(await currentTotpCode(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/my-tasks/);

  // Resetting the password must not skip the 2FA challenge on the next sign-in.
  await context.clearCookies();
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "reset link is on its way"
  );

  const newPassword = "a-brand-new-long-password";
  await page.goto(await waitForMailpitLink(user.email));
  await page.getByRole("textbox", { name: "New password" }).fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/sign-in/);

  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/two-factor/);

  await page
    .getByRole("button", { name: "Use a recovery code instead" })
    .click();
  await expect(page.getByLabel("Recovery code")).toBeVisible();
  await page.getByLabel("Recovery code").fill(backupCodes[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/my-tasks/);
});
