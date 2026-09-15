"use server";

import { revalidatePath } from "next/cache";

import { isValidMyTasksBoardGroupBy, moveMyTaskItemToColumn } from "@/lib/item/item-my-tasks-board";
import { createItemFromQuickAdd } from "@/lib/item/item-quick-add";
import { transitionItemState } from "@/lib/item/item-lifecycle";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

const MY_TASKS_PATH = "/my-tasks";

// Completing an Item from My Tasks calls the same lib/item mutation used
// on the Item detail page and Board — the Item updates everywhere else it
// appears because it's the same row, not a copy (#42).
export async function completeMyTaskItemAction(itemId: string): Promise<void> {
  const session = await requireAuthenticatedSession(MY_TASKS_PATH);
  await transitionItemState(prisma, { actorUserId: session.user.id, itemId, state: "COMPLETE" });
  revalidatePath(MY_TASKS_PATH);
}

// Quick-Add's capture box (#45) — parses shorthand out of the typed text
// and creates the Item through lib/item/item-quick-add.ts, which itself
// calls lib/item/'s existing createItem rather than a parallel path. An
// empty or shorthand-only submission is a silent no-op, same as the List
// page's "Add an Item" form handles a blank title. This is Add Task's
// (#44) implementation — no separate Quick-Add path is added here.
export async function quickAddItemAction(formData: FormData): Promise<void> {
  const session = await requireAuthenticatedSession(MY_TASKS_PATH);
  const text = String(formData.get("quickAddText") ?? "").trim();

  if (!text) {
    return;
  }

  await createItemFromQuickAdd(prisma, { actorUserId: session.user.id, text });
  revalidatePath(MY_TASKS_PATH);
}

// Moving a card on My Tasks' Board dispatches through the same lib/item
// mutations as the List page's Board move (#43) — see
// moveMyTaskItemToColumn in lib/item/item-my-tasks-board.ts for why that's
// safe across Workspaces without extra checks here.
export async function moveMyTaskItemAction(
  groupBy: string,
  itemId: string,
  columnKey: string,
  blockerReason?: string
): Promise<void> {
  const session = await requireAuthenticatedSession(MY_TASKS_PATH);

  if (!isValidMyTasksBoardGroupBy(groupBy)) {
    return;
  }

  await moveMyTaskItemToColumn(prisma, {
    actorUserId: session.user.id,
    itemId,
    groupBy,
    columnKey,
    blockerReason,
  });
  revalidatePath(MY_TASKS_PATH);
}
