import assert from "node:assert/strict";

import { parseQuickAdd } from "./quick-add-parser";

// A reference "now" fixed on a Wednesday (2026-09-16 is a Wednesday) so
// weekday-shorthand assertions below are deterministic (#45).
const NOW = new Date("2026-09-16T12:00:00.000Z");

// Plain text with no shorthand is left untouched.
{
  const parsed = parseQuickAdd("Just a plain title", NOW);
  assert.equal(parsed.title, "Just a plain title");
  assert.equal(parsed.dueDate, null);
  assert.deepEqual(parsed.labelNames, []);
  assert.deepEqual(parsed.assigneeNames, []);
  assert.equal(parsed.listName, null);
}

// "today" resolves to the start of the reference day.
{
  const parsed = parseQuickAdd("Buy milk today", NOW);
  assert.equal(parsed.title, "Buy milk");
  assert.equal(parsed.dueDate?.toISOString(), "2026-09-16T00:00:00.000Z");
}

// "tomorrow" resolves to the day after the reference day.
{
  const parsed = parseQuickAdd("Buy milk tomorrow", NOW);
  assert.equal(parsed.title, "Buy milk");
  assert.equal(parsed.dueDate?.toISOString(), "2026-09-17T00:00:00.000Z");
}

// A bare weekday resolves to its next occurrence — including when it names
// today's own weekday, which rolls forward a full week rather than today.
{
  const sameWeekday = parseQuickAdd("Team sync wednesday", NOW);
  assert.equal(sameWeekday.dueDate?.toISOString(), "2026-09-23T00:00:00.000Z");

  const laterWeekday = parseQuickAdd("Team sync friday", NOW);
  assert.equal(laterWeekday.dueDate?.toISOString(), "2026-09-18T00:00:00.000Z");

  const abbreviatedWeekday = parseQuickAdd("Team sync fri", NOW);
  assert.equal(abbreviatedWeekday.dueDate?.toISOString(), "2026-09-18T00:00:00.000Z");
}

// An ISO date (YYYY-MM-DD) is parsed directly.
{
  const parsed = parseQuickAdd("Ship it 2026-10-01", NOW);
  assert.equal(parsed.title, "Ship it");
  assert.equal(parsed.dueDate?.toISOString(), "2026-10-01T00:00:00.000Z");
}

// An invalid calendar date (e.g. day 40) is not treated as a date — it's
// left in the title as ordinary text.
{
  const parsed = parseQuickAdd("Ship it 2026-13-40", NOW);
  assert.equal(parsed.title, "Ship it 2026-13-40");
  assert.equal(parsed.dueDate, null);
}

// Only the first recognized date word wins; later ones stay in the title.
{
  const parsed = parseQuickAdd("Ship it tomorrow not today", NOW);
  assert.equal(parsed.title, "Ship it not today");
  assert.equal(parsed.dueDate?.toISOString(), "2026-09-17T00:00:00.000Z");
}

// `@name` extracts an Assignee shorthand; multiple tokens all collect.
{
  const parsed = parseQuickAdd("Call @jane about the @alex handoff", NOW);
  assert.equal(parsed.title, "Call about the handoff");
  assert.deepEqual(parsed.assigneeNames, ["jane", "alex"]);
}

// `#name` extracts a Label shorthand; multiple tokens all collect.
{
  const parsed = parseQuickAdd("File the #urgent #tax-2026 paperwork", NOW);
  assert.equal(parsed.title, "File the paperwork");
  assert.deepEqual(parsed.labelNames, ["urgent", "tax-2026"]);
}

// `~name` extracts a List shorthand.
{
  const parsed = parseQuickAdd("Draft the roadmap ~Marketing", NOW);
  assert.equal(parsed.title, "Draft the roadmap");
  assert.equal(parsed.listName, "Marketing");
}

// A second `~` token is dropped — only the first List shorthand is used.
{
  const parsed = parseQuickAdd("Draft ~Marketing ~Sales the roadmap", NOW);
  assert.equal(parsed.listName, "Marketing");
  assert.equal(parsed.title, "Draft the roadmap");
}

// Every shorthand type combines in a single line, in any order, leaving a
// clean title behind.
{
  const parsed = parseQuickAdd("Fix the bug @alex #bug ~Engineering friday", NOW);
  assert.equal(parsed.title, "Fix the bug");
  assert.deepEqual(parsed.assigneeNames, ["alex"]);
  assert.deepEqual(parsed.labelNames, ["bug"]);
  assert.equal(parsed.listName, "Engineering");
  assert.equal(parsed.dueDate?.toISOString(), "2026-09-18T00:00:00.000Z");
}

// Collapsing multiple shorthand tokens down to nothing leaves an empty
// title — the caller (item-quick-add.ts) is responsible for rejecting it.
{
  const parsed = parseQuickAdd("@alex #bug ~Engineering", NOW);
  assert.equal(parsed.title, "");
}

console.log("quick-add parser test passed");
