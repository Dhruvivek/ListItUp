"use client";

import { useState } from "react";

import { myTaskItemHref, myTaskWorkspaceLabel, type MyTaskItem } from "@/lib/item/item-my-tasks";
import type { MyTasksBoardColumn, MyTasksBoardGroupBy } from "@/lib/item/item-my-tasks-board";

const PRIORITY_LABEL: Record<MyTaskItem["priority"], string> = {
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
  item: MyTaskItem;
  columns: MyTasksBoardColumn[];
  currentColumnKey: string;
  groupBy: MyTasksBoardGroupBy;
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
  boundMoveItem,
}: {
  columns: MyTasksBoardColumn[];
  groupBy: MyTasksBoardGroupBy;
  boundMoveItem: (itemId: string, columnKey: string, blockerReason?: string) => Promise<void>;
}) {
  // WORKSPACE grouping is view-only — an Item's source Workspace is fixed
  // by which List it lives in, so there's nothing sensible to move it to
  // (see moveMyTaskItemToColumn's WORKSPACE branch).
  const canMove = groupBy !== "WORKSPACE";

  return (
    <div className="mt-4">
      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
          No Items here — you&apos;re all caught up.
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
                      href={myTaskItemHref(item, item.id)}
                      className="block text-sm text-neutral-200 hover:text-white hover:underline"
                    >
                      {item.hasParent && <span className="mr-1 text-neutral-600">↳</span>}
                      {item.title}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                      <span className="font-mono uppercase tracking-wider">{myTaskWorkspaceLabel(item)}</span>
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
                    </div>
                    {canMove && (
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
