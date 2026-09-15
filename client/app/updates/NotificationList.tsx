import { Archive, Bookmark } from "lucide-react";

import type { ActivityNotification } from "@/lib/notification/notification-inbox";
import { describeNotification } from "@/lib/notification/notification-inbox";

function formatNotificationTimestamp(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationRow({
  notification,
  boundOpen,
  boundToggleBookmark,
  boundArchive,
}: {
  notification: ActivityNotification;
  boundOpen: () => Promise<void>;
  boundToggleBookmark: () => Promise<void>;
  boundArchive: () => Promise<void>;
}) {
  return (
    <div className="flex items-start gap-1 rounded-md px-1 py-1 hover:bg-[#141414]">
      <form action={boundOpen} className="min-w-0 flex-1">
        <button type="submit" className="flex w-full items-start gap-3 rounded-md px-2 py-1.5 text-left text-sm">
          <span
            className={
              notification.isUnread
                ? "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#ff6b4a]"
                : "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-transparent"
            }
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className={notification.isUnread ? "text-neutral-100" : "text-neutral-400"}>
              {describeNotification(notification)}{" "}
            </span>
            <span className={notification.isUnread ? "font-medium text-white" : "font-medium text-neutral-300"}>
              {notification.itemTitle}
            </span>
          </span>
          <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
            {formatNotificationTimestamp(notification.createdAt)}
          </span>
        </button>
      </form>

      <form action={boundToggleBookmark}>
        <button
          type="submit"
          aria-label={notification.isBookmarked ? "Remove bookmark" : "Bookmark"}
          className="flex-shrink-0 rounded-md p-1.5 hover:bg-[#1a1a1a]"
        >
          <Bookmark
            className={notification.isBookmarked ? "h-3.5 w-3.5 fill-[#ff6b4a] text-[#ff6b4a]" : "h-3.5 w-3.5 text-neutral-600"}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>
      </form>

      {!notification.isArchived && (
        <form action={boundArchive}>
          <button
            type="submit"
            aria-label="Archive"
            className="flex-shrink-0 rounded-md p-1.5 hover:bg-[#1a1a1a]"
          >
            <Archive className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}

export function NotificationList({
  notifications,
  emptyMessage,
  boundOpen,
  boundToggleBookmark,
  boundArchive,
}: {
  notifications: ActivityNotification[];
  emptyMessage: string;
  boundOpen: (notificationId: string, itemHref: string) => () => Promise<void>;
  boundToggleBookmark: (notificationId: string) => () => Promise<void>;
  boundArchive: (notificationId: string) => () => Promise<void>;
}) {
  if (notifications.length === 0) {
    return <p className="mt-6 text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 flex flex-col divide-y divide-[#1a1a1a]">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          boundOpen={boundOpen(notification.id, notification.itemHref)}
          boundToggleBookmark={boundToggleBookmark(notification.id)}
          boundArchive={boundArchive(notification.id)}
        />
      ))}
    </div>
  );
}
