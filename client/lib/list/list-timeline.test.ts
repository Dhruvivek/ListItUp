import assert from "node:assert/strict";

import { buildTimelineItems, computeBarPosition, getTimelineDateRange } from "./list-timeline";

function candidate(overrides: {
  id: string;
  startDate?: Date | null;
  dueDate: Date | null;
}) {
  return {
    id: overrides.id,
    title: `Item ${overrides.id}`,
    state: "TO_DO" as const,
    priority: "NORMAL" as const,
    hasParent: false,
    startDate: overrides.startDate ?? null,
    dueDate: overrides.dueDate,
  };
}

// Items with no due date are excluded entirely — a bar needs at least an
// end date to draw.
{
  const items = [
    candidate({ id: "no-due-date", dueDate: null }),
    candidate({ id: "has-due-date", dueDate: new Date("2026-10-05") }),
  ];
  const bars = buildTimelineItems(items);
  assert.deepEqual(
    bars.map((b) => b.id),
    ["has-due-date"]
  );
}

// startDate carries through when present, and is null when absent.
{
  const items = [
    candidate({ id: "with-start", startDate: new Date("2026-10-01"), dueDate: new Date("2026-10-05") }),
    candidate({ id: "without-start", dueDate: new Date("2026-10-03") }),
  ];
  const bars = buildTimelineItems(items);
  const withStart = bars.find((b) => b.id === "with-start")!;
  const withoutStart = bars.find((b) => b.id === "without-start")!;
  assert.equal(withStart.startDate?.toISOString(), new Date("2026-10-01").toISOString());
  assert.equal(withoutStart.startDate, null);
}

// Bars sort by due date, earliest first.
{
  const items = [
    candidate({ id: "later", dueDate: new Date("2026-11-01") }),
    candidate({ id: "earlier", dueDate: new Date("2026-10-01") }),
    candidate({ id: "middle", dueDate: new Date("2026-10-15") }),
  ];
  const bars = buildTimelineItems(items);
  assert.deepEqual(
    bars.map((b) => b.id),
    ["earlier", "middle", "later"]
  );
}

// getTimelineDateRange: null for an empty set, otherwise the earliest
// bar-start (startDate if present, else dueDate) through the latest due
// date.
{
  assert.equal(getTimelineDateRange([]), null);

  const items = buildTimelineItems([
    candidate({ id: "a", startDate: new Date("2026-10-01"), dueDate: new Date("2026-10-10") }),
    candidate({ id: "b", dueDate: new Date("2026-10-20") }),
  ]);
  const range = getTimelineDateRange(items);
  assert.equal(range?.start.toISOString(), new Date("2026-10-01").toISOString());
  assert.equal(range?.end.toISOString(), new Date("2026-10-20").toISOString());
}

// computeBarPosition: a bar spans from its start (startDate, or dueDate
// when absent) to its due date, as a percentage of the shared range.
{
  const range = { start: new Date("2026-10-01"), end: new Date("2026-10-11") };

  const withStart = buildTimelineItems([
    candidate({ id: "a", startDate: new Date("2026-10-03"), dueDate: new Date("2026-10-08") }),
  ])[0];
  const withStartPosition = computeBarPosition(withStart, range);
  assert.equal(withStartPosition.leftPercent, 20);
  assert.equal(withStartPosition.widthPercent, 50);

  const withoutStart = buildTimelineItems([candidate({ id: "b", dueDate: new Date("2026-10-01") })])[0];
  const withoutStartPosition = computeBarPosition(withoutStart, range);
  assert.equal(withoutStartPosition.leftPercent, 0);
  // Floored to the minimum visible width rather than 0, since a
  // single-day bar still needs to render as something.
  assert.equal(withoutStartPosition.widthPercent, 2);
}

// computeBarPosition doesn't divide by zero when the range collapses to a
// single day (e.g. the only Timeline Item has no start date).
{
  const singleDay = new Date("2026-10-05");
  const range = { start: singleDay, end: singleDay };
  const item = buildTimelineItems([candidate({ id: "solo", dueDate: singleDay })])[0];
  const position = computeBarPosition(item, range);
  assert.equal(Number.isFinite(position.leftPercent), true);
  assert.equal(Number.isFinite(position.widthPercent), true);
}

console.log("list timeline test passed");
