import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  excludingMutedRecipients,
  loadMutedCategories,
  PREFERENCE_CATEGORIES,
  setCategoryMuted,
} from "./notification-preferences";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log(
      "notification preferences integration test skipped: DATABASE_URL is not set"
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

  async function createUser(): Promise<string> {
    const userId = randomUUID();
    createdUserIds.push(userId);
    await prisma.user.create({
      data: {
        id: userId,
        name: "Test User",
        email: `notification-pref-${userId}@example.test`,
      },
    });
    return userId;
  }

  try {
    // Every category starts unmuted — a User with no MutedNotificationType
    // rows sees every toggle as on.
    {
      const userId = await createUser();
      const categories = await loadMutedCategories(prisma, userId);
      for (const category of PREFERENCE_CATEGORIES) {
        assert.equal(
          categories[category],
          false,
          `${category} must default to unmuted`
        );
      }
    }

    // Muting a category mutes every NotificationType it groups (noteOrMention
    // covers both NOTE_ADDED and MENTIONED), and only that category.
    {
      const userId = await createUser();
      await setCategoryMuted(prisma, {
        userId,
        category: "noteOrMention",
        muted: true,
      });

      const categories = await loadMutedCategories(prisma, userId);
      assert.equal(categories.noteOrMention, true);
      assert.equal(
        categories.assignee,
        false,
        "muting one category must not affect another"
      );

      const noteRecipients = await excludingMutedRecipients(prisma, {
        recipientIds: [userId],
        type: "NOTE_ADDED",
      });
      assert.deepEqual(noteRecipients, []);
      const mentionRecipients = await excludingMutedRecipients(prisma, {
        recipientIds: [userId],
        type: "MENTIONED",
      });
      assert.deepEqual(mentionRecipients, []);

      const assigneeRecipients = await excludingMutedRecipients(prisma, {
        recipientIds: [userId],
        type: "ASSIGNEE_ADDED",
      });
      assert.deepEqual(
        assigneeRecipients,
        [userId],
        "an un-muted type must still pass the recipient through"
      );
    }

    // Unmuting a category clears its rows and is idempotent to call when
    // already unmuted.
    {
      const userId = await createUser();
      await setCategoryMuted(prisma, {
        userId,
        category: "state",
        muted: true,
      });
      await setCategoryMuted(prisma, {
        userId,
        category: "state",
        muted: false,
      });
      await setCategoryMuted(prisma, {
        userId,
        category: "state",
        muted: false,
      });

      const categories = await loadMutedCategories(prisma, userId);
      assert.equal(categories.state, false);
      const recipients = await excludingMutedRecipients(prisma, {
        recipientIds: [userId],
        type: "STATE_CHANGED",
      });
      assert.deepEqual(recipients, [userId]);
    }

    // Muting the same category twice is idempotent (no unique-constraint
    // error from the upsert).
    {
      const userId = await createUser();
      await setCategoryMuted(prisma, {
        userId,
        category: "dueDateReminder",
        muted: true,
      });
      await setCategoryMuted(prisma, {
        userId,
        category: "dueDateReminder",
        muted: true,
      });

      const categories = await loadMutedCategories(prisma, userId);
      assert.equal(categories.dueDateReminder, true);
    }
  } finally {
    await prisma.mutedNotificationType.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("notification preferences integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
