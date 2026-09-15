"use client";

import { useState } from "react";

import type { BoardColumn, BoardItem } from "@/lib/list/list-board";

import type { ItemSummary } from "./page-data";

const PRIORITY_LABEL: Record<BoardItem["priority"], string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

function MoveControl({
  item,
  columns,
  currentColumnKey,
  groupBy,
  boundMoveItem,
}: {
  item: BoardItem;
  columns: BoardColumn[];
  currentColumnKey: string;
  groupBy: string;
  boundMoveItem: (itemId: string, columnKey: string, blockerReason?: string) => Promise<void>;
}) {
  const [target, setTarget] = useState("");
  const [blockerReason, setBlockerReason] = useState("");
  const otherColumns = columns.filter((column) => column.key !== currentColumnKey);
  const needsBlockerReason = groupBy === "STATE" && target === "BLOCKED";

  return (
    <form
      action={async () => {
        await boundMoveItem(item.id, target, blockerReason || undefined);
        setTarget("");
        setBlockerReason("");
      }}
      className="mt-2 flex flex-col gap-1"
    >
      <select
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        className="rounded-md border border-neutral-700 bg-[#0d0d0d] px-2 py-1 text-xs text-neutral-300"
      >
        <option value="">Move to…</option>
        {otherColumns.map((column) => (
          <option key={column.key} value={column.key}>
            {column.label}
          </option>
        ))}
      </select>
      {needsBlockerReason && (
        <input
          type="text"
          value={blockerReason}
          onChange={(event) => setBlockerReason(event.target.value)}
          placeholder="Blocker reason (required)"
          className="rounded-md border border-neutral-700 bg-[#0d0d0d] px-2 py-1 text-xs text-neutral-300 placeholder:text-neutral-600"
        />
      )}
      <button
        type="submit"
        disabled={!target || (needsBlockerReason && !blockerReason.trim())}
        className="self-start text-xs text-neutral-500 hover:text-[#ff8a70] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Move
      </button>
    </form>
  );
}

export function BoardView({
  columns,
  groupBy,
  canManage,
  workspaceId,
  listId,
  archivedItems,
  boundSetGroupBy,
  boundMoveItem,
  boundRestoreItem,
}: {
  columns: BoardColumn[];
  groupBy: string;
  canManage: boolean;
  workspaceId: string;
  listId: string;
  archivedItems: ItemSummary[];
  boundSetGroupBy: (formData: FormData) => Promise<void>;
  boundMoveItem: (itemId: string, columnKey: string, blockerReason?: string) => Promise<void>;
  boundRestoreItem: (itemId: string) => () => Promise<void>;
}) {
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canManage && (
          <form action={boundSetGroupBy} className="flex items-center gap-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Group by
            </label>
            <select
              name="groupBy"
              defaultValue={groupBy}
              className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
            >
              <option value="STATE">State</option>
              <option value="SECTION">Section</option>
              <option value="ASSIGNEE">Assignee</option>
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
          <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
            <span className="text-sm font-semibold text-white">Archived</span>
            <span className="font-mono text-xs text-neutral-600">{archivedItems.length}</span>
          </div>
          <div className="flex flex-col gap-2 p-2">
            {archivedItems.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-neutral-600">No archived Items.</div>
            ) : (
              archivedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-neutral-800 bg-[#141414] p-2">
                  <a
                    href={`/workspaces/${workspaceId}/lists/${listId}/items/${item.id}`}
                    className="flex-1 truncate text-sm text-neutral-300 hover:text-white hover:underline"
                  >
                    {item.title}
                  </a>
                  <form action={boundRestoreItem(item.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
                    >
                      Restore
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.key} className="w-64 flex-shrink-0 rounded-lg border border-neutral-800 bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
                <span className="text-sm font-semibold text-white">{column.label}</span>
                <span className="font-mono text-xs text-neutral-600">{column.items.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {column.items.map((item) => (
                  <div key={item.id} className="rounded-md border border-neutral-800 bg-[#141414] p-2">
                    <a
                      href={`/workspaces/${workspaceId}/lists/${listId}/items/${item.id}`}
                      className="block text-sm text-neutral-200 hover:text-white hover:underline"
                    >
                      {item.hasParent && <span className="mr-1 text-neutral-600">↳</span>}
                      {item.title}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                      {item.priority !== "NORMAL" && (
                        <span className="font-mono uppercase">{PRIORITY_LABEL[item.priority]}</span>
                      )}
                      {item.dueDate && (
                        <span className="font-mono">
                          {new Date(item.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {item.assignees.length > 0 && (
                        <span className="font-mono">{item.assignees.map((a) => a.name).join(", ")}</span>
                      )}
                    </div>
                    {canManage && (
                      <MoveControl
                        item={item}
                        columns={columns}
                        currentColumnKey={column.key}
                        groupBy={groupBy}
                        boundMoveItem={boundMoveItem}
                      />
                    )}
                  </div>
                ))}
                {column.items.length === 0 && (
                  <div className="px-2 py-4 text-center text-xs text-neutral-600">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
