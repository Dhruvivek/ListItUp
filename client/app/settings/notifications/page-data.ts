import type { PrismaClient } from "@/generated/prisma/client";
import {
  loadMutedCategories,
  type PreferenceCategory,
} from "@/lib/notification/notification-preferences";

export type NotificationsPreferencesPageData = {
  enabledByCategory: Record<PreferenceCategory, boolean>;
};

// Kept separate from the page component (same rationale as Profile's and
// Updates' page-data.ts): session lookup needs a real Next.js request
// scope, so it stays in page.tsx while everything testable here takes an
// injected PrismaClient.
export async function loadNotificationsPreferencesPageData(
  database: PrismaClient,
  userId: string
): Promise<NotificationsPreferencesPageData> {
  const mutedByCategory = await loadMutedCategories(database, userId);

  const enabledByCategory = Object.fromEntries(
    Object.entries(mutedByCategory).map(([category, muted]) => [
      category,
      !muted,
    ])
  ) as Record<PreferenceCategory, boolean>;

  return { enabledByCategory };
}
