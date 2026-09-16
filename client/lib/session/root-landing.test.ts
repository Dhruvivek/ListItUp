import assert from "node:assert/strict";

import { resolveRootRedirect } from "./root-landing";

function run() {
  assert.equal(
    resolveRootRedirect(null, null),
    "/sign-in",
    "a visitor with no session must be sent to sign-in"
  );

  assert.equal(
    resolveRootRedirect({ user: { id: "user-1" } }, "workspace-1"),
    "/workspaces/workspace-1",
    "a signed-in User with a default Workspace lands on that Workspace's Home"
  );

  assert.equal(
    resolveRootRedirect({ user: { id: "user-1" } }, null),
    "/my-tasks",
    "a signed-in User with no resolvable Workspace falls back to My Tasks"
  );

  console.log("root landing redirect test passed");
}

run();
