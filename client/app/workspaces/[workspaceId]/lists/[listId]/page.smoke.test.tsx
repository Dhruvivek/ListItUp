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
      assert.deepEqual(data!.eligibleMembers, [], "the Lead is already a List Member");
      assert.equal(data!.canManageSections, true);
      assert.equal(data!.groupBy, "SECTION");
    }

    // Sections render in order, and a List Member (not just Lead) can
    // manage them (#29).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      await prisma.section.create({ data: { id: randomUUID(), listId, name: "Done", order: 1 } });
      await prisma.section.create({ data: { id: randomUUID(), listId, name: "To Do", order: 0 } });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      assert.equal(data!.canManageSections, true);
      assert.deepEqual(
        data!.sections.map((s) => s.name),
        ["To Do", "Done"],
        "Sections render in their persisted order"
      );
    }

    // A List Viewer sees Sections but cannot manage them.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const viewerId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: viewerId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: viewerId, role: "VIEWER" },
      });

      const data = await loadListPageData(prisma, { userId: viewerId, workspaceId, listId });

      assert.ok(data);
      assert.equal(data!.canManageSections, false);
    }

    // Items render grouped into their Section, and unsectioned Items land
    // in a separate bucket (#30). Archived Items are excluded from both and
    // surfaced separately via archivedItems, the List/Board Archived
    // toggle's data source (#38).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      const sectionId = randomUUID();
      await prisma.section.create({ data: { id: sectionId, listId, name: "To Do", order: 0 } });
      await prisma.item.create({
        data: { id: randomUUID(), listId, sectionId, title: "In a Section", creatorId: memberId },
      });
      await prisma.item.create({
        data: { id: randomUUID(), listId, title: "No Section", creatorId: memberId },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          sectionId,
          title: "Archived",
          creatorId: memberId,
          state: "ARCHIVED",
        },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      const section = data!.sections.find((s) => s.id === sectionId);
      assert.ok(section);
      assert.deepEqual(
        section!.items.map((item) => item.title),
        ["In a Section"],
        "Archived Items are excluded from the default List view (#38 owns the Archived toggle)"
      );
      assert.deepEqual(
        data!.unsectionedItems.map((item) => item.title),
        ["No Section"]
      );
      assert.deepEqual(
        data!.archivedItems.map((item) => item.title),
        ["Archived"],
        "the Archived toggle's data source includes Items excluded from Sections/unsectionedItems"
      );
    }

    // archivedItems sorts most-recently-updated first, and stays out of
    // boardColumns too (#38 covers both the List and Board toggle).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Archived Earlier",
          creatorId: memberId,
          state: "ARCHIVED",
          updatedAt: new Date("2026-09-01T00:00:00.000Z"),
        },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Archived Later",
          creatorId: memberId,
          state: "ARCHIVED",
          updatedAt: new Date("2026-09-10T00:00:00.000Z"),
        },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      assert.deepEqual(
        data!.archivedItems.map((item) => item.title),
        ["Archived Later", "Archived Earlier"]
      );
      assert.deepEqual(
        data!.boardColumns.flatMap((column) => column.items.map((item) => item.title)),
        [],
        "archived Items don't appear in any Board column"
      );
    }

    // eligibleMembers lists Workspace Members who hold no List-level role
    // yet (the add-Member/Viewer candidate pool for #28), excluding anyone
    // who already does.
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const leadId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: leadId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: leadId, role: "LEAD" },
      });
      const candidateId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: candidateId, role: "MEMBER" },
      });

      const data = await loadListPageData(prisma, { userId: leadId, workspaceId, listId });

      assert.ok(data);
      assert.deepEqual(data!.eligibleMembers, [{ userId: candidateId, name: "Test User" }]);
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

    // Board view returns the correct Items grouped by the List's Board
    // grouping, for a given User's effective access (#31).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      await prisma.item.create({
        data: { id: randomUUID(), listId, title: "To Do Item", creatorId: memberId, state: "TO_DO" },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Blocked Item",
          creatorId: memberId,
          state: "BLOCKED",
          blockerReason: "Stuck",
        },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      assert.equal(data!.boardGroupBy, "STATE", "STATE is the Board's default grouping");
      const columnKeys = data!.boardColumns.map((c) => c.key);
      assert.deepEqual(columnKeys, ["TO_DO", "IN_PROGRESS", "BLOCKED", "COMPLETE"]);
      assert.deepEqual(
        data!.boardColumns.find((c) => c.key === "TO_DO")!.items.map((i) => i.title),
        ["To Do Item"]
      );
      assert.deepEqual(
        data!.boardColumns.find((c) => c.key === "BLOCKED")!.items.map((i) => i.title),
        ["Blocked Item"]
      );
    }

    // Timeline view returns only Items with a due date, sorted
    // earliest-due-first, with their start date carried through where
    // present, for a given User's effective access (#33).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Later, With Start",
          creatorId: memberId,
          startDate: new Date("2026-10-10T00:00:00.000Z"),
          dueDate: new Date("2026-10-20T00:00:00.000Z"),
        },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Earlier, No Start",
          creatorId: memberId,
          dueDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      });
      await prisma.item.create({
        data: { id: randomUUID(), listId, title: "No Due Date", creatorId: memberId },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Archived, Has Due Date",
          creatorId: memberId,
          state: "ARCHIVED",
          dueDate: new Date("2026-10-05T00:00:00.000Z"),
        },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      assert.deepEqual(
        data!.timelineItems.map((item) => item.title),
        ["Earlier, No Start", "Later, With Start"],
        "Items with no due date and Archived Items are excluded; the rest sort earliest-due-first"
      );
      const withStart = data!.timelineItems.find((item) => item.title === "Later, With Start")!;
      assert.equal(withStart.startDate?.toISOString(), "2026-10-10T00:00:00.000Z");
      const withoutStart = data!.timelineItems.find((item) => item.title === "Earlier, No Start")!;
      assert.equal(withoutStart.startDate, null);
    }

    // A List Viewer has read access to Timeline data too — Timeline is a
    // read-only view, so >=READ is sufficient (no separate manage-gate).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const viewerId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: viewerId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: viewerId, role: "VIEWER" },
      });
      await prisma.item.create({
        data: {
          id: randomUUID(),
          listId,
          title: "Visible to Viewer",
          creatorId: viewerId,
          dueDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      });

      const data = await loadListPageData(prisma, { userId: viewerId, workspaceId, listId });

      assert.ok(data);
      assert.deepEqual(
        data!.timelineItems.map((item) => item.title),
        ["Visible to Viewer"]
      );
    }

    // Files view aggregates Attachments across every Item in the List,
    // newest first, without needing to open each Item (#22).
    {
      const { workspaceId, listId } = await createWorkspaceWithList();
      const memberId = await createUser();
      await prisma.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: memberId, role: "MEMBER" },
      });
      await prisma.listMember.create({
        data: { id: randomUUID(), listId, userId: memberId, role: "MEMBER" },
      });
      const itemA = await prisma.item.create({
        data: { id: randomUUID(), listId, title: "Item A", creatorId: memberId },
      });
      const itemB = await prisma.item.create({
        data: { id: randomUUID(), listId, title: "Item B", creatorId: memberId },
      });
      await prisma.attachment.create({
        data: {
          id: randomUUID(),
          itemId: itemA.id,
          uploaderId: memberId,
          fileName: "older.pdf",
          contentType: "application/pdf",
          sizeBytes: 100,
          storageKey: `items/${itemA.id}/${randomUUID()}-older.pdf`,
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
        },
      });
      await prisma.attachment.create({
        data: {
          id: randomUUID(),
          itemId: itemB.id,
          uploaderId: memberId,
          fileName: "newer.zip",
          contentType: "application/zip",
          sizeBytes: 200,
          storageKey: `items/${itemB.id}/${randomUUID()}-newer.zip`,
          createdAt: new Date("2026-09-10T00:00:00.000Z"),
        },
      });

      const data = await loadListPageData(prisma, { userId: memberId, workspaceId, listId });

      assert.ok(data);
      assert.deepEqual(
        data!.filesViewEntries.map((entry) => [entry.fileName, entry.itemTitle]),
        [
          ["newer.zip", "Item B"],
          ["older.pdf", "Item A"],
        ]
      );
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
