import { execFileSync } from "node:child_process";
import path from "node:path";

import type { InvitableWorkspaceRole } from "@/lib/workspace/workspace-invitations";

const RUNNER_PATH = path.join(__dirname, "db-fixture-runner.ts");

function runFixture<T>(action: string, payload: unknown): T {
  const output = execFileSync(
    "pnpm",
    ["exec", "tsx", RUNNER_PATH, action, JSON.stringify(payload)],
    { encoding: "utf-8", env: process.env }
  );

  return JSON.parse(output) as T;
}

export function seedInvitation(input: {
  invitedEmail: string;
  workspaceName: string;
  role: InvitableWorkspaceRole;
}): { workspaceId: string; ownerId: string; token: string } {
  return runFixture("seed-invitation", input);
}

export function readMembershipRole(input: {
  workspaceId: string;
  email: string;
}): { role: string | null } {
  return runFixture("read-membership", input);
}

export function cleanupInvitation(input: {
  workspaceId: string;
  ownerId: string;
  emails: string[];
}): { ok: true } {
  return runFixture("cleanup-invitation", input);
}
