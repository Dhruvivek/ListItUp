"use client";

import { useState } from "react";

import type { ItemSummary, SectionWithItems } from "./page-data";

const STATE_COLOR: Record<ItemSummary["state"], string> = {
  TO_DO: "#737373",
  IN_PROGRESS: "#5b9dff",
  BLOCKED: "#f5b642",
  COMPLETE: "#3ecf8e",
  ARCHIVED: "#525252",
};

const PRIORITY_LABEL: Record<ItemSummary["priority"], string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

function ItemRow({ item, workspaceId, listId }: { item: ItemSummary; workspaceId: string; listId: string }) {
  return (
    <a
      href={`/workspaces/${workspaceId}/lists/${listId}/items/${item.id}`}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[#141414]"
    >
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: STATE_COLOR[item.state] }}
      />
      <span className="flex-1 truncate text-neutral-200">
        {item.hasParent && <span className="mr-1 text-neutral-600">↳</span>}
        {item.title}
      </span>
      {item.priority !== "NORMAL" && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {PRIORITY_LABEL[item.priority]}
        </span>
      )}
      {item.dueDate && (
        <span className="font-mono text-[10px] text-neutral-500">
          {new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      )}
      {item.assignees.length > 0 && (
        <span className="font-mono text-[10px] text-neutral-500">
          {item.assignees.map((a) => a.name).join(", ")}
        </span>
      )}
    </a>
  );
}

function ArchivedItemRow({
  item,
  workspaceId,
  listId,
  boundRestore,
}: {
  item: ItemSummary;
  workspaceId: string;
  listId: string;
  boundRestore: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
      <a
        href={`/workspaces/${workspaceId}/lists/${listId}/items/${item.id}`}
        className="flex-1 truncate text-neutral-400 hover:text-neutral-200 hover:underline"
      >
        {item.title}
      </a>
      <form action={boundRestore}>
        <button
          type="submit"
          className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
        >
          Restore
        </button>
      </form>
    </div>
  );
}

function AddItemForm({
  boundAddItem,
}: {
  boundAddItem: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={boundAddItem} className="flex items-center gap-2 px-3 py-2">
      <span className="text-neutral-600">+</span>
      <input
        type="text"
        name="title"
        placeholder="Add an Item"
        required
        className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
      />
      <button type="submit" className="text-xs text-neutral-500 hover:text-[#ff8a70]">
        Add
      </button>
    </form>
  );
}

export function SectionList({
  sections,
  unsectionedItems,
  archivedItems,
  canManage,
  groupBy,
  workspaceId,
  listId,
  boundAddSection,
  boundRenameSection,
  boundDuplicateSection,
  boundDeleteSection,
  boundMoveSection,
  boundSetGroupBy,
  boundAddItem,
  boundRestoreItem,
}: {
  sections: SectionWithItems[];
  unsectionedItems: ItemSummary[];
  archivedItems: ItemSummary[];
  canManage: boolean;
  groupBy: string;
  workspaceId: string;
  listId: string;
  boundAddSection: (formData: FormData) => Promise<void>;
  boundRenameSection: (sectionId: string) => (formData: FormData) => Promise<void>;
  boundDuplicateSection: (sectionId: string) => () => Promise<void>;
  boundDeleteSection: (sectionId: string) => () => Promise<void>;
  boundMoveSection: (sectionId: string, direction: "up" | "down") => () => Promise<void>;
  boundSetGroupBy: (formData: FormData) => Promise<void>;
  boundAddItem: (sectionId: string | null) => (formData: FormData) => Promise<void>;
  boundRestoreItem: (itemId: string) => () => Promise<void>;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [hideEmpty, setHideEmpty] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  function toggleCollapsed(sectionId: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  const visibleSections = hideEmpty ? sections.filter((section) => section.items.length > 0) : sections;
  const showUnsectioned = unsectionedItems.length > 0 || (!hideEmpty && canManage);

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canManage && (
          <form action={boundAddSection} className="flex items-center gap-2">
            <input
              type="text"
              name="name"
              placeholder="New Section name"
              required
              className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#ff6b4a] px-4 py-1.5 text-sm font-medium text-[#1a0800] hover:bg-[#ff8a70]"
            >
              Add Section
            </button>
          </form>
        )}

        {canManage && (
          <form action={boundSetGroupBy} className="flex items-center gap-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Add Rule — group by
            </label>
            <select
              name="groupBy"
              defaultValue={groupBy}
              className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
            >
              <option value="SECTION">Section</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
            >
              Apply
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setHideEmpty((current) => !current)}
          className={
            hideEmpty
              ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
              : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
          }
        >
          Hide empty Sections
        </button>

        <button
          type="button"
          onClick={() => setShowArchived((current) => !current)}
          className={
            showArchived
              ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
              : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
          }
        >
          Archived ({archivedItems.length})
        </button>
      </div>

      {showArchived ? (
        <div className="rounded-lg border border-neutral-800 bg-[#0d0d0d]">
          <div className="px-4 py-3 text-sm font-semibold text-white">Archived Items</div>
          <div className="border-t border-neutral-800 px-1 py-1">
            {archivedItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-neutral-600">No archived Items.</div>
            ) : (
              archivedItems.map((item) => (
                <ArchivedItemRow
                  key={item.id}
                  item={item}
                  workspaceId={workspaceId}
                  listId={listId}
                  boundRestore={boundRestoreItem(item.id)}
                />
              ))
            )}
          </div>
        </div>
      ) : visibleSections.length === 0 && !showUnsectioned ? (
        <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
          {sections.length === 0
            ? "No Sections yet."
            : "Every Section is empty — toggle “Hide empty Sections” off to see them."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleSections.map((section) => {
            const collapsed = collapsedIds.has(section.id);
            const isRenaming = renamingId === section.id;

            return (
              <div key={section.id} className="rounded-lg border border-neutral-800 bg-[#0d0d0d]">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(section.id)}
                    aria-label={collapsed ? "Expand Section" : "Collapse Section"}
                    className="text-neutral-500 hover:text-neutral-200"
                  >
                    {collapsed ? "▸" : "▾"}
                  </button>

                  {isRenaming ? (
                    <form
                      action={async (formData) => {
                        await boundRenameSection(section.id)(formData);
                        setRenamingId(null);
                      }}
                      className="flex flex-1 items-center gap-2"
                    >
                      <input
                        type="text"
                        name="name"
                        defaultValue={section.name}
                        autoFocus
                        className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-2 py-1 text-sm text-neutral-200 focus:border-[#ff6b4a] focus:outline-none"
                      />
                      <button type="submit" className="text-xs text-[#ff8a70]">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-xs text-neutral-500 hover:text-neutral-300"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span className="flex-1 text-sm font-semibold text-white">{section.name}</span>
                  )}

                  <span className="font-mono text-xs text-neutral-600">{section.items.length} items</span>

                  {canManage && !isRenaming && (
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <button
                        type="button"
                        onClick={() => setRenamingId(section.id)}
                        className="hover:text-neutral-200"
                      >
                        Rename
                      </button>
                      <form action={boundDuplicateSection(section.id)}>
                        <button type="submit" className="hover:text-neutral-200">
                          Duplicate
                        </button>
                      </form>
                      <form action={boundMoveSection(section.id, "up")}>
                        <button type="submit" className="hover:text-neutral-200">
                          Move up
                        </button>
                      </form>
                      <form action={boundMoveSection(section.id, "down")}>
                        <button type="submit" className="hover:text-neutral-200">
                          Move down
                        </button>
                      </form>
                      <form action={boundDeleteSection(section.id)}>
                        <button type="submit" className="hover:text-[#ff8a70]">
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <div className="border-t border-neutral-800 px-1 py-1">
                    {section.items.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-neutral-600">No Items yet.</div>
                    ) : (
                      section.items.map((item) => (
                        <ItemRow key={item.id} item={item} workspaceId={workspaceId} listId={listId} />
                      ))
                    )}
                    {canManage && <AddItemForm boundAddItem={boundAddItem(section.id)} />}
                  </div>
                )}
              </div>
            );
          })}

          {showUnsectioned && (
            <div className="rounded-lg border border-neutral-800 bg-[#0d0d0d]">
              <div className="px-4 py-3 text-sm font-semibold text-white">No Section</div>
              <div className="border-t border-neutral-800 px-1 py-1">
                {unsectionedItems.map((item) => (
                  <ItemRow key={item.id} item={item} workspaceId={workspaceId} listId={listId} />
                ))}
                {canManage && <AddItemForm boundAddItem={boundAddItem(null)} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
