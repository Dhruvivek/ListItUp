import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createDependency, removeDependency } from "./item-dependencies";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("item dependencies integration test skipped: DATABASE_URL is not set");
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
      data: { id: userId, name: "Test User", email: `item-deps-${userId}@example.test` },
    });
    return userId;
  }

  async function createWorkspaceListAndMember(
    listRole: "LEAD" | "MEMBER" | "VIEWER" = "MEMBER"
  ): Promise<{ workspaceId: string; listId: string; userId: string }> {
    const workspaceId = randomUUID();
    const listId = randomUUID();
    createdWorkspaceIds.push(workspaceId);
    await prisma.workspace.create({ data: { id: workspaceId, name: "Test Workspace" } });
    await prisma.list.create({ data: { id: listId, workspaceId, name: "Test List" } });
    const userId = await createUser();
    await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId, userId, role: "MEMBER" } });
    await prisma.listMember.create({ data: { id: randomUUID(), listId, userId, role: listRole } });
    return { workspaceId, listId, userId };
  }

  async function createTestItem(listId: string, creatorId: string, title = "Test Item"): Promise<string> {
    const itemId = randomUUID();
    await prisma.item.create({ data: { id: itemId, listId, title, creatorId } });
    return itemId;
  }

  try {
    // A List Member can link two Items in the same List.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const blockerId = await createTestItem(listId, userId, "Vendor resubmission");
      const blockedId = await createTestItem(listId, userId, "Review calculations");

      const result = await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(result, { status: "created" });
      const dependency = await prisma.itemDependency.findUnique({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
      assert.ok(dependency);
    }

    // Linking is allowed across different Lists, as long as the User has
    // access to both Items.
    {
      const { listId: listA, userId } = await createWorkspaceListAndMember();
      const workspaceB = randomUUID();
      createdWorkspaceIds.push(workspaceB);
      await prisma.workspace.create({ data: { id: workspaceB, name: "Other Workspace" } });
      const listB = randomUUID();
      await prisma.list.create({ data: { id: listB, workspaceId: workspaceB, name: "Other List" } });
      await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId: workspaceB, userId, role: "MEMBER" } });
      await prisma.listMember.create({ data: { id: randomUUID(), listId: listB, userId, role: "MEMBER" } });

      const blockerId = await createTestItem(listA, userId);
      const blockedId = await createTestItem(listB, userId);

      const result = await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(result, { status: "created" });
    }

    // Creating a Dependency requires access to both Items — a User lacking
    // access to one side is rejected.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const blockerId = await createTestItem(listId, userId);
      const { listId: privateListId } = await createWorkspaceListAndMember();
      const otherCreatorId = await createUser();
      const blockedId = await createTestItem(privateListId, otherCreatorId);

      const result = await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(result, { status: "forbidden" });
    }

    // A List Viewer cannot create a Dependency, even with read access to
    // both Items.
    {
      const { listId, userId: viewerId } = await createWorkspaceListAndMember("VIEWER");
      const creatorId = await createUser();
      const blockerId = await createTestItem(listId, creatorId);
      const blockedId = await createTestItem(listId, creatorId);

      const result = await createDependency(prisma, { actorUserId: viewerId, blockerId, blockedId });
      assert.deepEqual(result, { status: "forbidden" });
    }

    // An Item cannot depend on itself.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const itemId = await createTestItem(listId, userId);

      const result = await createDependency(prisma, { actorUserId: userId, blockerId: itemId, blockedId: itemId });
      assert.deepEqual(result, { status: "self-dependency" });
    }

    // A duplicate link (same direction) is rejected.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const blockerId = await createTestItem(listId, userId);
      const blockedId = await createTestItem(listId, userId);
      await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });

      const result = await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(result, { status: "duplicate" });
    }

    // Creating and removing a Dependency never changes either Item's
    // lifecycle state.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const blockerId = await createTestItem(listId, userId);
      const blockedId = await createTestItem(listId, userId);

      const before = await Promise.all([
        prisma.item.findUniqueOrThrow({ where: { id: blockerId } }),
        prisma.item.findUniqueOrThrow({ where: { id: blockedId } }),
      ]);
      assert.equal(before[0].state, "TO_DO");
      assert.equal(before[1].state, "TO_DO");

      await createDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      const afterCreate = await Promise.all([
        prisma.item.findUniqueOrThrow({ where: { id: blockerId } }),
        prisma.item.findUniqueOrThrow({ where: { id: blockedId } }),
      ]);
      assert.equal(afterCreate[0].state, "TO_DO");
      assert.equal(afterCreate[1].state, "TO_DO");

      const removed = await removeDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(removed, { status: "removed" });
      const afterRemove = await Promise.all([
        prisma.item.findUniqueOrThrow({ where: { id: blockerId } }),
        prisma.item.findUniqueOrThrow({ where: { id: blockedId } }),
      ]);
      assert.equal(afterRemove[0].state, "TO_DO");
      assert.equal(afterRemove[1].state, "TO_DO");
      const dependency = await prisma.itemDependency.findUnique({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
      assert.equal(dependency, null);
    }

    // Removing a non-existent Dependency is reported rather than silently
    // no-op-ing.
    {
      const { listId, userId } = await createWorkspaceListAndMember();
      const blockerId = await createTestItem(listId, userId);
      const blockedId = await createTestItem(listId, userId);

      const result = await removeDependency(prisma, { actorUserId: userId, blockerId, blockedId });
      assert.deepEqual(result, { status: "dependency-not-found" });
    }
  } finally {
    const listIds = (
      await prisma.list.findMany({ where: { workspaceId: { in: createdWorkspaceIds } } })
    ).map((list) => list.id);
    await prisma.itemDependency.deleteMany({ where: { blocker: { listId: { in: listIds } } } });
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

  console.log("item dependencies integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
