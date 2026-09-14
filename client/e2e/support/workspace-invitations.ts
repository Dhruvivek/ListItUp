import { randomUUID } from "node:crypto";

import type { PrismaClient as GeneratedPrismaClient } from "../../generated/prisma/client";

const INVITATION_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

export type TestPrismaClient = GeneratedPrismaClient;

// There is no in-app UI to create a workspace invitation yet (see #10 —
// only acceptance has shipped), so browser journeys that start from an
// invitation link must seed one directly, the same way the workspace
// invitation integration tests do. The generated Prisma client is ESM-only
// (it uses import.meta), which breaks under Playwright's CJS test loader
// on a static import — load it dynamically instead, matching how the
// *.integration.test.ts files already do this.
export async function createTestPrismaClient(): Promise<TestPrismaClient> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set for browser tests that seed data directly."
    );
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("../../generated/prisma/client"),
  ]);

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

export interface SeededInvitation {
  token: string;
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
}

export async function seedWorkspaceInvitation(
  prisma: TestPrismaClient,
  email: string,
  role: "MEMBER" | "VIEWER" = "MEMBER"
): Promise<SeededInvitation> {
  const workspaceId = randomUUID();
  const ownerId = randomUUID();
  const workspaceName = `Browser Test Workspace ${randomUUID()}`;
  const token = randomUUID();

  await prisma.user.create({
    data: {
      id: ownerId,
      name: "Workspace owner",
      email: `owner-${randomUUID()}@example.test`,
    },
  });
  await prisma.workspace.create({
    data: { id: workspaceId, name: workspaceName },
  });
  await prisma.workspaceMember.create({
    data: { id: randomUUID(), workspaceId, userId: ownerId, role: "OWNER" },
  });
  await prisma.workspaceInvitation.create({
    data: {
      id: randomUUID(),
      workspaceId,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + INVITATION_EXPIRES_IN_MS),
    },
  });

  return { token, workspaceId, workspaceName, ownerId };
}

export async function cleanupSeededInvitation(
  prisma: TestPrismaClient,
  seed: SeededInvitation,
  invitedUserEmails: string[]
): Promise<void> {
  await prisma.workspaceMember.deleteMany({
    where: { workspaceId: seed.workspaceId },
  });
  await prisma.workspaceInvitation.deleteMany({
    where: { workspaceId: seed.workspaceId },
  });
  await prisma.workspace.deleteMany({ where: { id: seed.workspaceId } });
  await prisma.user.deleteMany({ where: { email: { in: invitedUserEmails } } });
  await prisma.user
    .delete({ where: { id: seed.ownerId } })
    .catch(() => undefined);
}
