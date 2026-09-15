import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { meetsListAccessLevel } from "@/lib/permissions/list-access";
import { resolveItemAccess } from "@/lib/permissions/item-access";

import { buildItemShareUrl } from "./item-sharing";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("item sharing integration test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `item-sharing-${userId}@example.test` },
    });
    return userId;
  }

  try {
    // A Share link is just the Item detail URL — a User without access to
    // the Item is still denied by the same lib/permissions/ check the Item
    // detail route already runs, even though they have the link (#44).
    {
      const workspaceId = randomUUID();
      const listId = randomUUID();
      createdWorkspaceIds.push(workspaceId);
      await prisma.workspace.create({ data: { id: workspaceId, name: "Marketing", kind: "SHARED" } });
      await prisma.list.create({ data: { id: listId, workspaceId, name: "Marketing List" } });

      const ownerId = await createUser();
      await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId, userId: ownerId, role: "MEMBER" } });
      await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: ownerId, role: "MEMBER" } });

      const item = await prisma.item.create({
        data: { id: randomUUID(), listId, creatorId: ownerId, title: "Campaign brief" },
      });

      const outsiderId = await createUser();

      const shareUrl = buildItemShareUrl("https://app.listitup.test", {
        sourceWorkspaceId: workspaceId,
        listId,
        id: item.id,
      });
      assert.equal(shareUrl, `https://app.listitup.test/workspaces/${workspaceId}/lists/${listId}/items/${item.id}`);

      const ownerAccess = await resolveItemAccess(prisma, { userId: ownerId, itemId: item.id });
      assert.equal(meetsListAccessLevel(ownerAccess, "READ"), true, "the Member who created the Item can open the link");

      const outsiderAccess = await resolveItemAccess(prisma, { userId: outsiderId, itemId: item.id });
      assert.equal(
        meetsListAccessLevel(outsiderAccess, "READ"),
        false,
        "a User without access to the Item is denied even with the link"
      );
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
    await prisma.item.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.listMember.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.list.deleteMany({ where: { id: { in: listIds } } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: { in: createdWorkspaceIds } } });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("item sharing integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
