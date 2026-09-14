import type { ItemPriority, ItemState, PrismaClient } from "@/generated/prisma/client";
import { resolveItemAccess } from "@/lib/permissions/item-access";
import { meetsListAccessLevel } from "@/lib/permissions/list-access";

export type UpdateItemResult =
  | { status: "updated" }
  | { status: "item-not-found" }
  | { status: "forbidden" };

export type TransitionItemStateResult =
  | { status: "transitioned" }
  | { status: "item-not-found" }
  | { status: "forbidden" }
  | { status: "blocker-reason-required" };

// A List Member, Lead, or Workspace Admin/Owner can update/transition an
// Item; a List Viewer or Guest cannot (#30). Any single Assignee who is
// also at least a List Member can transition to COMPLETE on their own —
// there is no multi-Assignee consensus mechanism to bypass, so this is the
// same gate as every other transition.
const REQUIRED_ACCESS_LEVEL = "WRITE";

const ITEM_STATES: readonly ItemState[] = ["TO_DO", "IN_PROGRESS", "BLOCKED", "COMPLETE", "ARCHIVED"];

export function isValidItemState(value: string): value is ItemState {
  return (ITEM_STATES as readonly string[]).includes(value);
}

export function validateStateTransition(
  nextState: ItemState,
  blockerReason: string | undefined
): { valid: true } | { valid: false; reason: "blocker-reason-required" } {
  if (nextState === "BLOCKED" && !blockerReason?.trim()) {
    return { valid: false, reason: "blocker-reason-required" };
  }
  return { valid: true };
}

export async function updateItem(
  database: PrismaClient,
  input: {
    actorUserId: string;
    itemId: string;
    title?: string;
    sectionId?: string | null;
    priority?: ItemPriority;
    dueDate?: Date | null;
  }
): Promise<UpdateItemResult> {
  const { actorUserId, itemId, title, sectionId, priority, dueDate } = input;

  const item = await database.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return { status: "item-not-found" };
  }

  const access = await resolveItemAccess(database, { userId: actorUserId, itemId });
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  await database.item.update({
    where: { id: itemId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(sectionId !== undefined ? { sectionId } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    },
  });

  return { status: "updated" };
}

export async function transitionItemState(
  database: PrismaClient,
  input: { actorUserId: string; itemId: string; state: ItemState; blockerReason?: string }
): Promise<TransitionItemStateResult> {
  const { actorUserId, itemId, state, blockerReason } = input;

  const item = await database.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return { status: "item-not-found" };
  }

  const access = await resolveItemAccess(database, { userId: actorUserId, itemId });
  if (!meetsListAccessLevel(access, REQUIRED_ACCESS_LEVEL)) {
    return { status: "forbidden" };
  }

  const transition = validateStateTransition(state, blockerReason);
  if (!transition.valid) {
    return { status: transition.reason };
  }

  await database.item.update({
    where: { id: itemId },
    data: { state, blockerReason: state === "BLOCKED" ? blockerReason!.trim() : null },
  });

  return { status: "transitioned" };
}

export async function archiveItem(
  database: PrismaClient,
  input: { actorUserId: string; itemId: string }
): Promise<TransitionItemStateResult> {
  return transitionItemState(database, { ...input, state: "ARCHIVED" });
}

export async function restoreItem(
  database: PrismaClient,
  input: { actorUserId: string; itemId: string }
): Promise<TransitionItemStateResult> {
  return transitionItemState(database, { ...input, state: "TO_DO" });
}
