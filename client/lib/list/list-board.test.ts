import assert from "node:assert/strict";

import {
  groupItemsForBoard,
  isValidBoardGroupBy,
  UNASSIGNED_COLUMN_KEY,
  UNSECTIONED_COLUMN_KEY,
  type BoardItem,
} from "./list-board";

// isValidBoardGroupBy
assert.equal(isValidBoardGroupBy("SECTION"), true);
assert.equal(isValidBoardGroupBy("STATE"), true);
assert.equal(isValidBoardGroupBy("ASSIGNEE"), true);
assert.equal(isValidBoardGroupBy("PRIORITY"), false);
assert.equal(isValidBoardGroupBy(""), false);

const sections = [
  { id: "sec-1", name: "Design" },
  { id: "sec-2", name: "Procurement" },
];
const members = [
  { userId: "user-1", name: "Riya" },
  { userId: "user-2", name: "Maya" },
];

function item(overrides: Partial<BoardItem> & Pick<BoardItem, "id">): BoardItem {
  return {
    title: "Item",
    priority: "NORMAL",
    dueDate: null,
    hasParent: false,
    sectionId: null,
    state: "TO_DO",
    assignees: [],
    ...overrides,
  };
}

// Grouped by Section: one column per Section plus an unsectioned bucket.
{
  const items: BoardItem[] = [
    item({ id: "a", sectionId: "sec-1" }),
    item({ id: "b", sectionId: "sec-2" }),
    item({ id: "c", sectionId: null }),
  ];
  const columns = groupItemsForBoard(items, "SECTION", sections, members);
  assert.deepEqual(
    columns.map((c) => c.key),
    ["sec-1", "sec-2", UNSECTIONED_COLUMN_KEY]
  );
  assert.deepEqual(columns[0].items.map((i) => i.id), ["a"]);
  assert.deepEqual(columns[1].items.map((i) => i.id), ["b"]);
  assert.deepEqual(columns[2].items.map((i) => i.id), ["c"]);
  assert.equal(columns[2].label, "No Section");
}

// Grouped by State: fixed To Do / In Progress / Blocked / Complete
// columns — Archived is excluded (the List view's default already
// excludes it too; #38 owns the Archived toggle).
{
  const items: BoardItem[] = [
    item({ id: "a", state: "TO_DO" }),
    item({ id: "b", state: "BLOCKED" }),
    item({ id: "c", state: "COMPLETE" }),
  ];
  const columns = groupItemsForBoard(items, "STATE", sections, members);
  assert.deepEqual(
    columns.map((c) => c.key),
    ["TO_DO", "IN_PROGRESS", "BLOCKED", "COMPLETE"]
  );
  assert.deepEqual(columns[0].items.map((i) => i.id), ["a"]);
  assert.deepEqual(columns[1].items.map((i) => i.id), []);
  assert.deepEqual(columns[2].items.map((i) => i.id), ["b"]);
  assert.deepEqual(columns[3].items.map((i) => i.id), ["c"]);
}

// Grouped by Assignee: one column per assignable Member plus Unassigned.
// An Item with multiple Assignees appears in each of their columns.
{
  const items: BoardItem[] = [
    item({ id: "a", assignees: [{ userId: "user-1", name: "Riya" }] }),
    item({
      id: "b",
      assignees: [
        { userId: "user-1", name: "Riya" },
        { userId: "user-2", name: "Maya" },
      ],
    }),
    item({ id: "c", assignees: [] }),
  ];
  const columns = groupItemsForBoard(items, "ASSIGNEE", sections, members);
  assert.deepEqual(
    columns.map((c) => c.key),
    ["user-1", "user-2", UNASSIGNED_COLUMN_KEY]
  );
  assert.deepEqual(columns[0].items.map((i) => i.id), ["a", "b"]);
  assert.deepEqual(columns[1].items.map((i) => i.id), ["b"]);
  assert.deepEqual(columns[2].items.map((i) => i.id), ["c"]);
}

console.log("list board test passed");
