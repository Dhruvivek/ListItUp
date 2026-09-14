import type { PrismaClient, WorkspaceRole } from "@/generated/prisma/client";

// Confirmed with the repo owner during issue #20 (see docs/Specs-Planned/
// domain-model-schema-migration-and-permissions.md, Further Notes).
const DEFAULT_OUTGOING_OWNER_ROLE: WorkspaceRole = "ADMIN";

export type TransferWorkspaceOwnershipResult =
  | { status: "transferred" }
  | { status: "no-current-owner" }
  | { status: "new-owner-not-a-member" };

const RECORD_NOT_FOUND_ERROR_CODE = "P2025";

function isRecordNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === RECORD_NOT_FOUND_ERROR_CODE
  );
}

export async function transferWorkspaceOwnership(
  database: PrismaClient,
  workspaceId: string,
  newOwnerUserId: string,
  outgoingOwnerRole: WorkspaceRole = DEFAULT_OUTGOING_OWNER_ROLE
): Promise<TransferWorkspaceOwnershipResult> {
  try {
    return await database.$transaction(async (tx) => {
      const currentOwner = await tx.workspaceMember.findFirst({
        where: { workspaceId, role: "OWNER" },
      });

      if (!currentOwner) {
        return { status: "no-current-owner" };
      }

      await tx.workspaceMember.update({
        where: { id: currentOwner.id },
        data: { role: outgoingOwnerRole },
      });

      await tx.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: newOwnerUserId } },
        data: { role: "OWNER" },
      });

      return { status: "transferred" };
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { status: "new-owner-not-a-member" };
    }

    throw error;
  }
}
