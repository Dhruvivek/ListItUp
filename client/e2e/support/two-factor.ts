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

  // innerText reflects rendered layout, including line breaks the
  // "break-all" class inserts for this long unbroken string — use
  // textContent (raw DOM text) so a visual wrap can't corrupt the secret.
  const encodedSecret = await section
    .getByTestId("totp-manual-secret")
    .textContent();
  const secret = new TextDecoder().decode(
    base32.decode((encodedSecret ?? "").trim())
  );
  const backupCodes = (
    await section.locator("ul li").allTextContents()
  ).map((code) => code.trim());

  const confirmButton = section.getByRole("button", {
    name: "Confirm and enable 2FA",
  });
  await expect(
    confirmButton,
    "the confirm button must stay disabled until recovery codes are acknowledged"
  ).toBeDisabled();

  await section.getByLabel("I've saved my recovery codes.").check();
  await expect(confirmButton).toBeEnabled();

  const codeField = section.getByLabel("Authenticator code");
  const enabledNotice = section.getByText(
    "Two-factor authentication is enabled on your account."
  );

  // A cold Next.js dev-mode compile of this Server Action can take long
  // enough, under CI load, for a precomputed 30s TOTP code to go stale
  // before the server verifies it (confirmation also awaits a
  // security-notice email send before returning). Recompute and retry
  // rather than race a compile we don't control.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await codeField.fill(await currentTotpCode(secret));
    await confirmButton.click();

    const confirmed = await enabledNotice
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (confirmed) {
      return { secret, backupCodes };
    }
  }

  throw new Error(
    `2FA enrollment confirmation did not succeed after ${MAX_ATTEMPTS} attempts`
  );
}
