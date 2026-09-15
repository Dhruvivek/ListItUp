import assert from "node:assert/strict";

import { DUE_DATE_REMINDER_WINDOW_MS, isDueDateApproaching } from "./notification-triggers";

const now = new Date("2026-09-15T12:00:00.000Z");

// isDueDateApproaching: no dueDate, no reminder — there is nothing to count
// down to.
assert.equal(isDueDateApproaching({ dueDate: null, state: "TO_DO" }, now), false);

// A dueDate inside the default window is approaching.
assert.equal(
  isDueDateApproaching({ dueDate: new Date(now.getTime() + DUE_DATE_REMINDER_WINDOW_MS / 2), state: "TO_DO" }, now),
  true
);

// The window's exact edge is inclusive on both ends.
assert.equal(isDueDateApproaching({ dueDate: now, state: "TO_DO" }, now), true);
assert.equal(
  isDueDateApproaching(
    { dueDate: new Date(now.getTime() + DUE_DATE_REMINDER_WINDOW_MS), state: "TO_DO" },
    now
  ),
  true
);

// A dueDate outside the window (too far away, or already past) is not
// approaching.
assert.equal(
  isDueDateApproaching(
    { dueDate: new Date(now.getTime() + DUE_DATE_REMINDER_WINDOW_MS + 1), state: "TO_DO" },
    now
  ),
  false
);
assert.equal(
  isDueDateApproaching({ dueDate: new Date(now.getTime() - 1), state: "TO_DO" }, now),
  false
);

// A custom window is honored instead of the default.
const oneHour = 60 * 60 * 1000;
assert.equal(
  isDueDateApproaching({ dueDate: new Date(now.getTime() + oneHour), state: "TO_DO" }, now, oneHour),
  true
);
assert.equal(
  isDueDateApproaching({ dueDate: new Date(now.getTime() + oneHour + 1), state: "TO_DO" }, now, oneHour),
  false
);

// A COMPLETE or ARCHIVED Item never gets a reminder — there is nothing left
// to do.
for (const state of ["COMPLETE", "ARCHIVED"] as const) {
  assert.equal(
    isDueDateApproaching({ dueDate: new Date(now.getTime() + oneHour), state }, now),
    false,
    `${state} Items must not get a due-date reminder`
  );
}

// TO_DO, IN_PROGRESS, and BLOCKED all remain remindable.
for (const state of ["TO_DO", "IN_PROGRESS", "BLOCKED"] as const) {
  assert.equal(
    isDueDateApproaching({ dueDate: new Date(now.getTime() + oneHour), state }, now),
    true,
    `${state} Items must still get a due-date reminder`
  );
}

console.log("notification triggers test passed");
