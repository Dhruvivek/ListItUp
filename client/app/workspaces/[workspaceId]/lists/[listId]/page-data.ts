import type { ListStatus, PrismaClient } from "@/generated/prisma/client";
import { getListRoles, type ListRoles } from "@/lib/list/list-roles";
import {
  meetsListAccessLevel,
  resolveListAccess,
  type ListAccessLevel,
} from "@/lib/permissions/list-access";

export type EligibleWorkspaceMember = { userId: string; name: string };

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

  const [roles, workspaceMembers] = await Promise.all([
    getListRoles(database, { listId }),
    database.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const existingListRoleUserIds = new Set(
    [...roles.leads, ...roles.members, ...roles.viewers].map((entry) => entry.userId)
  );
  const eligibleMembers = workspaceMembers
    .filter((member) => !existingListRoleUserIds.has(member.userId))
    .map((member) => ({ userId: member.userId, name: member.user.name }));

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
  };
}
