import assert from "node:assert/strict";

import { computeNextSectionOrder, isValidGroupBy, isValidSectionReorder } from "./list-sections";

// computeNextSectionOrder
assert.equal(computeNextSectionOrder(null), 0, "an empty List's first Section is order 0");
assert.equal(computeNextSectionOrder(0), 1);
assert.equal(computeNextSectionOrder(4), 5);

// isValidSectionReorder: a valid reorder is exactly a permutation of the
// List's existing Section ids — no drops, no additions, no duplicates.
assert.equal(isValidSectionReorder([], []), true);
assert.equal(isValidSectionReorder(["a", "b", "c"], ["c", "a", "b"]), true);
assert.equal(isValidSectionReorder(["a", "b", "c"], ["a", "b"]), false, "dropping a Section is rejected");
assert.equal(
  isValidSectionReorder(["a", "b"], ["a", "b", "c"]),
  false,
  "introducing an unknown Section is rejected"
);
assert.equal(isValidSectionReorder(["a", "b"], ["a", "a"]), false, "a duplicated id is rejected");
assert.equal(isValidSectionReorder(["a", "b"], ["a", "c"]), false, "a foreign id is rejected");

// isValidGroupBy
assert.equal(isValidGroupBy("SECTION"), true);
assert.equal(isValidGroupBy("STATE"), false, "not groupable until Item's schema ships (#30)");
assert.equal(isValidGroupBy(""), false);

console.log("list sections test passed");
