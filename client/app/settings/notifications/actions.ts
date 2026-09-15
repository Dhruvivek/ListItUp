"use server";

import { revalidatePath } from "next/cache";

import {
  PREFERENCE_CATEGORIES,
  setCategoryMuted,
} from "@/lib/notification/notification-preferences";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

const NOTIFICATIONS_SETTINGS_PATH = "/settings/notifications";

export type UpdateNotificationPreferencesState =
  { status: "idle" } | { status: "success" };

// A checked checkbox submits its value; an unchecked one is simply absent
// from formData — so "enabled" for a category is exactly "its field is
// present", matching how HTML checkbox forms work rather than needing a
// hidden companion input per toggle.
export async function updateNotificationPreferencesAction(
  _prevState: UpdateNotificationPreferencesState,
  formData: FormData
): Promise<UpdateNotificationPreferencesState> {
  const session = await requireAuthenticatedSession(
    NOTIFICATIONS_SETTINGS_PATH
  );

  await Promise.all(
    PREFERENCE_CATEGORIES.map((category) => {
      const enabled = formData.get(category) !== null;
      return setCategoryMuted(prisma, {
        userId: session.user.id,
        category,
        muted: !enabled,
      });
    })
  );

  revalidatePath(NOTIFICATIONS_SETTINGS_PATH);

  return { status: "success" };
}
