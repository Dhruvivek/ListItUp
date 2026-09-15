import assert from "node:assert/strict";

import { isItemOverdue, isVisibleByDefault, sortMyTasks } from "./item-my-tasks";

// isVisibleByDefault: only COMPLETE/ARCHIVED are hidden unless explicitly
// requested (#42) — TO_DO, IN_PROGRESS, and BLOCKED all show by default.
assert.equal(isVisibleByDefault("TO_DO"), true);
assert.equal(isVisibleByDefault("IN_PROGRESS"), true);
assert.equal(isVisibleByDefault("BLOCKED"), true);
assert.equal(isVisibleByDefault("COMPLETE"), false);
assert.equal(isVisibleByDefault("ARCHIVED"), false);

// isItemOverdue
const now = new Date("2026-09-15T12:00:00.000Z");
assert.equal(isItemOverdue({ dueDate: new Date("2026-09-01T00:00:00.000Z") }, now), true);
assert.equal(isItemOverdue({ dueDate: new Date("2026-09-30T00:00:00.000Z") }, now), false);
assert.equal(isItemOverdue({ dueDate: null }, now), false);

// sortMyTasks: overdue first, then Priority (High first), then nearest due
// date, with undated Items sorted after every dated Item in the same
// overdue/Priority bucket (#42).
{
  const overdueHigh = { id: "overdue-high", state: "TO_DO" as const, priority: "HIGH" as const, dueDate: new Date("2026-09-01T00:00:00.000Z") };
  const overdueLow = { id: "overdue-low", state: "TO_DO" as const, priority: "LOW" as const, dueDate: new Date("2026-09-05T00:00:00.000Z") };
  const upcomingHighNear = { id: "upcoming-high-near", state: "TO_DO" as const, priority: "HIGH" as const, dueDate: new Date("2026-09-20T00:00:00.000Z") };
  const upcomingHighFar = { id: "upcoming-high-far", state: "TO_DO" as const, priority: "HIGH" as const, dueDate: new Date("2026-09-25T00:00:00.000Z") };
  const upcomingHighUndated = { id: "upcoming-high-undated", state: "TO_DO" as const, priority: "HIGH" as const, dueDate: null };
  const upcomingNormal = { id: "upcoming-normal", state: "TO_DO" as const, priority: "NORMAL" as const, dueDate: new Date("2026-09-21T00:00:00.000Z") };

  const shuffled = [
    upcomingNormal,
    upcomingHighUndated,
    overdueLow,
    upcomingHighFar,
    overdueHigh,
    upcomingHighNear,
  ];

  const sorted = sortMyTasks(shuffled, now);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [
      "overdue-high",
      "overdue-low",
      "upcoming-high-near",
      "upcoming-high-far",
      "upcoming-high-undated",
      "upcoming-normal",
    ]
  );
}

console.log("item my-tasks test passed");
