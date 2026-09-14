import { expect, type Page } from "@playwright/test";

import { waitForMailpitLink } from "./mailpit";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

const DEFAULT_PASSWORD = "a-long-browser-password";

export function uniqueTestUser(
  prefix: string,
  password = DEFAULT_PASSWORD
): TestUser {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `${prefix} user`,
    email: `${prefix}-${unique}@example.test`,
    password,
  };
}

export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Display Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function verifyViaMailpit(
  page: Page,
  email: string
): Promise<void> {
  await page.goto(await waitForMailpitLink(email));
}

export async function signUpAndVerify(
  page: Page,
  user: TestUser
): Promise<void> {
  await signUp(page, user);
  await expect(page).toHaveURL(/verify-email/);
  await verifyViaMailpit(page, user.email);
}

export async function signInWithPassword(
  page: Page,
  user: Pick<TestUser, "email" | "password">
): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
