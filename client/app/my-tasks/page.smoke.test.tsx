import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { loadMyTasksPageData } from "./page-data";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("My Tasks page smoke test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `my-tasks-page-${userId}@example.test` },
    });
    return userId;
  }

  async function createWorkspaceWithList(
    name: string,
    kind: "SHARED" | "PERSONAL" = "SHARED"
  ): Promise<{ workspaceId: string; listId: string }> {
    const workspaceId = randomUUID();
    const listId = randomUUID();
    createdWorkspaceIds.push(workspaceId);
    await prisma.workspace.create({ data: { id: workspaceId, name, kind } });
    await prisma.list.create({ data: { id: listId, workspaceId, name: `${name} List` } });
    return { workspaceId, listId };
  }

  async function joinWorkspace(workspaceId: string, listId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId, userId, role: "MEMBER" } });
    await prisma.listMember.create({ data: { id: randomUUID(), listId, userId, role: "MEMBER" } });
  }

  try {
    // filterWorkspaces lists every Workspace + Personal Space the User
    // belongs to, tagging which one is the Personal Space, regardless of
    // whether they currently have an assigned Item there (#42).
    {
      const userId = await createUser();
      const shared = await createWorkspaceWithList("Marketing");
      await joinWorkspace(shared.workspaceId, shared.listId, userId);
      const personal = await createWorkspaceWithList("Personal Space", "PERSONAL");
      await joinWorkspace(personal.workspaceId, personal.listId, userId);

      const item = await prisma.item.create({
        data: { id: randomUUID(), listId: shared.listId, creatorId: userId, title: "Campaign brief" },
      });
      await prisma.itemAssignee.create({ data: { id: randomUUID(), itemId: item.id, userId } });

      const data = await loadMyTasksPageData(prisma, { userId });

      assert.equal(data.items.length, 1);
      assert.equal(data.items[0].title, "Campaign brief");
      assert.equal(data.selectedWorkspaceId, null);
      assert.equal(data.includeCompleted, false);
      assert.equal(data.includeArchived, false);

      const byId = new Map(data.filterWorkspaces.map((workspace) => [workspace.id, workspace]));
      assert.equal(byId.get(shared.workspaceId)?.isPersonal, false);
      assert.equal(byId.get(personal.workspaceId)?.isPersonal, true);
    }

    // Filtering by a specific source Workspace threads through to the
    // returned data and excludes Items from other sources.
    {
      const userId = await createUser();
      const workspaceA = await createWorkspaceWithList("Marketing");
      await joinWorkspace(workspaceA.workspaceId, workspaceA.listId, userId);
      const workspaceB = await createWorkspaceWithList("Engineering");
      await joinWorkspace(workspaceB.workspaceId, workspaceB.listId, userId);

      const itemA = await prisma.item.create({
        data: { id: randomUUID(), listId: workspaceA.listId, creatorId: userId, title: "A task" },
      });
      await prisma.itemAssignee.create({ data: { id: randomUUID(), itemId: itemA.id, userId } });
      const itemB = await prisma.item.create({
        data: { id: randomUUID(), listId: workspaceB.listId, creatorId: userId, title: "B task" },
      });
      await prisma.itemAssignee.create({ data: { id: randomUUID(), itemId: itemB.id, userId } });

      const data = await loadMyTasksPageData(prisma, { userId, sourceWorkspaceId: workspaceA.workspaceId });

      assert.equal(data.selectedWorkspaceId, workspaceA.workspaceId);
      assert.deepEqual(data.items.map((item) => item.title), ["A task"]);
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
    await prisma.itemAssignee.deleteMany({ where: { item: { listId: { in: listIds } } } });
    await prisma.item.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.listMember.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.list.deleteMany({ where: { id: { in: listIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("My Tasks page smoke test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
