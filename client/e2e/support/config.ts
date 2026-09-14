export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

// A second app instance, deliberately configured with an unreachable SMTP
// host so its mail sends fail for real — proving the "SMTP clearly failed"
// messaging over actual HTTP rather than mocking the mailer.
export const SMTP_FAILURE_BASE_URL =
  process.env.PLAYWRIGHT_SMTP_FAILURE_BASE_URL ?? "http://127.0.0.1:4175";
export const SMTP_FAILURE_PORT = 4175;
export const UNREACHABLE_SMTP_HOST = "127.0.0.1";
export const UNREACHABLE_SMTP_PORT = "39999";
