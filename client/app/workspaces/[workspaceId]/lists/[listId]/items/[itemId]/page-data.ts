import type { CustomFieldType, ItemPriority, ItemState, PrismaClient } from "@/generated/prisma/client";
import { resolveItemAccess } from "@/lib/permissions/item-access";
import { meetsListAccessLevel } from "@/lib/permissions/list-access";

export type CustomFieldDefinitionSummary = {
  id: string;
  name: string;
  type: CustomFieldType;
  options: string[];
};

export type ItemDetailData = {
  itemId: string;
  listId: string;
  workspaceId: string;
  listName: string;
  title: string;
  state: ItemState;
  priority: ItemPriority;
  dueDate: Date | null;
  blockerReason: string | null;
  sectionId: string | null;
  creatorName: string;
  assignees: { userId: string; name: string }[];
  parent: { id: string; title: string } | null;
  children: { id: string; title: string; state: ItemState }[];
  // >=WRITE: a List Member, Lead, or Workspace Admin/Owner can edit; a
  // List Viewer or Guest gets a read-only surface (#30).
  canEdit: boolean;
  sections: { id: string; name: string }[];
  // List Leads/Members only — a Viewer/Guest can see an Item but isn't a
  // sensible assignee candidate (a UI-level judgment call, not enforced by
  // lib/item/ itself, which doesn't restrict who can be assigned).
  assignableMembers: { userId: string; name: string }[];
  // Labels currently applied, and the Workspace's remaining Labels not yet
  // applied (the "apply existing" candidate pool). Applying is gated the
  // same as canEdit (any List Member); creating a brand-new Label is
  // gated separately by canCreateLabel (Workspace Owner/Admin) (#34).
  labels: { id: string; name: string }[];
  availableLabels: { id: string; name: string }[];
  canCreateLabel: boolean;
  // Custom Field definitions on this Item's List, and this Item's current
  // values keyed by definitionId. Defining a field is Lead/Admin-only
  // (canDefineCustomFields, same threshold as canEdit); setting a value on
  // an existing definition is available to any List Member (canEdit).
  customFieldDefinitions: CustomFieldDefinitionSummary[];
  customFieldValues: Record<string, string>;
  canDefineCustomFields: boolean;
};

// Kept separate from the page component (same rationale as the List page's
// page-data.ts): headers()/session lookup stays in page.tsx so this stays
// testable under plain tsx on an injected PrismaClient.
export async function loadItemDetailData(
  database: PrismaClient,
  input: { userId: string; workspaceId: string; listId: string; itemId: string }
): Promise<ItemDetailData | null> {
  const { userId, workspaceId, listId, itemId } = input;

  const item = await database.item.findUnique({
    where: { id: itemId },
    include: {
      list: true,
      creator: { select: { name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
      parent: { select: { id: true, title: true } },
      children: { select: { id: true, title: true, state: true }, orderBy: { createdAt: "asc" } },
      labels: { include: { label: { select: { id: true, name: true } } } },
      customFieldValues: true,
    },
  });

  if (!item || item.listId !== listId || item.list.workspaceId !== workspaceId) {
    return null;
  }

  const access = await resolveItemAccess(database, { userId, itemId });
  if (!meetsListAccessLevel(access, "READ")) {
    return null;
  }

  const [sections, listMembers, workspaceMembership, workspaceLabels, customFieldDefinitions] = await Promise.all([
    database.section.findMany({ where: { listId }, orderBy: { order: "asc" }, select: { id: true, name: true } }),
    database.listMember.findMany({
      where: { listId, role: { in: ["LEAD", "MEMBER"] } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    database.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    }),
    database.label.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    database.customFieldDefinition.findMany({ where: { listId }, orderBy: { name: "asc" } }),
  ]);

  const appliedLabelIds = new Set(item.labels.map((itemLabel) => itemLabel.labelId));

  return {
    itemId: item.id,
    listId,
    workspaceId,
    listName: item.list.name,
    title: item.title,
    state: item.state,
    priority: item.priority,
    dueDate: item.dueDate,
    blockerReason: item.blockerReason,
    sectionId: item.sectionId,
    creatorName: item.creator.name,
    assignees: item.assignees.map((assignee) => ({ userId: assignee.userId, name: assignee.user.name })),
    parent: item.parent,
    children: item.children,
    canEdit: meetsListAccessLevel(access, "WRITE"),
    sections,
    assignableMembers: listMembers.map((member) => ({ userId: member.userId, name: member.user.name })),
    labels: item.labels.map((itemLabel) => ({ id: itemLabel.label.id, name: itemLabel.label.name })),
    availableLabels: workspaceLabels
      .filter((label) => !appliedLabelIds.has(label.id))
      .map((label) => ({ id: label.id, name: label.name })),
    canCreateLabel: workspaceMembership?.role === "OWNER" || workspaceMembership?.role === "ADMIN",
    customFieldDefinitions,
    customFieldValues: Object.fromEntries(item.customFieldValues.map((v) => [v.definitionId, v.value])),
    canDefineCustomFields: meetsListAccessLevel(access, "LEAD"),
  };
}
