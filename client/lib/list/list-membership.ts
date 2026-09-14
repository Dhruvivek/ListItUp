import { randomUUID } from "node:crypto";

import type { ListMemberRole, PrismaClient } from "@/generated/prisma/client";
import { meetsListAccessLevel, resolveListAccess } from "@/lib/permissions/list-access";

export type AddListMemberResult =
  | { status: "added" }
  | { status: "list-not-found" }
  | { status: "forbidden" }
  | { status: "user-lacks-workspace-membership" };

export type RemoveListMemberResult =
  | { status: "removed" }
  | { status: "list-not-found" }
  | { status: "forbidden" };

// A List Lead or Workspace Admin/Owner can add/remove a List-level Member
// or Viewer (#28).
const REQUIRED_ACCESS_LEVEL = "LEAD";

// A ListMember row may only reference a User who already holds a
// Workspace-level membership in that List's Workspace (ADR 0009) — Guest is
// the only path to List access without one.
export async function addListMember(
  database: PrismaClient,
  input: { actorUserId: string; listId: string; userId: string; role: ListMemberRole }
): Promise<AddListMemberResult> {
  const { actorUserId, listId, userId, role } = input;

  const list = await database.list.findUnique({ where: { id: listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, { userId: actorUserId, listId });
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  const workspaceMembership = await database.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: list.workspaceId, userId } },
  });

  if (!workspaceMembership) {
    return { status: "user-lacks-workspace-membership" };
  }

  await database.listMember.upsert({
    where: { listId_userId: { listId, userId } },
    create: { id: randomUUID(), listId, userId, role },
    update: { role },
  });

  return { status: "added" };
}

export async function removeListMember(
  database: PrismaClient,
  input: { actorUserId: string; listId: string; userId: string }
): Promise<RemoveListMemberResult> {
  const { actorUserId, listId, userId } = input;

  const list = await database.list.findUnique({ where: { id: listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, { userId: actorUserId, listId });
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  await database.listMember.deleteMany({ where: { listId, userId } });
  return { status: "removed" };
}
