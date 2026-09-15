import type { ItemState } from "@/generated/prisma/client";

export type DashboardItem = {
  state: ItemState;
  dueDate: Date | null;
  sectionId: string | null;
  updatedAt: Date;
};

export type ItemCounts = {
  total: number;
  completed: number;
  incomplete: number;
  overdue: number;
};

// Incomplete is everything not Complete (To Do/In Progress/Blocked all
// count); Overdue only counts a past due date on an Item that isn't
// already Complete (#51).
export function computeItemCounts(items: DashboardItem[], now: Date): ItemCounts {
  const completed = items.filter((item) => item.state === "COMPLETE").length;
  const overdue = items.filter(
    (item) => item.state !== "COMPLETE" && item.dueDate !== null && item.dueDate.getTime() < now.getTime()
  ).length;

  return { total: items.length, completed, incomplete: items.length - completed, overdue };
}

export type SectionBreakdownEntry = { sectionId: string | null; sectionName: string; count: number };

const UNSECTIONED_LABEL = "No Section";

// One entry per Section in the given order, plus a trailing "No Section"
// entry only when there are unsectioned Items to show (#51).
export function breakdownBySection(
  items: DashboardItem[],
  sections: { id: string; name: string }[]
): SectionBreakdownEntry[] {
  const countsBySectionId = new Map<string | null, number>();
  for (const item of items) {
    countsBySectionId.set(item.sectionId, (countsBySectionId.get(item.sectionId) ?? 0) + 1);
  }

  const entries = sections.map((section) => ({
    sectionId: section.id as string | null,
    sectionName: section.name,
    count: countsBySectionId.get(section.id) ?? 0,
  }));

  const unsectionedCount = countsBySectionId.get(null) ?? 0;
  if (unsectionedCount > 0) {
    entries.push({ sectionId: null, sectionName: UNSECTIONED_LABEL, count: unsectionedCount });
  }

  return entries;
}

export type StateBreakdownEntry = { state: ItemState; label: string; count: number };

// Fixed display order shared with Board's columns (lib/list/list-board.ts)
// so state ordering reads the same across the app.
const STATE_BREAKDOWN_ORDER: { key: ItemState; label: string }[] = [
  { key: "TO_DO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "COMPLETE", label: "Complete" },
];

export function breakdownByState(items: DashboardItem[]): StateBreakdownEntry[] {
  const countsByState = new Map<ItemState, number>();
  for (const item of items) {
    countsByState.set(item.state, (countsByState.get(item.state) ?? 0) + 1);
  }

  return STATE_BREAKDOWN_ORDER.map(({ key, label }) => ({
    state: key,
    label,
    count: countsByState.get(key) ?? 0,
  }));
}

export type CompletionOverTimePoint = { date: string; cumulativeCompleted: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Item has no dedicated completion timestamp (schema.prisma) — this uses
// updatedAt as an approximation of "when it was completed" for Items
// currently Complete, the same kind of documented approximation Home's
// assigned-by-me query makes (lib/item/item-assigned-by-me.ts). A running
// cumulative total across a trailing window, carrying forward completions
// from before the window starts (#51).
export function buildCompletionOverTime(items: DashboardItem[], now: Date, days: number): CompletionOverTimePoint[] {
  const completedCountsByDay = new Map<string, number>();
  for (const item of items) {
    if (item.state !== "COMPLETE") continue;
    const key = toDateKey(item.updatedAt);
    completedCountsByDay.set(key, (completedCountsByDay.get(key) ?? 0) + 1);
  }

  const rangeStartMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (days - 1) * MS_PER_DAY;

  let cumulative = 0;
  for (const [key, count] of completedCountsByDay) {
    if (new Date(`${key}T00:00:00.000Z`).getTime() < rangeStartMs) {
      cumulative += count;
    }
  }

  const points: CompletionOverTimePoint[] = [];
  for (let i = 0; i < days; i++) {
    const dayKey = toDateKey(new Date(rangeStartMs + i * MS_PER_DAY));
    cumulative += completedCountsByDay.get(dayKey) ?? 0;
    points.push({ date: dayKey, cumulativeCompleted: cumulative });
  }

  return points;
}
