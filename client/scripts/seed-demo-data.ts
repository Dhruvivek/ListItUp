// One-off demo-data seed for showing off the frontend against a real
// account. Idempotent at the workspace level: if the target User already
// owns a Workspace named DEMO_WORKSPACE_NAME, the script assumes it already
// seeded and exits without creating duplicates.
//
// Usage: pnpm exec tsx scripts/seed-demo-data.ts <email>

import { randomUUID } from "node:crypto";

const DEMO_WORKSPACE_NAME = "Product Launch";
const DEMO_LIST_2_NAME = "Q1 Marketing Plan";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm exec tsx scripts/seed-demo-data.ts <email>");
    process.exit(1);
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("@/generated/prisma/client"),
  ]);
  const database = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const owner = await database.user.findUnique({ where: { email } });
    if (!owner) {
      console.error(`No User found with email ${email} — sign up/verify that account first.`);
      process.exit(1);
    }

    const alreadySeeded = await database.workspace.findFirst({
      where: { name: DEMO_WORKSPACE_NAME, members: { some: { userId: owner.id } } },
    });
    if (alreadySeeded) {
      console.log(`"${DEMO_WORKSPACE_NAME}" already exists for ${email} — skipping, nothing to do.`);
      return;
    }

    const maya = await database.user.upsert({
      where: { email: "maya.chen@example.com" },
      update: {},
      create: {
        id: randomUUID(),
        name: "Maya Chen",
        email: "maya.chen@example.com",
        emailVerified: true,
      },
    });
    const owen = await database.user.upsert({
      where: { email: "owen.park@example.com" },
      update: {},
      create: {
        id: randomUUID(),
        name: "Owen Park",
        email: "owen.park@example.com",
        emailVerified: true,
      },
    });

    const workspace = await database.workspace.create({
      data: {
        id: randomUUID(),
        name: DEMO_WORKSPACE_NAME,
        kind: "SHARED",
        members: {
          create: [
            { id: randomUUID(), userId: owner.id, role: "OWNER" },
            { id: randomUUID(), userId: maya.id, role: "MEMBER" },
            { id: randomUUID(), userId: owen.id, role: "MEMBER" },
          ],
        },
        labels: {
          create: [
            { id: randomUUID(), name: "Design" },
            { id: randomUUID(), name: "Backend" },
          ],
        },
      },
      include: { labels: true },
    });
    const designLabel = workspace.labels.find((label) => label.name === "Design")!;
    const backendLabel = workspace.labels.find((label) => label.name === "Backend")!;

    const websiteRelaunch = await database.list.create({
      data: {
        id: randomUUID(),
        workspaceId: workspace.id,
        name: "Website Relaunch",
        members: { create: [{ id: randomUUID(), userId: owner.id, role: "LEAD" }] },
        sections: {
          create: [
            { id: randomUUID(), name: "Backlog", order: 0 },
            { id: randomUUID(), name: "In Progress", order: 1 },
            { id: randomUUID(), name: "Done", order: 2 },
          ],
        },
      },
      include: { sections: true },
    });
    const backlog = websiteRelaunch.sections.find((s) => s.name === "Backlog")!;
    const inProgress = websiteRelaunch.sections.find((s) => s.name === "In Progress")!;
    const done = websiteRelaunch.sections.find((s) => s.name === "Done")!;

    const marketingPlan = await database.list.create({
      data: {
        id: randomUUID(),
        workspaceId: workspace.id,
        name: DEMO_LIST_2_NAME,
        members: { create: [{ id: randomUUID(), userId: owner.id, role: "LEAD" }] },
        sections: {
          create: [
            { id: randomUUID(), name: "Ideas", order: 0 },
            { id: randomUUID(), name: "Scheduled", order: 1 },
          ],
        },
      },
      include: { sections: true },
    });
    const ideas = marketingPlan.sections.find((s) => s.name === "Ideas")!;
    const scheduled = marketingPlan.sections.find((s) => s.name === "Scheduled")!;

    const personalInbox = await database.list.findFirst({
      where: { isInbox: true, workspace: { kind: "PERSONAL", members: { some: { userId: owner.id } } } },
    });

    await database.item.createMany({
      data: [
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: backlog.id,
          title: "Rewrite homepage hero copy",
          state: "TO_DO",
          priority: "HIGH",
          dueDate: daysFromNow(-2),
          creatorId: maya.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: backlog.id,
          title: "Audit Lighthouse performance score",
          state: "TO_DO",
          priority: "NORMAL",
          dueDate: daysFromNow(3),
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: backlog.id,
          title: "Draft launch announcement email",
          state: "TO_DO",
          priority: "NORMAL",
          dueDate: daysFromNow(4),
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: backlog.id,
          title: "Spike: evaluate Contentful",
          state: "ARCHIVED",
          stateBeforeArchive: "TO_DO",
          priority: "LOW",
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: inProgress.id,
          title: "Migrate blog to new CMS",
          state: "IN_PROGRESS",
          priority: "NORMAL",
          dueDate: daysFromNow(7),
          creatorId: owen.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: inProgress.id,
          title: "Fix mobile nav overlap",
          state: "BLOCKED",
          blockerReason: "Waiting on design tokens from Maya",
          priority: "HIGH",
          dueDate: daysFromNow(1),
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: websiteRelaunch.id,
          sectionId: done.id,
          title: "Ship pricing page redesign",
          state: "COMPLETE",
          priority: "NORMAL",
          dueDate: daysFromNow(-5),
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: marketingPlan.id,
          sectionId: ideas.id,
          title: "Plan social teaser campaign",
          state: "TO_DO",
          priority: "LOW",
          dueDate: daysFromNow(10),
          creatorId: owner.id,
        },
        {
          id: randomUUID(),
          listId: marketingPlan.id,
          sectionId: scheduled.id,
          title: "Book podcast guest spot",
          state: "TO_DO",
          priority: "LOW",
          creatorId: owen.id,
        },
      ],
    });

    if (personalInbox) {
      await database.item.createMany({
        data: [
          {
            id: randomUUID(),
            listId: personalInbox.id,
            title: "Renew passport",
            state: "TO_DO",
            priority: "HIGH",
            dueDate: daysFromNow(14),
            creatorId: owner.id,
          },
          {
            id: randomUUID(),
            listId: personalInbox.id,
            title: "Read \"Deep Work\"",
            state: "TO_DO",
            priority: "LOW",
            creatorId: owner.id,
          },
        ],
      });
    } else {
      console.warn(`No Personal Space Inbox found for ${email} — skipped the two Personal Space items.`);
    }

    const allItems = await database.item.findMany({
      where: { listId: { in: [websiteRelaunch.id, marketingPlan.id, personalInbox?.id ?? ""] } },
      select: { id: true, title: true, listId: true, creatorId: true },
    });
    const byTitle = (title: string) => allItems.find((item) => item.title === title)!;

    // Everything defaults to assigned-to-owner except the two items given
    // to a teammate below, which exercise Home's "Items I've Assigned" widget.
    const assignToOwen = new Set(["Plan social teaser campaign"]);
    const assignToMaya = new Set(["Draft launch announcement email"]);

    await database.itemAssignee.createMany({
      data: allItems.map((item) => ({
        id: randomUUID(),
        itemId: item.id,
        userId: assignToOwen.has(item.title) ? owen.id : assignToMaya.has(item.title) ? maya.id : owner.id,
      })),
    });

    await database.itemLabel.createMany({
      data: [
        { id: randomUUID(), itemId: byTitle("Rewrite homepage hero copy").id, labelId: designLabel.id },
        { id: randomUUID(), itemId: byTitle("Fix mobile nav overlap").id, labelId: designLabel.id },
        { id: randomUUID(), itemId: byTitle("Migrate blog to new CMS").id, labelId: backendLabel.id },
      ],
    });

    console.log(`Seeded "${DEMO_WORKSPACE_NAME}" (2 Lists, ${allItems.length} Items) for ${email}.`);
  } finally {
    await database.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
