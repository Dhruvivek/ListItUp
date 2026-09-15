"use server";

import { redirect } from "next/navigation";

import { markNotificationRead } from "@/lib/notification/notification-inbox";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

const UPDATES_PATH = "/updates";

// Opening a notification marks it read, then sends the User to the Item it
// refers to — the badge's unread count is derived fresh on next render, so
// no separate revalidation call is needed once redirect() navigates away.
export async function openNotificationAction(notificationId: string, itemHref: string): Promise<void> {
  const session = await requireAuthenticatedSession(UPDATES_PATH);
  await markNotificationRead(prisma, { notificationId, recipientId: session.user.id });
  redirect(itemHref);
}
