import type { PrismaClient } from "@/generated/prisma/client";
import { loadMyTasksItems, type MyTaskItem } from "@/lib/item/item-my-tasks";

export type MyTasksFilterWorkspace = { id: string; name: string; isPersonal: boolean };

export type MyTasksPageData = {
  items: MyTaskItem[];
  filterWorkspaces: MyTasksFilterWorkspace[];
  selectedWorkspaceId: string | null;
  includeCompleted: boolean;
  includeArchived: boolean;
};

// Kept separate from the page component (same rationale as the List page's
// page-data.ts): a real Next.js request scope isn't available under plain
// tsx, so session lookup stays in page.tsx while everything testable lives
// here on an injected PrismaClient.
export async function loadMyTasksPageData(
  database: PrismaClient,
  input: {
    userId: string;
    sourceWorkspaceId?: string;
    includeCompleted?: boolean;
    includeArchived?: boolean;
    now?: Date;
  }
): Promise<MyTasksPageData> {
  const { userId, sourceWorkspaceId, includeCompleted = false, includeArchived = false, now } = input;

  const [items, memberships] = await Promise.all([
    loadMyTasksItems(database, { userId, sourceWorkspaceId, includeCompleted, includeArchived, now }),
    database.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    items,
    filterWorkspaces: memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      isPersonal: membership.workspace.kind === "PERSONAL",
    })),
    selectedWorkspaceId: sourceWorkspaceId ?? null,
    includeCompleted,
    includeArchived,
  };
}
