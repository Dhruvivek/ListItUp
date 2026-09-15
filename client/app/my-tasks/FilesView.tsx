import { formatAttachmentSize } from "@/lib/item/item-attachments";
import type { MyTasksFileEntry } from "@/lib/item/item-my-tasks-files";

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function FilesView({ entries }: { entries: MyTasksFileEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
        No Attachments yet.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-1 rounded-lg border border-neutral-800 bg-[#0d0d0d] p-4">
      {entries.map((entry) => (
        <div
          key={entry.attachmentId}
          className="flex items-center justify-between gap-3 border-b border-neutral-900 py-2 last:border-0"
        >
          <div className="min-w-0">
            <a
              href={`/api/workspaces/${entry.sourceWorkspaceId}/lists/${entry.listId}/items/${entry.itemId}/attachments/${entry.attachmentId}`}
              className="block truncate text-sm text-neutral-200 hover:text-white hover:underline"
            >
              {entry.fileName}
            </a>
            <a
              href={`/workspaces/${entry.sourceWorkspaceId}/lists/${entry.listId}/items/${entry.itemId}`}
              className="block truncate text-xs text-neutral-500 hover:text-neutral-300 hover:underline"
            >
              {entry.itemTitle}
            </a>
          </div>
          <div className="flex-shrink-0 text-right text-xs text-neutral-600">
            <div>{formatAttachmentSize(entry.sizeBytes)}</div>
            <div>
              {entry.uploaderName} · {formatDate(entry.createdAt)}
            </div>
            <div className="font-mono uppercase tracking-wider text-neutral-700">
              {entry.sourceWorkspaceKind === "PERSONAL" ? "Personal Space" : entry.sourceWorkspaceName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
