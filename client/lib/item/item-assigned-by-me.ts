import type { Item, ItemPriority, ItemState, PrismaClient } from "@/generated/prisma/client";

export type AssignedByMeItem = {
  id: string;
  title: string;
  state: ItemState;
  priority: ItemPriority;
  dueDate: Date | null;
  listId: string;
  listName: string;
  assigneeCount: number;
};

function toAssignedByMeItem(
  item: Item & { list: { id: string; name: string }; assignees: { id: string }[] }
): AssignedByMeItem {
  return {
    id: item.id,
    title: item.title,
    state: item.state,
    priority: item.priority,
    dueDate: item.dueDate,
    listId: item.list.id,
    listName: item.list.name,
    assigneeCount: item.assignees.length,
  };
}

// "Items I've Assigned" (#46, Home) approximates delegated work as
// Creator == current User AND the Assignee list includes someone other
// than the current User — there is no dedicated "assigned by" field, so
// this misses delegation on Items the current User didn't create
// themself. A known, revisitable approximation, not a durable contract
// (docs/QnA/listitup-profile-and-home-surface.md §13).
export async function loadAssignedByMeItems(
  database: PrismaClient,
  input: { userId: string; workspaceId: string; limit?: number }
): Promise<AssignedByMeItem[]> {
  const { userId, workspaceId, limit } = input;

  const items = await database.item.findMany({
    where: {
      creatorId: userId,
      list: { workspaceId },
      assignees: { some: { userId: { not: userId } } },
    },
    include: {
      list: { select: { id: true, name: true } },
      assignees: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return items.map(toAssignedByMeItem);
}
