import assert from "node:assert/strict";

import { avatarColorForName, initialsFromName } from "./member-display";

// initialsFromName: first letter of the first two words, uppercased.
{
  assert.equal(initialsFromName("Riya Kapoor"), "RK");
  assert.equal(initialsFromName("riya"), "R");
  assert.equal(initialsFromName("  Riya   Kapoor  Extra  "), "RK");
  assert.equal(initialsFromName(""), "?");
}

// avatarColorForName: deterministic per name, so the same person renders
// the same color everywhere it's used.
{
  assert.equal(avatarColorForName("Riya Kapoor"), avatarColorForName("Riya Kapoor"));
  assert.match(avatarColorForName("Riya Kapoor"), /^#[0-9a-f]{6}$/);
}

console.log("member display test passed");
