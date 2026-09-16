// Bootstraps a demo account and a rich demo workspace so a human can sign
// in and click through every wired screen (Home, My Tasks, List View, List
// Dashboard counts/breakdown, Updates' four tabs, Notification
// preferences) without creating any data by hand first.
//
// Idempotent at two levels: reuses an existing User for the given email
// instead of erroring, and skips workspace seeding entirely if the target
// User already owns a Workspace named DEMO_WORKSPACE_NAME.
//
// Usage: pnpm exec tsx scripts/seed-demo-data.ts <email> [password]
// Omit password to have one generated and printed at the end.

import { randomBytes, randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/auth-config";
import { provisionPersonalWorkspace } from "@/lib/workspace/workspace-provisioning";

const DEMO_WORKSPACE_NAME = "Product Launch";
const DEMO_LIST_2_NAME = "Q1 Marketing Plan";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: pnpm exec tsx scripts/seed-demo-data.ts <email> [password]");
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
    let owner = await database.user.findUnique({ where: { email } });
    let generatedPassword: string | null = null;

    if (!owner) {
      const suppliedPassword = process.argv[3];
      const password = suppliedPassword ?? generatePassword();
      if (password.length < MIN_PASSWORD_LENGTH) {
        console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        process.exit(1);
      }
      if (!suppliedPassword) {
        generatedPassword = password;
      }

      owner = await database.user.create({
        data: {
          id: randomUUID(),
          name: email.split("@")[0],
          email,
          emailVerified: true,
          accounts: {
            create: [
              {
                id: randomUUID(),
                accountId: randomUUID(),
                providerId: "credential",
                password: await hashPassword(password),
              },
            ],
          },
        },
      });

      await provisionPersonalWorkspace(database, owner.id);
      console.log(`Created account for ${email}.`);
    } else if (!owner.emailVerified) {
      owner = await database.user.update({ where: { id: owner.id }, data: { emailVerified: true } });
      await provisionPersonalWorkspace(database, owner.id);
    }

    const alreadySeeded = await database.workspace.findFirst({
      where: { name: DEMO_WORKSPACE_NAME, members: { some: { userId: owner.id } } },
    });
    if (alreadySeeded) {
      console.log(`"${DEMO_WORKSPACE_NAME}" already exists for ${email} — skipping, nothing to do.`);
      if (generatedPassword) {
        console.log(`Sign in with ${email} / ${generatedPassword}`);
      }
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
        members: {
          create: [
            { id: randomUUID(), userId: owner.id, role: "LEAD" },
            { id: randomUUID(), userId: maya.id, role: "MEMBER" },
            { id: randomUUID(), userId: owen.id, role: "MEMBER" },
          ],
        },
        sections: {
          create: [
            { id: randomUUID(), name: "Backlog", order: 0 },
            { id: randomUUID(), name: "In Progress", order: 1 },
            { id: randomUUID(), name: "Done", order: 2 },
          ],
        },
        customFieldDefinitions: {
          create: [
            { id: randomUUID(), name: "Effort (days)", type: "NUMBER" },
            { id: randomUUID(), name: "Target Env", type: "DROPDOWN", options: ["staging", "production"] },
          ],
        },
      },
      include: { sections: true, customFieldDefinitions: true },
    });
    const backlog = websiteRelaunch.sections.find((s) => s.name === "Backlog")!;
    const inProgress = websiteRelaunch.sections.find((s) => s.name === "In Progress")!;
    const done = websiteRelaunch.sections.find((s) => s.name === "Done")!;
    const effortField = websiteRelaunch.customFieldDefinitions.find((f) => f.name === "Effort (days)")!;
    const targetEnvField = websiteRelaunch.customFieldDefinitions.find((f) => f.name === "Target Env")!;

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
      select: { id: true, title: true, listId: true, creatorId: true, dueDate: true },
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

    // Item-detail-drawer facets (#34-#37): custom field values, a
    // cross-item dependency, a team Note with a @Mention, and a private
    // Personal Note — so List View's drawer has something in every tab.
    await database.customFieldValue.createMany({
      data: [
        {
          id: randomUUID(),
          itemId: byTitle("Migrate blog to new CMS").id,
          definitionId: effortField.id,
          value: "5",
        },
        {
          id: randomUUID(),
          itemId: byTitle("Fix mobile nav overlap").id,
          definitionId: targetEnvField.id,
          value: "staging",
        },
      ],
    });

    await database.itemDependency.create({
      data: {
        id: randomUUID(),
        blockerId: byTitle("Migrate blog to new CMS").id,
        blockedId: byTitle("Draft launch announcement email").id,
      },
    });

    const mentionNote = await database.note.create({
      data: {
        id: randomUUID(),
        itemId: byTitle("Fix mobile nav overlap").id,
        authorId: maya.id,
        body: `Pushed the updated design tokens — over to you @${owner.name} to wire them in.`,
      },
    });
    await database.mention.create({
      data: { id: randomUUID(), noteId: mentionNote.id, userId: owner.id },
    });
    await database.note.create({
      data: {
        id: randomUUID(),
        itemId: byTitle("Migrate blog to new CMS").id,
        authorId: owen.id,
        body: "Content migration is about 60% done — remaining posts need category remapping.",
      },
    });

    await database.personalNote.create({
      data: {
        id: randomUUID(),
        itemId: byTitle("Audit Lighthouse performance score").id,
        userId: owner.id,
        body: "Remember to check mobile Lighthouse scores separately from desktop.",
      },
    });

    await database.starred.create({
      data: { id: randomUUID(), listId: websiteRelaunch.id, userId: owner.id },
    });

    const blogMigrationNote = await database.note.findFirstOrThrow({
      where: { itemId: byTitle("Migrate blog to new CMS").id, authorId: owen.id },
    });
    const navOverlapItem = byTitle("Fix mobile nav overlap");

    // Updates surface (#41, #49): one Notification per tab this exercises —
    // an unread entry, a read one, a bookmark, an archived entry, and the
    // @Mentioned tab driven by the Note+Mention pair above.
    await database.notification.createMany({
      data: [
        {
          id: randomUUID(),
          recipientId: owner.id,
          type: "ASSIGNEE_ADDED",
          itemId: navOverlapItem.id,
          actorId: maya.id,
        },
        {
          id: randomUUID(),
          recipientId: owner.id,
          type: "STATE_CHANGED",
          itemId: byTitle("Migrate blog to new CMS").id,
          actorId: owen.id,
          readAt: daysFromNow(-1),
        },
        {
          id: randomUUID(),
          recipientId: owner.id,
          type: "NOTE_ADDED",
          itemId: byTitle("Migrate blog to new CMS").id,
          actorId: owen.id,
          noteId: blogMigrationNote.id,
          bookmarkedAt: daysFromNow(-1),
        },
        {
          id: randomUUID(),
          recipientId: owner.id,
          type: "MENTIONED",
          itemId: navOverlapItem.id,
          actorId: maya.id,
          noteId: mentionNote.id,
        },
        {
          id: randomUUID(),
          recipientId: owner.id,
          type: "DUE_DATE_REMINDER",
          itemId: navOverlapItem.id,
          dueDateAt: navOverlapItem.dueDate ?? undefined,
          readAt: daysFromNow(-2),
          archivedAt: daysFromNow(-1),
        },
      ],
    });

    // Manage Notifications preferences page: give it one non-default
    // toggle to display instead of every type reading as "on".
    await database.mutedNotificationType.create({
      data: { id: randomUUID(), userId: owner.id, type: "ASSIGNEE_REMOVED" },
    });

    console.log(`Seeded "${DEMO_WORKSPACE_NAME}" (2 Lists, ${allItems.length} Items) for ${email}.`);
    if (generatedPassword) {
      console.log(`Sign in with ${email} / ${generatedPassword}`);
    }
  } finally {
    await database.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
