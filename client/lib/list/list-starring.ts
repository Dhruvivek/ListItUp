import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";
import { meetsListAccessLevel, resolveListAccess } from "@/lib/permissions/list-access";

export type ToggleStarredResult =
  | { status: "starred" }
  | { status: "unstarred" }
  | { status: "list-not-found" }
  | { status: "forbidden" };

// Starred is a per-User flag (#26): any User who can see the List may star
// it, independent of anyone else's view.
export async function toggleStarred(
  database: PrismaClient,
  input: { userId: string; listId: string }
): Promise<ToggleStarredResult> {
  const { userId, listId } = input;

  const list = await database.list.findUnique({ where: { id: listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, { userId, listId });
  if (!meetsListAccessLevel(access, "READ")) {
    return { status: "forbidden" };
  }

  const existing = await database.starred.findUnique({
    where: { userId_listId: { userId, listId } },
  });

  if (existing) {
    await database.starred.delete({ where: { id: existing.id } });
    return { status: "unstarred" };
  }

  await database.starred.create({ data: { id: randomUUID(), userId, listId } });
  return { status: "starred" };
}
