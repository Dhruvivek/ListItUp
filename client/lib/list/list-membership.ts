import { randomUUID } from "node:crypto";

import type { ListMemberRole, PrismaClient } from "@/generated/prisma/client";

export type AddListMemberResult =
  | { status: "added" }
  | { status: "list-not-found" }
  | { status: "user-lacks-workspace-membership" };

// A ListMember row may only reference a User who already holds a
// Workspace-level membership in that List's Workspace (ADR 0009) — Guest is
// the only path to List access without one.
export async function addListMember(
  database: PrismaClient,
  input: { listId: string; userId: string; role: ListMemberRole }
): Promise<AddListMemberResult> {
  const { listId, userId, role } = input;

  return database.$transaction(async (tx) => {
    const list = await tx.list.findUnique({ where: { id: listId } });

    if (!list) {
      return { status: "list-not-found" };
    }

    const workspaceMembership = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.workspaceId, userId } },
    });

    if (!workspaceMembership) {
      return { status: "user-lacks-workspace-membership" };
    }

    await tx.listMember.upsert({
      where: { listId_userId: { listId, userId } },
      create: { id: randomUUID(), listId, userId, role },
      update: { role },
    });

    return { status: "added" };
  });
}
