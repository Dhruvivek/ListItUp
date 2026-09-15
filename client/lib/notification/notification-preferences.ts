import { randomUUID } from "node:crypto";

import type { NotificationType, PrismaClient } from "@/generated/prisma/client";

export type PreferenceCategory =
  "assignee" | "noteOrMention" | "state" | "dueDateReminder";

// Groups NotificationType values the way the Manage Notifications page
// (#48) presents them — coarser than notification-inbox.ts's
// ACTIVITY_CATEGORY_TYPES, whose grouping serves the Activity tab's filter
// instead. Every NotificationType appears in exactly one category here.
export const PREFERENCE_CATEGORY_TYPES: Record<
  PreferenceCategory,
  NotificationType[]
> = {
  assignee: ["ASSIGNEE_ADDED", "ASSIGNEE_REMOVED"],
  noteOrMention: ["NOTE_ADDED", "MENTIONED"],
  state: ["STATE_CHANGED"],
  dueDateReminder: ["DUE_DATE_REMINDER"],
};

export const PREFERENCE_CATEGORIES = Object.keys(
  PREFERENCE_CATEGORY_TYPES
) as PreferenceCategory[];

// Excludes a recipient set down to the Users who have NOT muted `type` —
// called from notification-triggers.ts at trigger time (not just read
// time), so a disabled NotificationType produces no notification row at
// all, per #48's acceptance criteria.
export async function excludingMutedRecipients(
  database: PrismaClient,
  input: { recipientIds: string[]; type: NotificationType }
): Promise<string[]> {
  if (input.recipientIds.length === 0) {
    return [];
  }

  const muted = await database.mutedNotificationType.findMany({
    where: { userId: { in: input.recipientIds }, type: input.type },
    select: { userId: true },
  });
  const mutedUserIds = new Set(muted.map((row) => row.userId));

  return input.recipientIds.filter((userId) => !mutedUserIds.has(userId));
}

// One toggle in the UI controls every NotificationType in its category
// together, so muting/unmuting always operates on the whole category.
export async function setCategoryMuted(
  database: PrismaClient,
  input: { userId: string; category: PreferenceCategory; muted: boolean }
): Promise<void> {
  const types = PREFERENCE_CATEGORY_TYPES[input.category];

  if (input.muted) {
    await database.$transaction(
      types.map((type) =>
        database.mutedNotificationType.upsert({
          where: { userId_type: { userId: input.userId, type } },
          create: { id: randomUUID(), userId: input.userId, type },
          update: {},
        })
      )
    );
    return;
  }

  await database.mutedNotificationType.deleteMany({
    where: { userId: input.userId, type: { in: types } },
  });
}

// Reads back which categories are currently muted, for rendering the
// preferences page's toggle states. A category counts as muted only when
// every one of its NotificationTypes is muted — matches setCategoryMuted's
// all-or-nothing write, so a toggle never needs to represent a state
// between "on" and "off".
export async function loadMutedCategories(
  database: PrismaClient,
  userId: string
): Promise<Record<PreferenceCategory, boolean>> {
  const muted = await database.mutedNotificationType.findMany({
    where: { userId },
    select: { type: true },
  });
  const mutedTypes = new Set(muted.map((row) => row.type));

  return Object.fromEntries(
    PREFERENCE_CATEGORIES.map((category) => [
      category,
      PREFERENCE_CATEGORY_TYPES[category].every((type) => mutedTypes.has(type)),
    ])
  ) as Record<PreferenceCategory, boolean>;
}
