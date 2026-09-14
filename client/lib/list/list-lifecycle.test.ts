import assert from "node:assert/strict";

import { isValidListStatus } from "./list-lifecycle";

assert.equal(isValidListStatus("ON_TRACK"), true);
assert.equal(isValidListStatus("ON_HOLD"), true);
assert.equal(isValidListStatus("COMPLETED"), true);
assert.equal(isValidListStatus("DROPPED"), true);
assert.equal(isValidListStatus("ARCHIVED"), false);
assert.equal(isValidListStatus(""), false);
assert.equal(isValidListStatus("on_track"), false);

console.log("list lifecycle test passed");
