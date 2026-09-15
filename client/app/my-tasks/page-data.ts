import type { PrismaClient } from "@/generated/prisma/client";
import { loadMyTasksItems, type MyTaskItem } from "@/lib/item/item-my-tasks";
import {
  groupMyTasksForBoard,
  isValidMyTasksBoardGroupBy,
  type MyTasksBoardColumn,
  type MyTasksBoardGroupBy,
} from "@/lib/item/item-my-tasks-board";
import {
  buildMyTasksCalendarGrid,
  formatCalendarMonthParam,
  parseCalendarMonth,
  type MyTasksCalendarCell,
} from "@/lib/item/item-my-tasks-calendar";
import { buildMyTasksFileEntries, type MyTasksFileEntry } from "@/lib/item/item-my-tasks-files";

export type MyTasksFilterWorkspace = { id: string; name: string; isPersonal: boolean };

export type MyTasksPageData = {
  items: MyTaskItem[];
  filterWorkspaces: MyTasksFilterWorkspace[];
  selectedWorkspaceId: string | null;
  includeCompleted: boolean;
  includeArchived: boolean;
  // Board/Calendar/Files (#43) — computed here, not in page.tsx, matching
  // the List page-data.ts convention so a Server Component smoke test can
  // assert on the same data the views render without touching JSX.
  boardGroupBy: MyTasksBoardGroupBy;
  boardColumns: MyTasksBoardColumn[];
  calendarMonth: string;
  calendarCells: MyTasksCalendarCell[];
  fileEntries: MyTasksFileEntry[];
};

// Kept separate from the page component (same rationale as the List page's
// page-data.ts): a real Next.js request scope isn't available under plain
// tsx, so session lookup stays in page.tsx while everything testable lives
// here on an injected PrismaClient.
export async function loadMyTasksPageData(
  database: PrismaClient,
  input: {
    userId: string;
    sourceWorkspaceId?: string;
    includeCompleted?: boolean;
    includeArchived?: boolean;
    now?: Date;
    boardGroupBy?: string;
    calendarMonth?: string;
  }
): Promise<MyTasksPageData> {
  const {
    userId,
    sourceWorkspaceId,
    includeCompleted = false,
    includeArchived = false,
    now = new Date(),
    boardGroupBy: rawBoardGroupBy,
    calendarMonth: rawCalendarMonth,
  } = input;

  const [items, memberships] = await Promise.all([
    loadMyTasksItems(database, { userId, sourceWorkspaceId, includeCompleted, includeArchived, now }),
    database.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const boardGroupBy: MyTasksBoardGroupBy =
    rawBoardGroupBy && isValidMyTasksBoardGroupBy(rawBoardGroupBy) ? rawBoardGroupBy : "STATE";
  const calendarMonthStart = parseCalendarMonth(rawCalendarMonth, now);

  return {
    items,
    filterWorkspaces: memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      isPersonal: membership.workspace.kind === "PERSONAL",
    })),
    selectedWorkspaceId: sourceWorkspaceId ?? null,
    includeCompleted,
    includeArchived,
    boardGroupBy,
    boardColumns: groupMyTasksForBoard(items, boardGroupBy),
    calendarMonth: formatCalendarMonthParam(calendarMonthStart),
    calendarCells: buildMyTasksCalendarGrid(items, calendarMonthStart),
    fileEntries: buildMyTasksFileEntries(items),
  };
}
