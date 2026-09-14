import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { resolveListAccess } from "./list-access";
import { resolveItemAccess } from "./item-access";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("item access test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `item-access-${userId}@example.test` },
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

  async function createItem(listId: string, creatorId: string, parentId?: string): Promise<string> {
    const itemId = randomUUID();
    await prisma.item.create({
      data: { id: itemId, listId, title: "Test Item", creatorId, parentId },
    });
    return itemId;
  }

  try {
    // Item-level access matches the derived List's effective access.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      const itemId = await createItem(listId, memberId);

      const listAccess = await resolveListAccess(prisma, { userId: memberId, listId });
      const itemAccess = await resolveItemAccess(prisma, { userId: memberId, itemId });
      assert.equal(itemAccess, listAccess);
      assert.equal(itemAccess, "WRITE");
    }

    // A nested child Item resolves access from its own List (which is the
    // same List its parent belongs to) — not from the parent Item.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: leadId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: leadId, role: "LEAD" },
      });
      const parentId = await createItem(listId, leadId);
      const childId = await createItem(listId, leadId, parentId);
      const grandchildId = await createItem(listId, leadId, childId);

      assert.equal(await resolveItemAccess(prisma, { userId: leadId, itemId: parentId }), "LEAD");
      assert.equal(await resolveItemAccess(prisma, { userId: leadId, itemId: childId }), "LEAD");
      assert.equal(await resolveItemAccess(prisma, { userId: leadId, itemId: grandchildId }), "LEAD");
    }

    // A User with no access to the parent List has no access to its Items.
    {
      const { listId } = await createWorkspaceWithList();
      const creatorId = await createUser();
      const itemId = await createItem(listId, creatorId);
      const strangerId = await createUser();

      assert.equal(await resolveItemAccess(prisma, { userId: strangerId, itemId }), "NONE");
    }

    // A non-existent Item resolves to NONE rather than throwing.
    {
      const userId = await createUser();
      assert.equal(
        await resolveItemAccess(prisma, { userId, itemId: randomUUID() }),
        "NONE"
      );
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
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

  console.log("item access test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
