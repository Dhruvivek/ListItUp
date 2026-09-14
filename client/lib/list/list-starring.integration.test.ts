import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { toggleStarred } from "./list-starring";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("list starring integration test skipped: DATABASE_URL is not set");
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

  async function createUser(): Promise<string> {
    const userId = randomUUID();
    createdUserIds.push(userId);
    await prisma.user.create({
      data: { id: userId, name: "Test User", email: `list-starring-${userId}@example.test` },
    });
    return userId;
  }

  async function createWorkspaceWithList(): Promise<{ workspaceId: string; listId: string }> {
    const workspaceId = randomUUID();
    const listId = randomUUID();
    createdWorkspaceIds.push(workspaceId);
    await prisma.workspace.create({ data: { id: workspaceId, name: "Test Workspace" } });
    await prisma.list.create({ data: { id: listId, workspaceId, name: "Test List" } });
    return { workspaceId, listId };
  }

  async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  ): Promise<void> {
    await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId, userId, role } });
  }

  async function addListMember(
    listId: string,
    userId: string,
    role: "LEAD" | "MEMBER" | "VIEWER"
  ): Promise<void> {
    await prisma.listMember.create({ data: { id: randomUUID(), listId, userId, role } });
  }

  try {
    // Toggling twice stars then unstars, independent of anyone else's view.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const viewerId = await createUser();
      await addWorkspaceMember(workspaceId, viewerId, "MEMBER");
      await addListMember(listId, viewerId, "VIEWER");

      const starred = await toggleStarred(prisma, { userId: viewerId, listId });
      assert.deepEqual(starred, { status: "starred" });
      let row = await prisma.starred.findUnique({
        where: { userId_listId: { userId: viewerId, listId } },
      });
      assert.ok(row);

      const unstarred = await toggleStarred(prisma, { userId: viewerId, listId });
      assert.deepEqual(unstarred, { status: "unstarred" });
      row = await prisma.starred.findUnique({
        where: { userId_listId: { userId: viewerId, listId } },
      });
      assert.equal(row, null);
    }

    // Starring is per-User: one User's star doesn't affect another's.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const userAId = await createUser();
      const userBId = await createUser();
      await addWorkspaceMember(workspaceId, userAId, "OWNER");
      await addWorkspaceMember(workspaceId, userBId, "OWNER");

      await toggleStarred(prisma, { userId: userAId, listId });
      const bRow = await prisma.starred.findUnique({
        where: { userId_listId: { userId: userBId, listId } },
      });
      assert.equal(bRow, null, "starring must not leak to another User");
    }

    // A User with no access to the List cannot star it.
    {
      const { listId } = await createWorkspaceWithList();
      const strangerId = await createUser();

      const result = await toggleStarred(prisma, { userId: strangerId, listId });
      assert.deepEqual(result, { status: "forbidden" });
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
    await prisma.starred.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.listMember.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.list.deleteMany({ where: { id: { in: listIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("list starring integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
