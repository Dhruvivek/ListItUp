import { randomUUID } from "node:crypto";

import type { PrismaClient, WorkspaceRole } from "@/generated/prisma/client";

// Invitations may only ever grant these two Workspace-level roles — ADMIN
// and OWNER are never invite-time grants (see domain model spec).
export type InvitableWorkspaceRole = Extract<WorkspaceRole, "MEMBER" | "VIEWER">;

export interface InvitationDetails {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: InvitableWorkspaceRole;
}

function isLiveInvitation(invitation: {
  acceptedAt: Date | null;
  expiresAt: Date;
}): boolean {
  return !invitation.acceptedAt && invitation.expiresAt > new Date();
}

function requireInvitableRole(role: WorkspaceRole): InvitableWorkspaceRole {
  if (role !== "MEMBER" && role !== "VIEWER") {
    throw new Error(
      `Workspace invitations may only grant MEMBER or VIEWER, found ${role}.`
    );
  }

  return role;
}

export async function resolveInvitation(
  database: PrismaClient,
  token: string
): Promise<InvitationDetails | null> {
  const invitation = await database.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation || !isLiveInvitation(invitation)) {
    return null;
  }

  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    email: invitation.email,
    role: requireInvitableRole(invitation.role),
  };
}

export async function resolveInvitationEmailForCallback(
  database: PrismaClient,
  callbackURL: string
): Promise<string | null> {
  let callback: URL;
  try {
    callback = new URL(callbackURL, "http://listitup.local");
  } catch {
    return null;
  }

  if (callback.pathname !== "/accept-invitation") {
    return null;
  }

  const token = callback.searchParams.get("token");
  if (!token) {
    return null;
  }

  return (await resolveInvitation(database, token))?.email ?? null;
}

export type AcceptInvitationResult =
  | { status: "accepted"; workspaceId: string }
  | { status: "invalid" }
  | { status: "email-mismatch" };

export async function acceptInvitation(
  database: PrismaClient,
  token: string,
  userId: string,
  userEmail: string
): Promise<AcceptInvitationResult> {
  const invitation = await database.workspaceInvitation.findUnique({
    where: { token },
  });

  if (!invitation || !isLiveInvitation(invitation)) {
    return { status: "invalid" };
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { status: "email-mismatch" };
  }

  await database.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
    },
    create: {
      id: randomUUID(),
      workspaceId: invitation.workspaceId,
      userId,
      role: requireInvitableRole(invitation.role),
    },
    update: {},
  });

  await database.workspaceInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  return { status: "accepted", workspaceId: invitation.workspaceId };
}
