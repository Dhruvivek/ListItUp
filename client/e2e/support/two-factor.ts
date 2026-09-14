import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, type Page } from "@playwright/test";

import { pageAlert } from "./locators";

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
  const errorAlert = pageAlert(page);

  // A cold Next.js dev-mode compile of this Server Action, plus its
  // synchronous security-notice email send, can be slow under CI load — so
  // wait generously for a definitive outcome (confirmed or a rendered
  // error) rather than a bare timeout. Only retry with a fresh code once an
  // error has actually rendered: that's the one signal that the previous
  // submission has fully settled, so a retry can never double-submit while
  // the prior request might still be in flight server-side.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await codeField.fill(await currentTotpCode(secret));
    await confirmButton.click();

    const outcome = await Promise.race([
      enabledNotice
        .waitFor({ state: "visible", timeout: 45_000 })
        .then(() => "confirmed" as const),
      errorAlert
        .waitFor({ state: "visible", timeout: 45_000 })
        .then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    if (outcome === "confirmed") {
      return { secret, backupCodes };
    }

    if (outcome === "timeout") {
      throw new Error(
        "2FA enrollment confirmation neither succeeded nor showed an error within 45s"
      );
    }
  }

  throw new Error(
    `2FA enrollment confirmation kept failing after ${MAX_ATTEMPTS} attempts`
  );
}
