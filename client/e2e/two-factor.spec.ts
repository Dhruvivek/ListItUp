import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForMailpitLink } from "./support/mailpit";
import { generateTotpCode } from "./support/totp";

const PASSWORD = "a-long-browser-password";

function twoFactorSection(page: Page): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { name: "Two-factor authentication" }),
  });
}

async function signUpAndVerify(
  page: Page,
  email: string,
  displayName: string
): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Display Name").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);

  await page.goto(await waitForMailpitLink(email));
  await expect(page).toHaveURL(/my-tasks/);
}

async function beginTwoFactorEnrollment(
  page: Page
): Promise<{ section: Locator; secret: string; backupCodes: string[] }> {
  await page.goto("/settings/security");
  const section = twoFactorSection(page);

  await section.getByLabel("Password").fill(PASSWORD);
  await section.getByRole("button", { name: "Enable 2FA" }).click();
  await expect(section.getByText("Scan this QR code")).toBeVisible();

  const secret = await section.locator("p.break-all.font-mono").innerText();
  const backupCodes = await section
    .locator("ul.grid.grid-cols-2 li")
    .allTextContents();

  return { section, secret, backupCodes };
}

async function signInWithPassword(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("a User rejects then accepts the recovery-code acknowledgement while enabling 2FA, then signs in with a TOTP code and a recovery code", async ({
  page,
  context,
}) => {
  const email = `two-factor-${Date.now()}@example.test`;
  await signUpAndVerify(page, email, "Two Factor User");

  const { section, secret, backupCodes } = await beginTwoFactorEnrollment(page);
  expect(backupCodes).toHaveLength(10);

  // Reject: the submit button is disabled client-side until the checkbox is
  // checked, so force the submission through to prove the server enforces
  // the acknowledgement independently of that client-side gate.
  await section.getByLabel("Authenticator code").fill(await generateTotpCode(secret));
  const confirmButton = section.getByRole("button", {
    name: "Confirm and enable 2FA",
  });
  await expect(confirmButton).toBeDisabled();
  await confirmButton.evaluate((button: HTMLButtonElement) =>
    button.removeAttribute("disabled")
  );
  await confirmButton.click();
  await expect(section.getByRole("alert")).toContainText(
    "Confirm that you saved your recovery codes."
  );

  // Accept: check the acknowledgement and submit a fresh code.
  await section.getByLabel("I've saved my recovery codes.").check();
  await section.getByLabel("Authenticator code").fill(await generateTotpCode(secret));
  await section.getByRole("button", { name: "Confirm and enable 2FA" }).click();
  await expect(
    section.getByText("Two-factor authentication is enabled on your account.")
  ).toBeVisible();

  // Password sign-in now progresses to the two-factor challenge.
  await context.clearCookies();
  await signInWithPassword(page, email, PASSWORD);
  await expect(page).toHaveURL(/two-factor/);
  await page.getByLabel("Authenticator code").fill(await generateTotpCode(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/my-tasks/);

  // A recovery code satisfies the same challenge.
  await context.clearCookies();
  await signInWithPassword(page, email, PASSWORD);
  await expect(page).toHaveURL(/two-factor/);
  await page.getByRole("button", { name: "Use a recovery code instead" }).click();
  await page.getByLabel("Recovery code").fill(backupCodes[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/my-tasks/);
});

test("password reset for a 2FA-enabled User still requires the two-factor challenge to sign in", async ({
  page,
  context,
}) => {
  const email = `two-factor-reset-${Date.now()}@example.test`;
  await signUpAndVerify(page, email, "Two Factor Reset User");

  const { section, secret } = await beginTwoFactorEnrollment(page);
  await section.getByLabel("I've saved my recovery codes.").check();
  await section.getByLabel("Authenticator code").fill(await generateTotpCode(secret));
  await section.getByRole("button", { name: "Confirm and enable 2FA" }).click();
  await expect(
    section.getByText("Two-factor authentication is enabled on your account.")
  ).toBeVisible();

  await context.clearCookies();
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("reset link is on its way");

  await page.goto(await waitForMailpitLink(email));
  await expect(page).toHaveURL(/reset-password/);
  const newPassword = "a-new-long-browser-password";
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/sign-in/);

  await signInWithPassword(page, email, newPassword);
  await expect(page).toHaveURL(/two-factor/);
  await page.getByLabel("Authenticator code").fill(await generateTotpCode(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/my-tasks/);
});
