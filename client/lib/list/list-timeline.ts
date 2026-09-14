import type { ItemPriority, ItemState } from "@/generated/prisma/client";

export type TimelineItem = {
  id: string;
  title: string;
  state: ItemState;
  priority: ItemPriority;
  hasParent: boolean;
  // Optional and independent of dueDate — a bar renders from startDate to
  // dueDate when present, or as a single-day marker at dueDate otherwise.
  startDate: Date | null;
  dueDate: Date;
};

type TimelineCandidate = Omit<TimelineItem, "dueDate"> & { dueDate: Date | null };

// Pure — the filter/sort shape is unit tested directly without a database.
// An Item with no due date has nothing to draw a bar from and is excluded
// entirely (#33) — Dependency-arrow rendering is explicitly out of scope
// for this view.
export function buildTimelineItems(items: TimelineCandidate[]): TimelineItem[] {
  return items
    .filter((item): item is TimelineCandidate & { dueDate: Date } => item.dueDate !== null)
    .map((item) => ({ ...item, dueDate: item.dueDate }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export type TimelineDateRange = { start: Date; end: Date };

// The earliest bar-start and latest due date across all Timeline Items —
// used to position each bar along a shared horizontal axis. Pure — unit
// tested directly without a database.
export function getTimelineDateRange(items: TimelineItem[]): TimelineDateRange | null {
  if (items.length === 0) {
    return null;
  }

  const barStartTimes = items.map((item) => (item.startDate ?? item.dueDate).getTime());
  const dueDateTimes = items.map((item) => item.dueDate.getTime());
  return {
    start: new Date(Math.min(...barStartTimes)),
    end: new Date(Math.max(...dueDateTimes)),
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// A single-day (no start date) bar still needs to be visible against the
// full date range, so its rendered width has a floor.
const MIN_BAR_WIDTH_PERCENT = 2;

export type TimelineBarPosition = { leftPercent: number; widthPercent: number };

// Where an Item's bar sits along the shared axis, as percentages of the
// range's total span. Pure — unit tested directly without a database. The
// span is floored at one day so a single-Item range (start === end)
// doesn't divide by zero.
export function computeBarPosition(item: TimelineItem, range: TimelineDateRange): TimelineBarPosition {
  const rangeSpanMs = Math.max(range.end.getTime() - range.start.getTime(), MS_PER_DAY);
  const barStart = item.startDate ?? item.dueDate;
  const leftPercent = ((barStart.getTime() - range.start.getTime()) / rangeSpanMs) * 100;
  const widthPercent = Math.max(
    ((item.dueDate.getTime() - barStart.getTime()) / rangeSpanMs) * 100,
    MIN_BAR_WIDTH_PERCENT
  );
  return { leftPercent, widthPercent };
}
