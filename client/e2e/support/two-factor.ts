import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, type Page } from "@playwright/test";

export interface EnrolledTwoFactor {
  secret: string;
  backupCodes: string[];
}

export async function currentTotpCode(secret: string): Promise<string> {
  return createOTP(secret, { digits: 6, period: 30 }).totp();
}

// Drives the real /settings/security enrollment UI, asserting the recovery-
// codes acknowledgement gate along the way, and returns the decoded secret
// and backup codes so the caller can complete later 2FA challenges.
export async function enrollTwoFactorViaUI(
  page: Page,
  password: string
): Promise<EnrolledTwoFactor> {
  await page.goto("/settings/security");

  const section = page.locator("#two-factor-section");
  await section.getByLabel("Password").fill(password);
  await section.getByRole("button", { name: "Enable 2FA" }).click();

  const encodedSecret = await section
    .getByTestId("totp-manual-secret")
    .innerText();
  const secret = new TextDecoder().decode(base32.decode(encodedSecret));
  const backupCodes = await section.locator("ul li").allInnerTexts();

  const confirmButton = section.getByRole("button", {
    name: "Confirm and enable 2FA",
  });
  await expect(
    confirmButton,
    "the confirm button must stay disabled until recovery codes are acknowledged"
  ).toBeDisabled();

  await section.getByLabel("I've saved my recovery codes.").check();
  await expect(confirmButton).toBeEnabled();

  await section
    .getByLabel("Authenticator code")
    .fill(await currentTotpCode(secret));
  await confirmButton.click();

  // Confirmation awaits a security-notice email send before returning, so
  // give it more room than the default 5s under CI load.
  await expect(
    section.getByText("Two-factor authentication is enabled on your account.")
  ).toBeVisible({ timeout: 15_000 });

  return { secret, backupCodes };
}
