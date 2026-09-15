import type { PrismaClient } from "@/generated/prisma/client";
import {
  type ActivityCategory,
  type ActivityNotification,
  countUnreadNotifications,
  loadActivityNotifications,
  loadArchivedNotifications,
  loadBookmarkedNotifications,
  loadMentionedNotifications,
} from "@/lib/notification/notification-inbox";

export type UpdatesTab = "activity" | "bookmarks" | "archive" | "mentioned";

export type UpdatesPageData = {
  tab: UpdatesTab;
  notifications: ActivityNotification[];
  unreadCount: number;
  category: ActivityCategory | null;
};

function loadNotificationsForTab(
  database: PrismaClient,
  input: { userId: string; tab: UpdatesTab; category?: ActivityCategory }
): Promise<ActivityNotification[]> {
  const recipientId = input.userId;
  switch (input.tab) {
    case "activity":
      return loadActivityNotifications(database, { recipientId, category: input.category });
    case "bookmarks":
      return loadBookmarkedNotifications(database, { recipientId });
    case "archive":
      return loadArchivedNotifications(database, { recipientId });
    case "mentioned":
      return loadMentionedNotifications(database, { recipientId });
  }
}

// Kept separate from the page component (same rationale as My Tasks' and
// the List page's page-data.ts): a real Next.js request scope isn't
// available under plain tsx, so session lookup stays in page.tsx while
// everything testable lives here on an injected PrismaClient.
export async function loadUpdatesPageData(
  database: PrismaClient,
  input: { userId: string; tab: UpdatesTab; category?: ActivityCategory }
): Promise<UpdatesPageData> {
  const [notifications, unreadCount] = await Promise.all([
    loadNotificationsForTab(database, input),
    countUnreadNotifications(database, input.userId),
  ]);

  return {
    tab: input.tab,
    notifications,
    unreadCount,
    category: input.tab === "activity" ? (input.category ?? null) : null,
  };
}
