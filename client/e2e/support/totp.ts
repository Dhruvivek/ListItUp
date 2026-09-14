import { createOTP } from "@better-auth/utils/otp";
import { base32 } from "@better-auth/utils/base32";

const TWO_FACTOR_TOTP_DIGITS = 6;
const TWO_FACTOR_TOTP_PERIOD_SECONDS = 30;

// The manual secret shown during enrollment is base32-encoded, matching the
// TOTP URI's "secret" param — decode it back to raw bytes before generating
// codes, the same way an authenticator app would.
export async function generateTotpCode(base32Secret: string): Promise<string> {
  const decodedSecret = new TextDecoder().decode(base32.decode(base32Secret));

  return createOTP(decodedSecret, {
    digits: TWO_FACTOR_TOTP_DIGITS,
    period: TWO_FACTOR_TOTP_PERIOD_SECONDS,
  }).totp();
}
