import { Settings } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";
import type { ActivityCategory } from "@/lib/notification/notification-inbox";

import { NotificationList } from "./NotificationList";
import { archiveNotificationAction, openNotificationAction, toggleBookmarkAction } from "./actions";
import { loadUpdatesPageData, type UpdatesTab } from "./page-data";

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  assignee: "Assignee",
  notes: "Notes",
  mentions: "Mentions",
  state: "State",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ActivityCategory[];

function isActivityCategory(
  value: string | undefined
): value is ActivityCategory {
  return value !== undefined && (CATEGORIES as string[]).includes(value);
}

const TABS: { key: UpdatesTab; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "bookmarks", label: "Bookmarks" },
  { key: "archive", label: "Archive" },
  { key: "mentioned", label: "@Mentioned" },
];

const TAB_KEYS: readonly string[] = TABS.map((tab) => tab.key);

function isTabKey(value: string): value is UpdatesTab {
  return TAB_KEYS.includes(value);
}

const EMPTY_MESSAGE: Record<UpdatesTab, string> = {
  activity: "Nothing here yet.",
  bookmarks: "You haven't bookmarked anything yet.",
  archive: "Nothing archived yet.",
  mentioned: "No mentions yet.",
};

type Query = { tab?: string; category?: string };

type Props = {
  searchParams: Promise<Query>;
};

function updatesHref(query: Query): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "activity") params.set("tab", query.tab);
  if (query.category) params.set("category", query.category);
  const search = params.toString();
  return search ? `/updates?${search}` : "/updates";
}

export default async function UpdatesPage({ searchParams }: Props) {
  const session = await requireAuthenticatedSession("/updates");
  const query = await searchParams;
  const tab: UpdatesTab = query.tab && isTabKey(query.tab) ? query.tab : "activity";
  const category = tab === "activity" && isActivityCategory(query.category) ? query.category : undefined;

  const data = await loadUpdatesPageData(prisma, { userId: session.user.id, tab, category });

  const boundOpen = (notificationId: string, itemHref: string) =>
    openNotificationAction.bind(null, notificationId, itemHref);
  const boundToggleBookmark = (notificationId: string) => toggleBookmarkAction.bind(null, notificationId);
  const boundArchive = (notificationId: string) => archiveNotificationAction.bind(null, notificationId);

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="h-px w-14 bg-[#ff6b4a]" />
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
              {"// Updates"}
            </span>
          </div>
          <a
            href="/settings/notifications"
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300"
          >
            <Settings
              className="h-3.5 w-3.5"
              strokeWidth={1.7}
              aria-hidden="true"
            />
            Manage Notifications
          </a>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-light text-white">Updates</h1>
          {data.unreadCount > 0 && (
            <span className="rounded-full bg-[#ff6b4a] px-2 py-0.5 text-xs font-medium text-[#1a0a05]">
              {data.unreadCount} unread
            </span>
          )}
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
          Assignee changes, Notes, state changes, and Mentions that affect you,
          newest first.
        </p>

        <nav className="mt-6 flex flex-wrap items-center gap-6 border-b border-neutral-800 text-sm">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={updatesHref({ tab: t.key === "activity" ? undefined : t.key })}
              className={
                tab === t.key
                  ? "border-b-2 border-[#ff6b4a] pb-3 text-white"
                  : "pb-3 text-neutral-500 hover:text-neutral-300"
              }
            >
              {t.label}
            </a>
          ))}
        </nav>

        {tab === "activity" && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              href={updatesHref({})}
              className={
                !category
                  ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                  : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
              }
            >
              All
            </a>
            {CATEGORIES.map((c) => (
              <a
                key={c}
                href={updatesHref({ category: c })}
                className={
                  category === c
                    ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                    : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                }
              >
                {CATEGORY_LABEL[c]}
              </a>
            ))}
          </div>
        )}

        <NotificationList
          notifications={data.notifications}
          emptyMessage={EMPTY_MESSAGE[tab]}
          boundOpen={boundOpen}
          boundToggleBookmark={boundToggleBookmark}
          boundArchive={boundArchive}
        />
      </div>
    </main>
  );
}
