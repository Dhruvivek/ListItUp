"use server";

import { revalidatePath } from "next/cache";

import type { ListMemberRole } from "@/generated/prisma/client";
import { grantGuestAccess, revokeGuestAccess } from "@/lib/list/list-guests";
import { updateListDescription } from "@/lib/list/list-lifecycle";
import { addListMember, removeListMember } from "@/lib/list/list-membership";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

function listPath(workspaceId: string, listId: string): string {
  return `/workspaces/${workspaceId}/lists/${listId}`;
}

// The Roles panel only ever offers Member/Viewer (#28) — promoting someone
// to List Lead isn't part of this ticket's scope.
const ADDABLE_ROLES: readonly ListMemberRole[] = ["MEMBER", "VIEWER"];

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

export async function addListMemberAction(
  workspaceId: string,
  listId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(listPath(workspaceId, listId));
  const targetUserId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!targetUserId || !ADDABLE_ROLES.includes(role as ListMemberRole)) {
    return;
  }

  await addListMember(prisma, {
    actorUserId: session.user.id,
    listId,
    userId: targetUserId,
    role: role as ListMemberRole,
  });
  revalidatePath(listPath(workspaceId, listId));
}

export async function removeListMemberAction(
  workspaceId: string,
  listId: string,
  targetUserId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(listPath(workspaceId, listId));
  await removeListMember(prisma, { actorUserId: session.user.id, listId, userId: targetUserId });
  revalidatePath(listPath(workspaceId, listId));
}

export async function grantGuestAccessAction(
  workspaceId: string,
  listId: string,
  formData: FormData
): Promise<void> {
  const session = await requireAuthenticatedSession(listPath(workspaceId, listId));
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return;
  }

  await grantGuestAccess(prisma, { actorUserId: session.user.id, listId, email });
  revalidatePath(listPath(workspaceId, listId));
}

export async function revokeGuestAccessAction(
  workspaceId: string,
  listId: string,
  targetUserId: string
): Promise<void> {
  const session = await requireAuthenticatedSession(listPath(workspaceId, listId));
  await revokeGuestAccess(prisma, { actorUserId: session.user.id, listId, userId: targetUserId });
  revalidatePath(listPath(workspaceId, listId));
}
