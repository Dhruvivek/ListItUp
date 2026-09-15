import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";
import type { ActivityCategory } from "@/lib/notification/notification-inbox";

import { ActivityList } from "./ActivityList";
import { openNotificationAction } from "./actions";
import { loadUpdatesPageData } from "./page-data";

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  assignee: "Assignee",
  notes: "Notes",
  mentions: "Mentions",
  state: "State",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ActivityCategory[];

function isActivityCategory(value: string | undefined): value is ActivityCategory {
  return value !== undefined && (CATEGORIES as string[]).includes(value);
}

type Props = {
  searchParams: Promise<{ category?: string }>;
};

function updatesHref(category: ActivityCategory | null): string {
  return category ? `/updates?category=${category}` : "/updates";
}

export default async function UpdatesPage({ searchParams }: Props) {
  const session = await requireAuthenticatedSession("/updates");
  const query = await searchParams;
  const category = isActivityCategory(query.category) ? query.category : undefined;

  const data = await loadUpdatesPageData(prisma, { userId: session.user.id, category });

  const boundOpen = (notificationId: string, itemHref: string) =>
    openNotificationAction.bind(null, notificationId, itemHref);

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// Updates"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-light text-white">Activity</h1>
          {data.unreadCount > 0 && (
            <span className="rounded-full bg-[#ff6b4a] px-2 py-0.5 text-xs font-medium text-[#1a0a05]">
              {data.unreadCount} unread
            </span>
          )}
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
          Assignee changes, Notes, state changes, and Mentions that affect you, newest first.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href={updatesHref(null)}
            className={
              !data.category
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            All
          </a>
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href={updatesHref(c)}
              className={
                data.category === c
                  ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                  : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
              }
            >
              {CATEGORY_LABEL[c]}
            </a>
          ))}
        </div>

        <ActivityList notifications={data.notifications} boundOpen={boundOpen} />
      </div>
    </main>
  );
}
