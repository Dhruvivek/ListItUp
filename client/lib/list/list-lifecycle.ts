import type { ListStatus, PrismaClient } from "@/generated/prisma/client";
import { meetsListAccessLevel, resolveListAccess } from "@/lib/permissions/list-access";

const LIST_STATUSES: readonly ListStatus[] = ["ON_TRACK", "ON_HOLD", "COMPLETED", "DROPPED"];

export function isValidListStatus(value: string): value is ListStatus {
  return (LIST_STATUSES as readonly string[]).includes(value);
}

export type ArchiveListResult =
  | { status: "archived" }
  | { status: "list-not-found" }
  | { status: "forbidden" };

export type RestoreListResult =
  | { status: "restored" }
  | { status: "list-not-found" }
  | { status: "forbidden" };

export type SetListStatusResult =
  | { status: "updated" }
  | { status: "list-not-found" }
  | { status: "forbidden" }
  | { status: "invalid-status" };

// A List Lead or Workspace Admin/Owner can Archive/Restore/set Status (#26).
const REQUIRED_ACCESS_LEVEL = "LEAD";

export async function archiveList(
  database: PrismaClient,
  input: { userId: string; listId: string }
): Promise<ArchiveListResult> {
  const list = await database.list.findUnique({ where: { id: input.listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, input);
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  await database.list.update({ where: { id: input.listId }, data: { archivedAt: new Date() } });
  return { status: "archived" };
}

export async function restoreList(
  database: PrismaClient,
  input: { userId: string; listId: string }
): Promise<RestoreListResult> {
  const list = await database.list.findUnique({ where: { id: input.listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, input);
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  await database.list.update({ where: { id: input.listId }, data: { archivedAt: null } });
  return { status: "restored" };
}

export async function setListStatus(
  database: PrismaClient,
  input: { userId: string; listId: string; status: string }
): Promise<SetListStatusResult> {
  if (!isValidListStatus(input.status)) {
    return { status: "invalid-status" };
  }

  const list = await database.list.findUnique({ where: { id: input.listId } });
  if (!list) {
    return { status: "list-not-found" };
  }

  const access = await resolveListAccess(database, {
    userId: input.userId,
    listId: input.listId,
  });
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  await database.list.update({ where: { id: input.listId }, data: { status: input.status } });
  return { status: "updated" };
}
