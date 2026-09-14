import { expect, test } from "@playwright/test";
import { createClient } from "redis";

import { SMTP_FAILURE_BASE_URL } from "./support/config";
import { mailpitMessageIds, mailpitMessagesFor, waitForMailpitLink } from "./support/mailpit";

async function clearSignInRestrictions(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("REDIS_URL must be set for browser tests.");

  const client = createClient({ url: redisUrl });
  await client.connect();
  const keys = await client.keys("auth:sign-in:*");
  if (keys.length) await client.del(keys);
  await client.close();
}

test("a second magic-link request within the recipient rate limit reports a retryable error and sends no second email", async ({
  page,
}) => {
  const email = `rate-limit-magic-link-${Date.now()}@example.test`;

  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Email magic link" }).click();
  await expect(page.getByRole("button", { name: "Send sign-in link" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("sign-in link is on its way");

  const knownMessageIds = mailpitMessageIds(await mailpitMessagesFor(email));
  await waitForMailpitLink(email);

  // The recipient limit is one magic-link send per minute: a second request
  // for the same address right away must be refused with a retryable error
  // rather than silently pretending to succeed again.
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(
    page.getByText("We couldn't send that email. Please try again.")
  ).toBeVisible();

  const messagesAfterSecondRequest = await mailpitMessagesFor(email);
  const newMessages = messagesAfterSecondRequest.filter((message) => {
    const id = message.ID ?? message.id;
    return id && !knownMessageIds.has(id);
  });
  expect(newMessages).toHaveLength(0);
});

test("a password-reset request truthfully reports failure when SMTP delivery clearly fails", async ({
  page,
}) => {
  const email = `smtp-failure-${Date.now()}@example.test`;

  // Sign up and verify against the normal, working app instance so a real
  // verified User exists to request a reset for.
  await page.goto("/sign-up");
  await page.getByLabel("Display Name").fill("SMTP Failure User");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("a-long-browser-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  await page.goto(await waitForMailpitLink(email));
  await expect(page).toHaveURL(/my-tasks/);

  // Request a password reset against the second app instance, which is
  // deliberately configured with an unreachable SMTP host so this send
  // fails for real, over actual HTTP, rather than through a mocked mailer.
  await page.goto(`${SMTP_FAILURE_BASE_URL}/forgot-password`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText("We couldn't send that email. Please try again.")
  ).toBeVisible();

  const resetEmails = (await mailpitMessagesFor(email)).filter(
    (message) => message.Subject === "Reset your password"
  );
  expect(resetEmails).toHaveLength(0);
});

const FAILURES_TO_TRIGGER_RESTRICTION = 5;

test("five failed password attempts impose a progressive restriction that blocks even the correct password", async ({
  page,
}) => {
  const email = `rate-limit-sign-in-${Date.now()}@example.test`;
  const password = "a-long-browser-password";

  await page.goto("/sign-up");
  await page.getByLabel("Display Name").fill("Rate Limit Sign In User");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  await page.goto(await waitForMailpitLink(email));
  await expect(page).toHaveURL(/my-tasks/);
  await page.context().clearCookies();

  async function attemptSignIn(attemptPassword: string) {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(attemptPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
  }

  try {
    // Five failed attempts impose a 15-minute restriction shared across
    // identity and IP, regardless of which credential is wrong next time.
    for (let attempt = 0; attempt < FAILURES_TO_TRIGGER_RESTRICTION; attempt += 1) {
      await attemptSignIn("a-wrong-password");
      await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    }

    // The restriction blocks sign-in even with the correct password.
    await attemptSignIn(password);
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).not.toHaveURL(/my-tasks/);
  } finally {
    // The IP dimension of this restriction is shared with every other
    // browser test running from this same host — clear it so this test
    // doesn't lock the rest of the suite out of signing in.
    await clearSignInRestrictions();
  }
});
