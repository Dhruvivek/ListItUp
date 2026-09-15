import assert from "node:assert/strict";

import {
  breakdownBySection,
  breakdownByState,
  buildCompletionOverTime,
  computeItemCounts,
} from "./list-dashboard";

function item(overrides: {
  state: "TO_DO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
  dueDate?: Date | null;
  sectionId?: string | null;
  updatedAt?: Date;
}) {
  return {
    state: overrides.state,
    dueDate: overrides.dueDate ?? null,
    sectionId: overrides.sectionId ?? null,
    updatedAt: overrides.updatedAt ?? new Date("2026-09-01T00:00:00.000Z"),
  };
}

const NOW = new Date("2026-09-15T12:00:00.000Z");

// computeItemCounts: Incomplete is everything not Complete (To Do,
// In Progress, and Blocked all count), and Overdue only counts Items with
// a past due date that aren't already Complete.
{
  const items = [
    item({ state: "COMPLETE", dueDate: new Date("2026-09-01") }),
    item({ state: "TO_DO", dueDate: new Date("2026-09-10") }), // overdue
    item({ state: "IN_PROGRESS", dueDate: new Date("2026-09-20") }), // not yet due
    item({ state: "BLOCKED", dueDate: null }),
    // Complete but with a past due date doesn't count as overdue.
    item({ state: "COMPLETE", dueDate: new Date("2026-09-05") }),
  ];
  const counts = computeItemCounts(items, NOW);
  assert.deepEqual(counts, { total: 5, completed: 2, incomplete: 3, overdue: 1 });
}

{
  const counts = computeItemCounts([], NOW);
  assert.deepEqual(counts, { total: 0, completed: 0, incomplete: 0, overdue: 0 });
}

// breakdownBySection: one entry per Section in the order given, plus a
// trailing "No Section" entry only when unsectioned Items exist.
{
  const sections = [
    { id: "backlog", name: "Backlog" },
    { id: "done", name: "Done" },
  ];
  const items = [
    item({ state: "TO_DO", sectionId: "backlog" }),
    item({ state: "TO_DO", sectionId: "backlog" }),
    item({ state: "COMPLETE", sectionId: "done" }),
    item({ state: "TO_DO", sectionId: null }),
  ];
  assert.deepEqual(breakdownBySection(items, sections), [
    { sectionId: "backlog", sectionName: "Backlog", count: 2 },
    { sectionId: "done", sectionName: "Done", count: 1 },
    { sectionId: null, sectionName: "No Section", count: 1 },
  ]);
}

{
  const sections = [{ id: "backlog", name: "Backlog" }];
  const items = [item({ state: "TO_DO", sectionId: "backlog" })];
  assert.deepEqual(
    breakdownBySection(items, sections),
    [{ sectionId: "backlog", sectionName: "Backlog", count: 1 }],
    "no unsectioned entry when there are no unsectioned Items"
  );
}

// breakdownByState: fixed state order, zero-count states still present.
{
  const items = [
    item({ state: "COMPLETE" }),
    item({ state: "COMPLETE" }),
    item({ state: "TO_DO" }),
  ];
  assert.deepEqual(breakdownByState(items), [
    { state: "TO_DO", label: "To Do", count: 1 },
    { state: "IN_PROGRESS", label: "In Progress", count: 0 },
    { state: "BLOCKED", label: "Blocked", count: 0 },
    { state: "COMPLETE", label: "Complete", count: 2 },
  ]);
}

// buildCompletionOverTime: one point per day across the trailing window,
// a running cumulative total of Complete Items (approximated by
// updatedAt, the closest thing Item has to a completion timestamp),
// carrying forward completions from before the window starts.
{
  // Window is [Sept 11, Sept 15] (5 days ending "today"). Sept 1 falls
  // before it and is folded into the day-11 starting cumulative total.
  const items = [
    item({ state: "COMPLETE", updatedAt: new Date("2026-09-01T08:00:00.000Z") }), // before window
    item({ state: "COMPLETE", updatedAt: new Date("2026-09-11T08:00:00.000Z") }),
    item({ state: "COMPLETE", updatedAt: new Date("2026-09-13T08:00:00.000Z") }),
    item({ state: "COMPLETE", updatedAt: new Date("2026-09-13T20:00:00.000Z") }), // same day, second one
    item({ state: "TO_DO", updatedAt: new Date("2026-09-12T08:00:00.000Z") }), // not Complete, ignored
  ];
  const points = buildCompletionOverTime(items, NOW, 5);
  assert.deepEqual(points, [
    { date: "2026-09-11", cumulativeCompleted: 2 },
    { date: "2026-09-12", cumulativeCompleted: 2 },
    { date: "2026-09-13", cumulativeCompleted: 4 },
    { date: "2026-09-14", cumulativeCompleted: 4 },
    { date: "2026-09-15", cumulativeCompleted: 4 },
  ]);
}

{
  const points = buildCompletionOverTime([], NOW, 3);
  assert.deepEqual(points, [
    { date: "2026-09-13", cumulativeCompleted: 0 },
    { date: "2026-09-14", cumulativeCompleted: 0 },
    { date: "2026-09-15", cumulativeCompleted: 0 },
  ]);
}

console.log("list dashboard test passed");
