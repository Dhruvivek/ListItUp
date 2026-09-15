import assert from "node:assert/strict";

import { buildItemShareUrl } from "./item-sharing";

assert.equal(
  buildItemShareUrl("https://app.listitup.test", { sourceWorkspaceId: "ws-1", listId: "list-1", id: "item-1" }),
  "https://app.listitup.test/workspaces/ws-1/lists/list-1/items/item-1"
);

console.log("item sharing test passed");
