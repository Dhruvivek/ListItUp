import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";
import {
  INBOX_LIST_NAME,
  PERSONAL_SPACE_NAME,
} from "@/lib/auth/auth-config";

export async function provisionPersonalWorkspace(
  database: PrismaClient,
  userId: string
): Promise<void> {
  const user = await database.user.findUnique({ where: { id: userId } });

  if (!user || !user.emailVerified) {
    return;
  }

  const existingPersonalMembership = await database.workspaceMember.findFirst(
    { where: { userId, workspace: { kind: "PERSONAL" } } }
  );

  if (existingPersonalMembership) {
    return;
  }

  await database.workspace.create({
    data: {
      id: randomUUID(),
      name: PERSONAL_SPACE_NAME,
      kind: "PERSONAL",
      members: {
        create: [{ id: randomUUID(), userId, role: "OWNER" }],
      },
      lists: {
        create: [{ id: randomUUID(), name: INBOX_LIST_NAME, isInbox: true }],
      },
    },
  });
}
