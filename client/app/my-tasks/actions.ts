"use server";

import { revalidatePath } from "next/cache";

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
