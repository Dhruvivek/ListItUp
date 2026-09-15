import type { WorkspaceKind } from "@/generated/prisma/client";
import type { MyTaskItem } from "@/lib/item/item-my-tasks";

export type MyTasksFileEntry = {
  attachmentId: string;
  fileName: string;
  sizeBytes: number;
  uploaderName: string;
  createdAt: Date;
  itemId: string;
  itemTitle: string;
  listId: string;
  sourceWorkspaceId: string;
  sourceWorkspaceName: string;
  sourceWorkspaceKind: WorkspaceKind;
};

// Aggregates every Attachment across the User's assigned Items into one
// flat, newest-first list (#43) — the cross-Workspace equivalent of List
// Files' buildFilesViewEntries (lib/list/list-files.ts), extended with the
// source-Workspace tagging every My Tasks view carries so an entry can
// still be traced back to which List/Workspace it came from.
export function buildMyTasksFileEntries(items: MyTaskItem[]): MyTasksFileEntry[] {
  return items
    .flatMap((item) =>
      item.attachments.map((attachment) => ({
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        sizeBytes: attachment.sizeBytes,
        uploaderName: attachment.uploaderName,
        createdAt: attachment.createdAt,
        itemId: item.id,
        itemTitle: item.title,
        listId: item.listId,
        sourceWorkspaceId: item.sourceWorkspaceId,
        sourceWorkspaceName: item.sourceWorkspaceName,
        sourceWorkspaceKind: item.sourceWorkspaceKind,
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
