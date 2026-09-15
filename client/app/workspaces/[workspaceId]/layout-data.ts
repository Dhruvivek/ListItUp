import type { PrismaClient } from "@/generated/prisma/client";

export type WorkspaceNavEntry = { id: string; name: string };

export type WorkspaceNavData = {
  switchableWorkspaces: WorkspaceNavEntry[];
  personalSpace: WorkspaceNavEntry | null;
};

// Kept separate from layout.tsx itself, and taking an injected PrismaClient
// rather than importing the app's shared singleton, so the switcher/Personal
// Space query logic can be exercised directly in a smoke test without a real
// Next.js request scope and without lib/prisma.ts's server-only guard, which
// throws under plain tsx execution (see Architecture.md).
export async function loadWorkspaceNavData(
  database: PrismaClient,
  userId: string
): Promise<WorkspaceNavData> {
  const [switchableMemberships, personalMembership] = await Promise.all([
    database.workspaceMember.findMany({
      where: { userId, workspace: { kind: "SHARED" } },
      include: { workspace: { select: { id: true, name: true } } },
      orderBy: { workspace: { name: "asc" } },
    }),
    database.workspaceMember.findFirst({
      where: { userId, workspace: { kind: "PERSONAL" } },
      include: { workspace: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    switchableWorkspaces: switchableMemberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
    })),
    personalSpace: personalMembership
      ? { id: personalMembership.workspace.id, name: personalMembership.workspace.name }
      : null,
  };
}
