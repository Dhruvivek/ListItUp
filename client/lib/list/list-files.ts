export type FilesViewItemSource = {
  id: string;
  title: string;
  attachments: {
    id: string;
    fileName: string;
    sizeBytes: number;
    uploaderName: string;
    createdAt: Date;
  }[];
};

export type FilesViewEntry = {
  attachmentId: string;
  fileName: string;
  sizeBytes: number;
  uploaderName: string;
  createdAt: Date;
  itemId: string;
  itemTitle: string;
};

// Pure — the flatten/sort shape is unit tested directly without a
// database. Aggregates every Attachment across a List's Items into one
// place (#22), newest first, so a User doesn't need to open each Item to
// find a file.
export function buildFilesViewEntries(items: FilesViewItemSource[]): FilesViewEntry[] {
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
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
