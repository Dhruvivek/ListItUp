import { myTaskItemHref } from "@/lib/item/item-my-tasks";

// The Share action (#44) is narrowly scoped to producing a copy-able link
// to an Item's existing detail page — no separate share/permission-grant
// surface. Opening the link goes through the Item detail route's own
// lib/permissions/ check (resolveItemAccess via loadItemDetailData), so
// this module has nothing to enforce itself; it only assembles the URL.
export function buildItemShareUrl(
  baseUrl: string,
  item: { sourceWorkspaceId: string; listId: string; id: string }
): string {
  return `${baseUrl}${myTaskItemHref(item, item.id)}`;
}
