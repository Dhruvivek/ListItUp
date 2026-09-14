import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { addListMember } from "./list-membership";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("list membership integration test skipped: DATABASE_URL is not set");
    return;
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("@/generated/prisma/client"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const createdUserIds: string[] = [];
  const createdWorkspaceIds: string[] = [];
  const createdListIds: string[] = [];

  async function createWorkspaceWithList(): Promise<{
    workspaceId: string;
    listId: string;
  }> {
    const workspaceId = randomUUID();
    const listId = randomUUID();
    createdWorkspaceIds.push(workspaceId);
    createdListIds.push(listId);

    await prisma.workspace.create({ data: { id: workspaceId, name: "Launch Team" } });
    await prisma.list.create({ data: { id: listId, workspaceId, name: "Checklist" } });

    return { workspaceId, listId };
  }

  async function createUser(): Promise<string> {
    const userId = randomUUID();
    createdUserIds.push(userId);
    await prisma.user.create({
      data: { id: userId, name: "User", email: `user-${randomUUID()}@example.test` },
    });

    return userId;
  }

  try {
    // A User with no Workspace-level membership in the List's Workspace is
    // rejected.
    {
      const { listId } = await createWorkspaceWithList();
      const outsiderId = await createUser();

      const result = await addListMember(prisma, {
        listId,
        userId: outsiderId,
        role: "MEMBER",
      });

      assert.deepEqual(result, { status: "user-lacks-workspace-membership" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: outsiderId } },
      });
      assert.equal(membership, null);
    }

    // A User who already holds a Workspace-level membership can be added
    // with an explicit List-level role.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const userId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId, role: "MEMBER" },
      });

      const result = await addListMember(prisma, { listId, userId, role: "VIEWER" });

      assert.deepEqual(result, { status: "added" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId } },
      });
      assert.equal(membership?.role, "VIEWER");
    }

    // A non-existent List is reported rather than silently creating one.
    {
      const userId = await createUser();

      const result = await addListMember(prisma, {
        listId: randomUUID(),
        userId,
        role: "MEMBER",
      });

      assert.deepEqual(result, { status: "list-not-found" });
    }
  } finally {
    await prisma.listMember.deleteMany({ where: { listId: { in: createdListIds } } });
    await prisma.list.deleteMany({ where: { id: { in: createdListIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("list membership integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
