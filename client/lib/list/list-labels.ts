import { randomUUID } from "node:crypto";

import type { PrismaClient, WorkspaceRole } from "@/generated/prisma/client";

export type CreateLabelResult =
  | { status: "created"; labelId: string }
  | { status: "workspace-not-found" }
  | { status: "forbidden" }
  | { status: "duplicate-name" };

// Mirrors List-creation rights (lib/list/list-creation.ts): only Workspace
// Owner/Admin can create a Label. This naturally covers Personal Space too
// — a User's Personal Space membership is always OWNER — so it needs no
// branch on Workspace.kind (#34).
const ROLES_ALLOWED_TO_CREATE_LABEL: readonly WorkspaceRole[] = ["OWNER", "ADMIN"];

const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_ERROR_CODE
  );
}

export async function createLabel(
  database: PrismaClient,
  input: { actorUserId: string; workspaceId: string; name: string }
): Promise<CreateLabelResult> {
  const { actorUserId, workspaceId, name } = input;

  const workspace = await database.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { status: "workspace-not-found" };
  }

  const membership = await database.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
  });
  if (!membership || !ROLES_ALLOWED_TO_CREATE_LABEL.includes(membership.role)) {
    return { status: "forbidden" };
  }

  try {
    const label = await database.label.create({ data: { id: randomUUID(), workspaceId, name } });
    return { status: "created", labelId: label.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "duplicate-name" };
    }
    throw error;
  }
}
