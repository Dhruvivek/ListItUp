import type { PrismaClient } from "@/generated/prisma/client";
import {
  type ActivityCategory,
  type ActivityNotification,
  countUnreadNotifications,
  loadActivityNotifications,
} from "@/lib/notification/notification-inbox";

export type UpdatesPageData = {
  notifications: ActivityNotification[];
  unreadCount: number;
  category: ActivityCategory | null;
};

// Kept separate from the page component (same rationale as My Tasks' and
// the List page's page-data.ts): a real Next.js request scope isn't
// available under plain tsx, so session lookup stays in page.tsx while
// everything testable lives here on an injected PrismaClient.
export async function loadUpdatesPageData(
  database: PrismaClient,
  input: { userId: string; category?: ActivityCategory }
): Promise<UpdatesPageData> {
  const [notifications, unreadCount] = await Promise.all([
    loadActivityNotifications(database, { recipientId: input.userId, category: input.category }),
    countUnreadNotifications(database, input.userId),
  ]);

  return { notifications, unreadCount, category: input.category ?? null };
}
