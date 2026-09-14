import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { loadListBrowsingPageData } from "./page-data";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("list browsing page smoke test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `list-browsing-page-${userId}@example.test` },
    });
    return userId;
  }

  try {
    // A signed-in Workspace Member with effective access sees exactly the
    // Lists their access resolves to, scoped to the current Workspace.
    {
      const workspaceId = randomUUID();
      createdWorkspaceIds.push(workspaceId);
      await prisma.workspace.create({ data: { id: workspaceId, name: "Acme Studio" } });

      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });

      const visibleListId = randomUUID();
      await prisma.list.create({ data: { id: visibleListId, workspaceId, name: "Visible List" } });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId: visibleListId, userId: memberId, role: "MEMBER" },
      });
      await prisma.list.create({ data: { id: randomUUID(), workspaceId, name: "Hidden List" } });

      const data = await loadListBrowsingPageData(prisma, memberId, workspaceId, {});

      assert.ok(data, "expected page data for a Workspace Member");
      assert.equal(data!.workspaceName, "Acme Studio");
      assert.deepEqual(
        data!.lists.map((list) => list.id),
        [visibleListId]
      );
    }

    // A User with no relationship to the Workspace gets no page data at
    // all (the page renders notFound() for this).
    {
      const workspaceId = randomUUID();
      createdWorkspaceIds.push(workspaceId);
      await prisma.workspace.create({ data: { id: workspaceId, name: "Outsider Test" } });
      const strangerId = await createUser();

      const data = await loadListBrowsingPageData(prisma, strangerId, workspaceId, {});
      assert.equal(data, null);
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
    await prisma.listMember.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.list.deleteMany({ where: { id: { in: listIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("list browsing page smoke test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
