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
}: {
  notification: ActivityNotification;
  boundOpen: () => Promise<void>;
}) {
  return (
    <form action={boundOpen}>
      <button
        type="submit"
        className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-[#141414]"
      >
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
  );
}

export function ActivityList({
  notifications,
  boundOpen,
}: {
  notifications: ActivityNotification[];
  boundOpen: (notificationId: string, itemHref: string) => () => Promise<void>;
}) {
  if (notifications.length === 0) {
    return <p className="mt-6 text-sm text-neutral-600">Nothing here yet.</p>;
  }

  return (
    <div className="mt-4 flex flex-col divide-y divide-[#1a1a1a]">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          boundOpen={boundOpen(notification.id, notification.itemHref)}
        />
      ))}
    </div>
  );
}
