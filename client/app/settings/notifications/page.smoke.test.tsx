import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { setCategoryMuted } from "@/lib/notification/notification-preferences";

import { loadNotificationsPreferencesPageData } from "./page-data";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log(
      "notifications settings page smoke test skipped: DATABASE_URL is not set"
    );
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

  try {
    // A signed-in User with no muted categories sees every toggle enabled.
    {
      const userId = randomUUID();
      createdUserIds.push(userId);
      await prisma.user.create({
        data: {
          id: userId,
          name: "Test User",
          email: `notifications-settings-${userId}@example.test`,
        },
      });

      const data = await loadNotificationsPreferencesPageData(prisma, userId);

      assert.equal(data.enabledByCategory.assignee, true);
      assert.equal(data.enabledByCategory.noteOrMention, true);
      assert.equal(data.enabledByCategory.state, true);
      assert.equal(data.enabledByCategory.dueDateReminder, true);
    }

    // A muted category renders as disabled; other categories stay enabled.
    {
      const userId = randomUUID();
      createdUserIds.push(userId);
      await prisma.user.create({
        data: {
          id: userId,
          name: "Test User",
          email: `notifications-settings-${userId}@example.test`,
        },
      });
      await setCategoryMuted(prisma, {
        userId,
        category: "dueDateReminder",
        muted: true,
      });

      const data = await loadNotificationsPreferencesPageData(prisma, userId);

      assert.equal(data.enabledByCategory.dueDateReminder, false);
      assert.equal(data.enabledByCategory.assignee, true);
    }
  } finally {
    await prisma.mutedNotificationType.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("notifications settings page smoke test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
