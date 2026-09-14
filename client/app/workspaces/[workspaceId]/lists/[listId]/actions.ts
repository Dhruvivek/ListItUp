"use server";

import { revalidatePath } from "next/cache";

import { updateListDescription } from "@/lib/list/list-lifecycle";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

function listPath(workspaceId: string, listId: string): string {
  return `/workspaces/${workspaceId}/lists/${listId}`;
}

export async function updateListDescriptionAction(
  workspaceId: string,
  listId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(listPath(workspaceId, listId));
  const description = String(formData.get("description") ?? "");

  await updateListDescription(prisma, { userId: session.user.id, listId, description });
  revalidatePath(listPath(workspaceId, listId));
}
