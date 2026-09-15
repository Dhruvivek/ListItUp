import type { Item, ItemPriority, ItemState, PrismaClient, WorkspaceKind } from "@/generated/prisma/client";

export type MyTaskAttachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploaderName: string;
  createdAt: Date;
};

export type MyTaskItem = {
  id: string;
  title: string;
  state: ItemState;
  priority: ItemPriority;
  dueDate: Date | null;
  hasParent: boolean;
  listId: string;
  listName: string;
  sourceWorkspaceId: string;
  sourceWorkspaceName: string;
  sourceWorkspaceKind: WorkspaceKind;
  // Board's grouping is view-only for WORKSPACE (#43) and Files aggregates
  // across every assigned Item (#22-equivalent for My Tasks) — both views
  // read straight off this same fetch rather than issuing their own query.
  attachments: MyTaskAttachment[];
};

// Shared by every My Tasks view (List row, Board card, Files entry) so the
// Personal Space label and an Item's link back to its source List read the
// same way everywhere rather than re-deriving them per view (#43).
export function myTaskWorkspaceLabel(source: {
  sourceWorkspaceKind: WorkspaceKind;
  sourceWorkspaceName: string;
}): string {
  return source.sourceWorkspaceKind === "PERSONAL" ? "Personal Space" : source.sourceWorkspaceName;
}

export function myTaskItemHref(source: { sourceWorkspaceId: string; listId: string }, itemId: string): string {
  return `/workspaces/${source.sourceWorkspaceId}/lists/${source.listId}/items/${itemId}`;
}

// Hidden from My Tasks unless explicitly requested via includeCompleted/
// includeArchived — every other state (including IN_PROGRESS) shows by
// default (#42).
const HIDDEN_BY_DEFAULT: readonly ItemState[] = ["COMPLETE", "ARCHIVED"];

export function isVisibleByDefault(state: ItemState): boolean {
  return !HIDDEN_BY_DEFAULT.includes(state);
}

export function isItemOverdue(item: { dueDate: Date | null }, now: Date): boolean {
  return item.dueDate !== null && item.dueDate.getTime() < now.getTime();
}

const PRIORITY_RANK: Record<ItemPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };

// Default sort (#42): overdue Items first, then by Priority (High first),
// then by nearest due date — undated Items rank after every dated Item
// within the same overdue/Priority bucket via the Infinity fallback.
export function sortMyTasks<T extends { priority: ItemPriority; dueDate: Date | null }>(
  items: T[],
  now: Date
): T[] {
  const overdueRank = (item: T): number => (isItemOverdue(item, now) ? 0 : 1);
  const dueDateRank = (item: T): number => item.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;

  return [...items].sort(
    (a, b) =>
      overdueRank(a) - overdueRank(b) ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      dueDateRank(a) - dueDateRank(b)
  );
}

function toMyTaskItem(
  item: Item & {
    list: { id: string; name: string; workspaceId: string; workspace: { id: string; name: string; kind: WorkspaceKind } };
    attachments: { id: string; fileName: string; sizeBytes: number; createdAt: Date; uploader: { name: string } }[];
  }
): MyTaskItem {
  return {
    id: item.id,
    title: item.title,
    state: item.state,
    priority: item.priority,
    dueDate: item.dueDate,
    hasParent: item.parentId !== null,
    listId: item.list.id,
    listName: item.list.name,
    sourceWorkspaceId: item.list.workspace.id,
    sourceWorkspaceName: item.list.workspace.name,
    sourceWorkspaceKind: item.list.workspace.kind,
    attachments: item.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      sizeBytes: attachment.sizeBytes,
      uploaderName: attachment.uploader.name,
      createdAt: attachment.createdAt,
    })),
  };
}

// Unifies Items assigned to a User across every Workspace they belong to
// plus their Personal Space (CONTEXT.md My Tasks) — reads the same Item
// rows shown elsewhere via ItemAssignee, never a separate copy (#42).
export async function loadMyTasksItems(
  database: PrismaClient,
  input: {
    userId: string;
    sourceWorkspaceId?: string;
    includeCompleted?: boolean;
    includeArchived?: boolean;
    now?: Date;
  }
): Promise<MyTaskItem[]> {
  const {
    userId,
    sourceWorkspaceId,
    includeCompleted = false,
    includeArchived = false,
    now = new Date(),
  } = input;

  const assignments = await database.itemAssignee.findMany({
    where: {
      userId,
      ...(sourceWorkspaceId ? { item: { list: { workspaceId: sourceWorkspaceId } } } : {}),
    },
    include: {
      item: {
        include: {
          list: { include: { workspace: true } },
          attachments: { include: { uploader: { select: { name: true } } } },
        },
      },
    },
  });

  const visibleItems = assignments
    .map((assignment) => assignment.item)
    .filter((item) => {
      if (item.state === "COMPLETE") return includeCompleted;
      if (item.state === "ARCHIVED") return includeArchived;
      return true;
    });

  return sortMyTasks(visibleItems.map(toMyTaskItem), now);
}
