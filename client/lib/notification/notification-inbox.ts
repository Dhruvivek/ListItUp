import type { NotificationType, PrismaClient } from "@/generated/prisma/client";

// The Activity tab's explicit scope (#47): Assignee changes, Notes, Item
// state changes, and Mentions. DUE_DATE_REMINDER is a system-triggered
// reminder rather than a change another person made, and is deliberately
// left out of this list — it still counts toward the unread badge below,
// since the badge represents "does anything need my attention" rather than
// "is it in this particular tab" (#41's due-date reminder has no actor to
// attribute a feed entry to).
export type ActivityCategory = "assignee" | "notes" | "mentions" | "state";

export const ACTIVITY_CATEGORY_TYPES: Record<ActivityCategory, NotificationType[]> = {
  assignee: ["ASSIGNEE_ADDED", "ASSIGNEE_REMOVED"],
  notes: ["NOTE_ADDED"],
  mentions: ["MENTIONED"],
  state: ["STATE_CHANGED"],
};

export const ACTIVITY_TYPES: NotificationType[] = Object.values(ACTIVITY_CATEGORY_TYPES).flat();

export type ActivityNotification = {
  id: string;
  type: NotificationType;
  createdAt: Date;
  isUnread: boolean;
  actorName: string | null;
  itemId: string;
  itemTitle: string;
  itemHref: string;
};

const DESCRIPTION_BY_TYPE: Record<NotificationType, (actorName: string) => string> = {
  ASSIGNEE_ADDED: (actorName) => `${actorName} assigned you to`,
  ASSIGNEE_REMOVED: (actorName) => `${actorName} removed you from`,
  NOTE_ADDED: (actorName) => `${actorName} added a note on`,
  MENTIONED: (actorName) => `${actorName} mentioned you on`,
  STATE_CHANGED: (actorName) => `${actorName} changed the state of`,
  DUE_DATE_REMINDER: () => "Due date approaching for",
};

// Pure formatting, split out from the query below so it's unit-testable
// without a Prisma client.
export function describeNotification(notification: {
  type: NotificationType;
  actorName: string | null;
}): string {
  return DESCRIPTION_BY_TYPE[notification.type](notification.actorName ?? "Someone");
}

function itemHref(item: { id: string; list: { id: string; workspaceId: string } }): string {
  return `/workspaces/${item.list.workspaceId}/lists/${item.list.id}/items/${item.id}`;
}

// Reads are scoped by recipientId directly — a Notification row is already
// access-controlled at creation time (see notification-triggers.ts), so
// there's no separate lib/permissions/ check on the read path, matching
// lib/item/item-my-tasks.ts's userId-scoped read pattern.
export async function loadActivityNotifications(
  database: PrismaClient,
  input: { recipientId: string; category?: ActivityCategory }
): Promise<ActivityNotification[]> {
  const types = input.category ? ACTIVITY_CATEGORY_TYPES[input.category] : ACTIVITY_TYPES;

  const notifications = await database.notification.findMany({
    where: { recipientId: input.recipientId, type: { in: types }, archivedAt: null },
    include: {
      actor: { select: { name: true } },
      item: { select: { id: true, title: true, list: { select: { id: true, workspaceId: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    createdAt: notification.createdAt,
    isUnread: notification.readAt === null,
    actorName: notification.actor?.name ?? null,
    itemId: notification.item.id,
    itemTitle: notification.item.title,
    itemHref: itemHref(notification.item),
  }));
}

// Counts every unread, non-archived Notification regardless of type —
// including DUE_DATE_REMINDER, which the Activity tab above doesn't list —
// so the nav badge reflects the User's full unread count, not just what
// this ticket's tab happens to render (#47).
export async function countUnreadNotifications(database: PrismaClient, recipientId: string): Promise<number> {
  return database.notification.count({ where: { recipientId, readAt: null, archivedAt: null } });
}

// Scoped to recipientId so a User can only ever mark their own
// notifications read; a no-op (not an error) if already read or the id
// doesn't belong to this recipient, keeping this action idempotent.
export async function markNotificationRead(
  database: PrismaClient,
  input: { notificationId: string; recipientId: string }
): Promise<void> {
  await database.notification.updateMany({
    where: { id: input.notificationId, recipientId: input.recipientId, readAt: null },
    data: { readAt: new Date() },
  });
}
