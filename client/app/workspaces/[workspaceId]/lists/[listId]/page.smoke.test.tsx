import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { loadListPageData } from "./page-data";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("List page smoke test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `list-page-${userId}@example.test` },
    });
    return userId;
  }

  async function createWorkspaceWithList(): Promise<{ workspaceId: string; listId: string }> {
    const workspaceId = randomUUID();
    const listId = randomUUID();
    createdWorkspaceIds.push(workspaceId);
    await prisma.workspace.create({ data: { id: workspaceId, name: "Test Workspace" } });
    await prisma.list.create({
      data: { id: listId, workspaceId, name: "Platform Retrofit", description: "Retrofit work." },
    });
    return { workspaceId, listId };
  }

  try {
    // A List Lead sees full data and can edit Description.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: leadId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: leadId, role: "LEAD" },
      });

      const data = await loadListPageData(prisma, { userId: leadId, workspaceId, listId });

      assert.ok(data, "expected page data for a List Lead");
      assert.equal(data!.name, "Platform Retrofit");
      assert.equal(data!.description, "Retrofit work.");
      assert.equal(data!.access, "LEAD");
      assert.equal(data!.canEditDescription, true);
      assert.deepEqual(data!.roles.leads.map((r) => r.userId), [leadId]);
    }

    // A List Member has read access but cannot edit Description.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data, "expected page data for a List Member");
      assert.equal(data!.access, "WRITE");
      assert.equal(data!.canEditDescription, false);
    }

    // A User with no access to the List gets no page data at all.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const strangerId = await createUser();

      const data = await loadListPageData(prisma, { userId: strangerId, workspaceId, listId });
      assert.equal(data, null);
    }

    // A List belonging to a different Workspace than the URL claims also
    // resolves to no page data.
    {
      const { listId } = await createWorkspaceWithList();
      const otherWorkspaceId = randomUUID();
      createdWorkspaceIds.push(otherWorkspaceId);
      await prisma.workspace.create({ data: { id: otherWorkspaceId, name: "Other Workspace" } });
      const ownerId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId: otherWorkspaceId, userId: ownerId, role: "OWNER" },
      });

      const data = await loadListPageData(prisma, {
        userId: ownerId,
        workspaceId: otherWorkspaceId,
        listId,
      });
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

  console.log("List page smoke test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
