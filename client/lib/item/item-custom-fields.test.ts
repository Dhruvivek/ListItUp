import assert from "node:assert/strict";

import { isValidCustomFieldValue } from "./item-custom-fields";

// TEXT accepts any string.
assert.equal(isValidCustomFieldValue("TEXT", "anything at all", []), true);
assert.equal(isValidCustomFieldValue("TEXT", "", []), true);

// NUMBER requires a parseable, non-empty number.
assert.equal(isValidCustomFieldValue("NUMBER", "1240", []), true);
assert.equal(isValidCustomFieldValue("NUMBER", "12.5", []), true);
assert.equal(isValidCustomFieldValue("NUMBER", "not a number", []), false);
assert.equal(isValidCustomFieldValue("NUMBER", "", []), false);
assert.equal(isValidCustomFieldValue("NUMBER", "   ", []), false);

// DATE requires a parseable date string.
assert.equal(isValidCustomFieldValue("DATE", "2026-09-16", []), true);
assert.equal(isValidCustomFieldValue("DATE", "not a date", []), false);

// DROPDOWN requires the value to be one of the definition's options.
assert.equal(isValidCustomFieldValue("DROPDOWN", "Approved", ["Needs revision", "Approved"]), true);
assert.equal(isValidCustomFieldValue("DROPDOWN", "Rejected", ["Needs revision", "Approved"]), false);
assert.equal(isValidCustomFieldValue("DROPDOWN", "Approved", []), false);

console.log("item custom fields test passed");
