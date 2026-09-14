"use server";

import { revalidatePath } from "next/cache";

import type { ItemPriority, ItemState } from "@/generated/prisma/client";
import { addAssignee, removeAssignee } from "@/lib/item/item-assignment";
import { createItem } from "@/lib/item/item-creation";
import { isValidItemState, transitionItemState, updateItem } from "@/lib/item/item-lifecycle";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

function itemPath(workspaceId: string, listId: string, itemId: string): string {
  return `/workspaces/${workspaceId}/lists/${listId}/items/${itemId}`;
}

const VALID_PRIORITIES: readonly ItemPriority[] = ["LOW", "NORMAL", "HIGH"];

export async function updateItemDetailsAction(
  workspaceId: string,
  listId: string,
  itemId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(itemPath(workspaceId, listId, itemId));
  const title = String(formData.get("title") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");

  await updateItem(prisma, {
    actorUserId: session.user.id,
    itemId,
    ...(title ? { title } : {}),
    sectionId: sectionId || null,
    ...(VALID_PRIORITIES.includes(priority as ItemPriority) ? { priority: priority as ItemPriority } : {}),
    dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
  });
  revalidatePath(itemPath(workspaceId, listId, itemId));
}

export async function transitionItemStateAction(
  workspaceId: string,
  listId: string,
  itemId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(itemPath(workspaceId, listId, itemId));
  const state = String(formData.get("state") ?? "");
  const blockerReason = String(formData.get("blockerReason") ?? "");

  if (!isValidItemState(state)) {
    return;
  }

  await transitionItemState(prisma, {
    actorUserId: session.user.id,
    itemId,
    state: state as ItemState,
    blockerReason: blockerReason || undefined,
  });
  revalidatePath(itemPath(workspaceId, listId, itemId));
}

export async function addItemAssigneeAction(
  workspaceId: string,
  listId: string,
  itemId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(itemPath(workspaceId, listId, itemId));
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  await addAssignee(prisma, { actorUserId: session.user.id, itemId, userId });
  revalidatePath(itemPath(workspaceId, listId, itemId));
}

export async function removeItemAssigneeAction(
  workspaceId: string,
  listId: string,
  itemId: string,
  userId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(itemPath(workspaceId, listId, itemId));
  await removeAssignee(prisma, { actorUserId: session.user.id, itemId, userId });
  revalidatePath(itemPath(workspaceId, listId, itemId));
}

export async function addChildItemAction(
  workspaceId: string,
  listId: string,
  itemId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(itemPath(workspaceId, listId, itemId));
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return;
  }

  await createItem(prisma, { actorUserId: session.user.id, listId, title, parentId: itemId });
  revalidatePath(itemPath(workspaceId, listId, itemId));
}
