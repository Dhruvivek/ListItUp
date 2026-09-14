import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { resolveListAccess } from "@/lib/permissions/list-access";

import { addListMember, removeListMember } from "./list-membership";

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

  async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  ): Promise<void> {
    await prisma.workspaceMember.create({ data: { id: randomUUID(), workspaceId, userId, role } });
  }

  // Creates a User who is both a Workspace Member and this List's Lead, so
  // tests have a valid actor without repeating the setup each time.
  async function createListLead(workspaceId: string, listId: string): Promise<string> {
    const leadId = await createUser();
    await addWorkspaceMember(workspaceId, leadId, "MEMBER");
    await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: leadId, role: "LEAD" } });
    return leadId;
  }

  try {
    // A List Lead can add a User who already holds a Workspace-level
    // membership, with an explicit List-level role.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createListLead(workspaceId, listId);
      const targetId = await createUser();
      await addWorkspaceMember(workspaceId, targetId, "MEMBER");

      const result = await addListMember(prisma, { actorUserId: leadId, listId, userId: targetId, role: "VIEWER" });

      assert.deepEqual(result, { status: "added" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: targetId } },
      });
      assert.equal(membership?.role, "VIEWER");
    }

    // A User with no Workspace-level membership in the List's Workspace is
    // rejected as a target, even for a valid actor.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createListLead(workspaceId, listId);
      const outsiderId = await createUser();

      const result = await addListMember(prisma, { actorUserId: leadId, listId, userId: outsiderId, role: "MEMBER" });

      assert.deepEqual(result, { status: "user-lacks-workspace-membership" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: outsiderId } },
      });
      assert.equal(membership, null);
    }

    // A Workspace Admin (no explicit List role) can also add a Member.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const adminId = await createUser();
      await addWorkspaceMember(workspaceId, adminId, "ADMIN");
      const targetId = await createUser();
      await addWorkspaceMember(workspaceId, targetId, "MEMBER");

      const result = await addListMember(prisma, { actorUserId: adminId, listId, userId: targetId, role: "MEMBER" });
      assert.deepEqual(result, { status: "added" });
    }

    // A List Member (not Lead) cannot add another Member — only a List Lead
    // or Workspace Admin/Owner can.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await addWorkspaceMember(workspaceId, memberId, "MEMBER");
      await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" } });
      const targetId = await createUser();
      await addWorkspaceMember(workspaceId, targetId, "MEMBER");

      const result = await addListMember(prisma, { actorUserId: memberId, listId, userId: targetId, role: "VIEWER" });

      assert.deepEqual(result, { status: "forbidden" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: targetId } },
      });
      assert.equal(membership, null);
    }

    // A non-existent List is reported rather than silently creating one.
    {
      const actorId = await createUser();
      const targetId = await createUser();

      const result = await addListMember(prisma, {
        actorUserId: actorId,
        listId: randomUUID(),
        userId: targetId,
        role: "MEMBER",
      });

      assert.deepEqual(result, { status: "list-not-found" });
    }

    // A List Lead can remove a List Member.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createListLead(workspaceId, listId);
      const targetId = await createUser();
      await addWorkspaceMember(workspaceId, targetId, "MEMBER");
      await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: targetId, role: "MEMBER" } });

      const result = await removeListMember(prisma, { actorUserId: leadId, listId, userId: targetId });

      assert.deepEqual(result, { status: "removed" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: targetId } },
      });
      assert.equal(membership, null);
    }

    // A List Member cannot remove another Member.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await addWorkspaceMember(workspaceId, memberId, "MEMBER");
      await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" } });
      const targetId = await createUser();
      await addWorkspaceMember(workspaceId, targetId, "MEMBER");
      await prisma.listMember.create({ data: { id: randomUUID(), listId, userId: targetId, role: "VIEWER" } });

      const result = await removeListMember(prisma, { actorUserId: memberId, listId, userId: targetId });

      assert.deepEqual(result, { status: "forbidden" });
      const membership = await prisma.listMember.findUnique({
        where: { listId_userId: { listId, userId: targetId } },
      });
      assert.ok(membership, "target must remain a List Member");
    }

    // A Workspace Viewer granted a higher List-level role (e.g. List Lead)
    // still resolves to read-only effective access — the Viewer ceiling
    // holds even after this ticket's own mutation grants it.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createListLead(workspaceId, listId);
      const viewerId = await createUser();
      await addWorkspaceMember(workspaceId, viewerId, "VIEWER");

      const result = await addListMember(prisma, { actorUserId: leadId, listId, userId: viewerId, role: "LEAD" });
      assert.deepEqual(result, { status: "added" });

      const access = await resolveListAccess(prisma, { userId: viewerId, listId });
      assert.equal(access, "READ", "the Workspace Viewer ceiling must still hold");
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
