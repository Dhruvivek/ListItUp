import type { ItemPriority, ItemState, ListStatus, PrismaClient } from "@/generated/prisma/client";
import { getListRoles, type ListRoles } from "@/lib/list/list-roles";
import {
  meetsListAccessLevel,
  resolveListAccess,
  type ListAccessLevel,
} from "@/lib/permissions/list-access";

export type EligibleWorkspaceMember = { userId: string; name: string };

export type ItemSummary = {
  id: string;
  title: string;
  state: ItemState;
  priority: ItemPriority;
  dueDate: Date | null;
  hasParent: boolean;
  assignees: { userId: string; name: string }[];
};

export type SectionWithItems = {
  id: string;
  name: string;
  order: number;
  items: ItemSummary[];
};

export type ListPageData = {
  listId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ListStatus;
  archivedAt: Date | null;
  access: ListAccessLevel;
  // >=LEAD governs both editing Description and managing the Roles panel
  // (#27, #28) — one flag for both since they share the same threshold.
  canEditDescription: boolean;
  roles: ListRoles;
  // Workspace Members not yet holding any List-level role — the candidate
  // pool for the Roles panel's "add Member/Viewer" control (#28). Guest
  // grants aren't drawn from this list since a Guest need not be a
  // Workspace Member at all.
  eligibleMembers: EligibleWorkspaceMember[];
  // >=WRITE governs Section management, the "Add Rule" grouping control,
  // and Item creation (#29, #30) — a List Member manages these, unlike
  // Description/Roles which are Lead-only.
  canManageSections: boolean;
  sections: SectionWithItems[];
  // Items with no Section, grouped separately since the List view still
  // has to show them somewhere.
  unsectionedItems: ItemSummary[];
  groupBy: string;
};

// Kept separate from the page component (same rationale as the
// List-browsing page's page-data.ts): a real Next.js request scope isn't
// available under plain tsx, so headers()/session lookup stays in page.tsx
// while everything testable lives here on an injected PrismaClient.
export async function loadListPageData(
  database: PrismaClient,
  input: { userId: string; workspaceId: string; listId: string }
): Promise<ListPageData | null> {
  const { userId, workspaceId, listId } = input;

  const list = await database.list.findUnique({ where: { id: listId } });
  if (!list || list.workspaceId !== workspaceId) {
    return null;
  }

  const access = await resolveListAccess(database, { userId, listId });
  if (!meetsListAccessLevel(access, "READ")) {
    return null;
  }

  const [roles, workspaceMembers, sections, items] = await Promise.all([
    getListRoles(database, { listId }),
    database.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    database.section.findMany({ where: { listId }, orderBy: { order: "asc" } }),
    // Archived Items are browsable via their own filter/toggle inside the
    // List view (#38), not shown here by default.
    database.item.findMany({
      where: { listId, state: { not: "ARCHIVED" } },
      include: { assignees: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const existingListRoleUserIds = new Set(
    [...roles.leads, ...roles.members, ...roles.viewers].map((entry) => entry.userId)
  );
  const eligibleMembers = workspaceMembers
    .filter((member) => !existingListRoleUserIds.has(member.userId))
    .map((member) => ({ userId: member.userId, name: member.user.name }));

  const toItemSummary = (item: (typeof items)[number]): ItemSummary => ({
    id: item.id,
    title: item.title,
    state: item.state,
    priority: item.priority,
    dueDate: item.dueDate,
    hasParent: item.parentId !== null,
    assignees: item.assignees.map((assignee) => ({
      userId: assignee.userId,
      name: assignee.user.name,
    })),
  });

  const itemsBySectionId = new Map<string, ItemSummary[]>();
  const unsectionedItems: ItemSummary[] = [];
  for (const item of items) {
    if (!item.sectionId) {
      unsectionedItems.push(toItemSummary(item));
      continue;
    }
    const bucket = itemsBySectionId.get(item.sectionId) ?? [];
    bucket.push(toItemSummary(item));
    itemsBySectionId.set(item.sectionId, bucket);
  }

  return {
    listId: list.id,
    workspaceId: list.workspaceId,
    name: list.name,
    description: list.description,
    status: list.status,
    archivedAt: list.archivedAt,
    access,
    canEditDescription: meetsListAccessLevel(access, "LEAD"),
    roles,
    eligibleMembers,
    canManageSections: meetsListAccessLevel(access, "WRITE"),
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
      order: section.order,
      items: itemsBySectionId.get(section.id) ?? [],
    })),
    unsectionedItems,
    groupBy: list.groupBy,
  };
}
