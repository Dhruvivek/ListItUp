import assert from "node:assert/strict";

import { buildFilesViewEntries } from "./list-files";

function attachment(overrides: { id: string; fileName: string; createdAt: Date; sizeBytes?: number }) {
  return {
    id: overrides.id,
    fileName: overrides.fileName,
    sizeBytes: overrides.sizeBytes ?? 100,
    uploaderName: "Uploader",
    createdAt: overrides.createdAt,
  };
}

// An Item with no Attachments contributes nothing.
{
  const entries = buildFilesViewEntries([{ id: "item-a", title: "Item A", attachments: [] }]);
  assert.deepEqual(entries, []);
}

// Attachments from every Item in the List are flattened into one list,
// carrying their owning Item's id/title along.
{
  const entries = buildFilesViewEntries([
    {
      id: "item-a",
      title: "Item A",
      attachments: [attachment({ id: "a1", fileName: "a1.pdf", createdAt: new Date("2026-09-01") })],
    },
    {
      id: "item-b",
      title: "Item B",
      attachments: [attachment({ id: "b1", fileName: "b1.zip", createdAt: new Date("2026-09-02") })],
    },
  ]);
  assert.deepEqual(
    entries.map((e) => [e.attachmentId, e.itemId, e.itemTitle]),
    [
      ["b1", "item-b", "Item B"],
      ["a1", "item-a", "Item A"],
    ]
  );
}

// Sorted newest first, regardless of which Item they came from.
{
  const entries = buildFilesViewEntries([
    {
      id: "item-a",
      title: "Item A",
      attachments: [
        attachment({ id: "old", fileName: "old.pdf", createdAt: new Date("2026-09-01") }),
        attachment({ id: "newest", fileName: "newest.pdf", createdAt: new Date("2026-09-10") }),
      ],
    },
    {
      id: "item-b",
      title: "Item B",
      attachments: [attachment({ id: "middle", fileName: "middle.pdf", createdAt: new Date("2026-09-05") })],
    },
  ]);
  assert.deepEqual(
    entries.map((e) => e.attachmentId),
    ["newest", "middle", "old"]
  );
}

console.log("list files test passed");
