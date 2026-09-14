import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SEED_SCRIPT = path.join(__dirname, "workspace-invitation-seed-script.ts");
const CLIENT_ROOT = path.join(__dirname, "..", "..");

export interface SeededInvitation {
  token: string;
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
}

// There is no in-app UI to create a workspace invitation yet (see #10 —
// only acceptance has shipped), so browser journeys that start from an
// invitation link must seed one directly, the same way the workspace
// invitation integration tests do. The generated Prisma client is ESM-only
// and (even loaded via dynamic import()) trips a "require(esm) in a cycle"
// error under Playwright's CJS test loader, so seeding runs in a separate
// tsx-executed process instead, exactly like the *.integration.test.ts
// files already load Prisma successfully.
async function runSeedScript(command: string, payload: unknown): Promise<string> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for browser tests that seed data directly."
    );
  }

  const { stdout } = await execFileAsync(
    "pnpm",
    ["exec", "tsx", SEED_SCRIPT, command, JSON.stringify(payload)],
    { cwd: CLIENT_ROOT, env: process.env }
  );

  return stdout;
}

export async function seedWorkspaceInvitation(
  email: string,
  role: "MEMBER" | "VIEWER" = "MEMBER"
): Promise<SeededInvitation> {
  const stdout = await runSeedScript("seed-invitation", { email, role });

  return JSON.parse(stdout) as SeededInvitation;
}

export async function cleanupSeededInvitation(
  seed: SeededInvitation,
  invitedUserEmails: string[]
): Promise<void> {
  await runSeedScript("cleanup-invitation", {
    workspaceId: seed.workspaceId,
    ownerId: seed.ownerId,
    invitedUserEmails,
  });
}
