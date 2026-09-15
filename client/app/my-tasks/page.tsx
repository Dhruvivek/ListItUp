import { addCalendarMonths, formatCalendarMonthParam, parseCalendarMonth } from "@/lib/item/item-my-tasks-calendar";
import type { MyTasksBoardGroupBy } from "@/lib/item/item-my-tasks-board";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { completeMyTaskItemAction, moveMyTaskItemAction, quickAddItemAction } from "./actions";
import { BoardView } from "./BoardView";
import { CalendarView } from "./CalendarView";
import { FilesView } from "./FilesView";
import { MyTasksList } from "./MyTasksList";
import { loadMyTasksPageData } from "./page-data";
import { QuickAddForm } from "./QuickAddForm";

type Query = {
  workspace?: string;
  completed?: string;
  archived?: string;
  tab?: string;
  groupBy?: string;
  month?: string;
};

type Props = {
  searchParams: Promise<Query>;
};

type TabKey = "list" | "board" | "calendar" | "files" | "dashboard";

const TABS: { key: TabKey; label: string }[] = [
  { key: "list", label: "List" },
  { key: "board", label: "Board" },
  { key: "calendar", label: "Calendar" },
  { key: "files", label: "Files" },
  { key: "dashboard", label: "Dashboard" },
];

const BOARD_GROUP_BY_OPTIONS: { key: MyTasksBoardGroupBy; label: string }[] = [
  { key: "STATE", label: "State" },
  { key: "PRIORITY", label: "Priority" },
  { key: "WORKSPACE", label: "Workspace" },
];

const TAB_KEYS: readonly string[] = TABS.map((tab) => tab.key);

function isTabKey(value: string): value is TabKey {
  return TAB_KEYS.includes(value);
}

// Dashboard is this spec's deliberately reserved placeholder — its content
// ships with the Reports & Analytics spec, matching the reservation
// pattern already used for the List page's Dashboard/Messages tabs (#43).
const DASHBOARD_NOTE = "Reserved — Dashboard content ships with the Reports & Analytics spec.";

function myTasksHref(query: Query): string {
  const params = new URLSearchParams();
  if (query.workspace) params.set("workspace", query.workspace);
  if (query.completed) params.set("completed", query.completed);
  if (query.archived) params.set("archived", query.archived);
  if (query.tab && query.tab !== "list") params.set("tab", query.tab);
  if (query.groupBy) params.set("groupBy", query.groupBy);
  if (query.month) params.set("month", query.month);
  const search = params.toString();
  return search ? `/my-tasks?${search}` : "/my-tasks";
}

export default async function MyTasksPage({ searchParams }: Props) {
  const session = await requireAuthenticatedSession("/my-tasks");
  const query = await searchParams;

  const sourceWorkspaceId = query.workspace || undefined;
  const includeCompleted = query.completed === "1";
  const includeArchived = query.archived === "1";
  const now = new Date();
  const activeTab: TabKey = query.tab && isTabKey(query.tab) ? query.tab : "list";

  const data = await loadMyTasksPageData(prisma, {
    userId: session.user.id,
    sourceWorkspaceId,
    includeCompleted,
    includeArchived,
    now,
    boardGroupBy: query.groupBy,
    calendarMonth: query.month,
  });

  const boundComplete = (itemId: string) => completeMyTaskItemAction.bind(null, itemId);
  const boundMoveItem = moveMyTaskItemAction.bind(null, data.boardGroupBy);

  const calendarMonthStart = parseCalendarMonth(query.month, now);
  const monthLabel = calendarMonthStart.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prevMonthHref = myTasksHref({
    ...query,
    tab: "calendar",
    month: formatCalendarMonthParam(addCalendarMonths(calendarMonthStart, -1)),
  });
  const nextMonthHref = myTasksHref({
    ...query,
    tab: "calendar",
    month: formatCalendarMonthParam(addCalendarMonths(calendarMonthStart, 1)),
  });

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// My Tasks"}
          </span>
        </div>
        <h1 className="text-3xl font-light text-white">Welcome, {session.user.name}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
          Every Item assigned to you, unified across your Workspaces and Personal Space.
        </p>

        <QuickAddForm quickAddItemAction={quickAddItemAction} />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href={myTasksHref({ ...query, workspace: undefined })}
            className={
              !data.selectedWorkspaceId
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            All Workspaces
          </a>
          {data.filterWorkspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={myTasksHref({ ...query, workspace: workspace.id })}
              className={
                data.selectedWorkspaceId === workspace.id
                  ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                  : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
              }
            >
              {workspace.isPersonal ? "Personal Space" : workspace.name}
            </a>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={myTasksHref({ ...query, completed: includeCompleted ? undefined : "1" })}
            className={
              includeCompleted
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            Completed
          </a>
          <a
            href={myTasksHref({ ...query, archived: includeArchived ? undefined : "1" })}
            className={
              includeArchived
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            Archived
          </a>
        </div>

        {!includeCompleted && !includeArchived && (
          <p className="mt-3 text-xs text-neutral-600">
            Complete and Archived Items are hidden by default — use the filters above to reveal them.
          </p>
        )}

        <nav className="mt-6 flex flex-wrap items-center gap-6 border-b border-neutral-800 text-sm">
          {TABS.map((tab) => (
            <a
              key={tab.key}
              href={myTasksHref({ ...query, tab: tab.key === "list" ? undefined : tab.key })}
              className={
                activeTab === tab.key
                  ? "border-b-2 border-[#ff6b4a] pb-3 text-white"
                  : "pb-3 text-neutral-500 hover:text-neutral-300"
              }
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {activeTab === "list" ? (
          <MyTasksList items={data.items} now={now} boundComplete={boundComplete} />
        ) : activeTab === "board" ? (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Group by</span>
              {BOARD_GROUP_BY_OPTIONS.map((option) => (
                <a
                  key={option.key}
                  href={myTasksHref({ ...query, tab: "board", groupBy: option.key })}
                  className={
                    data.boardGroupBy === option.key
                      ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                      : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                  }
                >
                  {option.label}
                </a>
              ))}
            </div>
            <BoardView columns={data.boardColumns} groupBy={data.boardGroupBy} boundMoveItem={boundMoveItem} />
          </>
        ) : activeTab === "calendar" ? (
          <CalendarView
            cells={data.calendarCells}
            monthLabel={monthLabel}
            prevHref={prevMonthHref}
            nextHref={nextMonthHref}
          />
        ) : activeTab === "files" ? (
          <FilesView entries={data.fileEntries} />
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
            {DASHBOARD_NOTE}
          </div>
        )}
      </div>
    </main>
  );
}
