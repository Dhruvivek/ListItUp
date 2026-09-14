import { expect, test } from "@playwright/test";

import { cleanupInvitation, readMembershipRole, seedInvitation } from "./support/db-fixtures";
import { waitForMailpitLink } from "./support/mailpit";

test("invitation-led sign-up creates the invited membership and lands the User in the Workspace", async ({
  page,
}) => {
  const invitedEmail = `invitee-${Date.now()}@example.test`;
  const { workspaceId, ownerId, token } = seedInvitation({
    invitedEmail,
    workspaceName: "Launch Team",
    role: "VIEWER",
  });

  try {
    await page.goto(`/accept-invitation?token=${token}`);
    await expect(page.getByRole("heading", { name: "Join Launch Team" })).toBeVisible();

    await page.getByRole("link", { name: "Sign up to accept" }).click();
    await expect(page).toHaveURL(/sign-up/);
    const emailField = page.getByLabel("Email");
    await expect(emailField).toHaveValue(invitedEmail);
    await expect(emailField).toHaveAttribute("readonly", "");

    await page.getByLabel("Display Name").fill("Invited User");
    await page.getByRole("textbox", { name: "Password" }).fill("a-long-browser-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/verify-email/);

    await page.goto(await waitForMailpitLink(invitedEmail));
    await expect(page).toHaveURL(/accept-invitation/);
    await expect(page.getByRole("heading", { name: "Join Launch Team" })).toBeVisible();

    await page.getByRole("button", { name: "Accept invitation" }).click();
    await expect(page).toHaveURL(new RegExp(`/workspaces/${workspaceId}`));
    await expect(page.getByRole("heading", { name: "Launch Team" })).toBeVisible();

    const { role } = readMembershipRole({ workspaceId, email: invitedEmail });
    expect(role).toBe("VIEWER");
  } finally {
    cleanupInvitation({ workspaceId, ownerId, emails: [invitedEmail] });
  }
});
