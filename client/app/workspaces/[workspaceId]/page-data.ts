import type { PrismaClient } from "@/generated/prisma/client";
import { type AssignedByMeItem, loadAssignedByMeItems } from "@/lib/item/item-assigned-by-me";
import { loadMyTasksItems, type MyTaskItem } from "@/lib/item/item-my-tasks";
import { browseLists, type ListSummary } from "@/lib/list/list-browsing";

const WIDGET_PREVIEW_LIMIT = 5;

export type HomePageData = {
  workspaceName: string;
  myTasksPreview: MyTaskItem[];
  recentLists: ListSummary[];
  assignedByMe: AssignedByMeItem[];
};

// Kept separate from the page component (same rationale as My Tasks' and
// the List page's page-data.ts): session lookup stays in page.tsx, while
// everything testable lives here on an injected PrismaClient.
export async function loadHomePageData(
  database: PrismaClient,
  input: { userId: string; workspaceId: string; now?: Date }
): Promise<HomePageData | null> {
  const { userId, workspaceId, now } = input;

  const membership = await database.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });

  if (!membership) {
    return null;
  }

  // Recent Lists orders by the List's own updatedAt (browseLists' existing
  // sort), not per-user visit recency — the domain model has no List-visit
  // tracking to draw on (docs/QnA/listitup-profile-and-home-surface.md §6).
  const [myTasksItems, recentLists, assignedByMe] = await Promise.all([
    loadMyTasksItems(database, { userId, sourceWorkspaceId: workspaceId, now }),
    browseLists(database, { userId, workspaceId }),
    loadAssignedByMeItems(database, { userId, workspaceId, limit: WIDGET_PREVIEW_LIMIT }),
  ]);

  return {
    workspaceName: membership.workspace.name,
    myTasksPreview: myTasksItems.slice(0, WIDGET_PREVIEW_LIMIT),
    recentLists: recentLists.slice(0, WIDGET_PREVIEW_LIMIT),
    assignedByMe,
  };
}
