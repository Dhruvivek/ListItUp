import assert from "node:assert/strict";

import { isValidItemState, validateStateTransition } from "./item-lifecycle";

// isValidItemState
assert.equal(isValidItemState("TO_DO"), true);
assert.equal(isValidItemState("IN_PROGRESS"), true);
assert.equal(isValidItemState("BLOCKED"), true);
assert.equal(isValidItemState("COMPLETE"), true);
assert.equal(isValidItemState("ARCHIVED"), true);
assert.equal(isValidItemState("DONE"), false);
assert.equal(isValidItemState(""), false);

// validateStateTransition: entering BLOCKED requires a non-empty Blocker
// reason; every other transition is unconditionally allowed.
assert.deepEqual(validateStateTransition("BLOCKED", undefined), {
  valid: false,
  reason: "blocker-reason-required",
});
assert.deepEqual(validateStateTransition("BLOCKED", "   "), {
  valid: false,
  reason: "blocker-reason-required",
});
assert.deepEqual(validateStateTransition("BLOCKED", "Waiting on vendor"), { valid: true });
assert.deepEqual(validateStateTransition("TO_DO", undefined), { valid: true });
assert.deepEqual(validateStateTransition("COMPLETE", undefined), { valid: true });
assert.deepEqual(validateStateTransition("ARCHIVED", undefined), { valid: true });
// Leaving BLOCKED (moving to any other state) is allowed without a reason.
assert.deepEqual(validateStateTransition("IN_PROGRESS", undefined), { valid: true });

console.log("item lifecycle test passed");
