import assert from "node:assert/strict";

import { formatAttachmentSize, MAX_ATTACHMENT_SIZE_BYTES, validateAttachmentUpload } from "./item-attachments";

// An allowed content type within the size cap passes.
assert.deepEqual(
  validateAttachmentUpload({ contentType: "application/pdf", sizeBytes: 1024 }),
  { status: "ok" }
);
assert.deepEqual(
  validateAttachmentUpload({ contentType: "image/png", sizeBytes: 0 }),
  { status: "ok" }
);

// A content type outside the ZIP/image/PDF/office-document allowlist is
// rejected, regardless of size.
assert.deepEqual(
  validateAttachmentUpload({ contentType: "application/x-msdownload", sizeBytes: 10 }),
  { status: "type-not-allowed" }
);
assert.deepEqual(
  validateAttachmentUpload({ contentType: "video/mp4", sizeBytes: 10 }),
  { status: "type-not-allowed" }
);

// A file over the 1GB cap is rejected even with an allowed type; exactly
// at the cap is still allowed.
assert.deepEqual(
  validateAttachmentUpload({ contentType: "application/zip", sizeBytes: MAX_ATTACHMENT_SIZE_BYTES + 1 }),
  { status: "too-large" }
);
assert.deepEqual(
  validateAttachmentUpload({ contentType: "application/zip", sizeBytes: MAX_ATTACHMENT_SIZE_BYTES }),
  { status: "ok" }
);

// formatAttachmentSize picks the coarsest readable unit.
assert.equal(formatAttachmentSize(512), "512 B");
assert.equal(formatAttachmentSize(2048), "2.0 KB");
assert.equal(formatAttachmentSize(5 * 1024 * 1024), "5.0 MB");

console.log("item attachments test passed");
