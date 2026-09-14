import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";

export type CreateListResult =
  | { status: "created"; listId: string }
  | { status: "creator-lacks-workspace-membership" };

// Lists are private by default (ADR 0009): the creator becomes the List's
// first Lead and no other Workspace Member gains access from this call.
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
