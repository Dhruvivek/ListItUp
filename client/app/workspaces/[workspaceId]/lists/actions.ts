"use server";

import { revalidatePath } from "next/cache";

import { archiveList, restoreList } from "@/lib/list/list-lifecycle";
import { createList } from "@/lib/list/list-creation";
import { toggleStarred } from "@/lib/list/list-starring";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

function listsPath(workspaceId: string): string {
  return `/workspaces/${workspaceId}/lists`;
}

export async function createListAction(
  workspaceId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(listsPath(workspaceId));
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  await createList(prisma, { workspaceId, creatorUserId: session.user.id, name });
  revalidatePath(listsPath(workspaceId));
}

export async function toggleListStarredAction(
  workspaceId: string,
  listId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(listsPath(workspaceId));
  await toggleStarred(prisma, { userId: session.user.id, listId });
  revalidatePath(listsPath(workspaceId));
}

export async function archiveListAction(
  workspaceId: string,
  listId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(listsPath(workspaceId));
  await archiveList(prisma, { userId: session.user.id, listId });
  revalidatePath(listsPath(workspaceId));
}

export async function restoreListAction(
  workspaceId: string,
  listId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(listsPath(workspaceId));
  await restoreList(prisma, { userId: session.user.id, listId });
  revalidatePath(listsPath(workspaceId));
}
