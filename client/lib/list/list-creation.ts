import { randomUUID } from "node:crypto";

import type { PrismaClient, WorkspaceRole } from "@/generated/prisma/client";

export type CreateListResult =
  | { status: "created"; listId: string }
  | { status: "creator-lacks-workspace-membership" }
  | { status: "creator-lacks-required-role" };

// Only Workspace Owner/Admin may create a List (ADR 0009). This naturally
// covers Personal Space too: a User's Personal Space membership is always
// OWNER (see provisionPersonalWorkspace), so this single role check needs no
// branch on Workspace.kind.
const ROLES_ALLOWED_TO_CREATE_LIST: readonly WorkspaceRole[] = ["OWNER", "ADMIN"];

// Lists are private by default (ADR 0009): the creator becomes the List's
// first Lead and no other Workspace Member gains access from this call.
//
// List creation happens before the List exists, so it can't be authorized
// through lib/permissions/'s List-access resolver (#22) — it checks the
// creator's Workspace role directly instead.
export async function createList(
  database: PrismaClient,
  input: { workspaceId: string; creatorUserId: string; name: string }
): Promise<CreateListResult> {
  const { workspaceId, creatorUserId, name } = input;

  return database.$transaction(async (tx) => {
    const creatorMembership = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: creatorUserId } },
    });

    if (!creatorMembership) {
      return { status: "creator-lacks-workspace-membership" };
    }

    if (!ROLES_ALLOWED_TO_CREATE_LIST.includes(creatorMembership.role)) {
      return { status: "creator-lacks-required-role" };
    }

    const list = await tx.list.create({
      data: {
        id: randomUUID(),
        workspaceId,
        name,
        members: {
          create: [{ id: randomUUID(), userId: creatorUserId, role: "LEAD" }],
        },
      },
    });

    return { status: "created", listId: list.id };
  });
}
