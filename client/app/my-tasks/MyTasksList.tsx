import { buildItemShareUrl } from "@/lib/item/item-sharing";
import { myTaskItemHref, myTaskWorkspaceLabel, type MyTaskItem, type MyTasksGroup } from "@/lib/item/item-my-tasks";

import { CopyLinkButton } from "./CopyLinkButton";

const STATE_COLOR: Record<MyTaskItem["state"], string> = {
  TO_DO: "#737373",
  IN_PROGRESS: "#5b9dff",
  BLOCKED: "#f5b642",
  COMPLETE: "#3ecf8e",
  ARCHIVED: "#525252",
};

const PRIORITY_LABEL: Record<MyTaskItem["priority"], string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

function isOverdue(item: MyTaskItem, now: Date): boolean {
  return item.dueDate !== null && item.dueDate.getTime() < now.getTime() && item.state !== "COMPLETE";
}

function MyTaskRow({
  item,
  now,
  baseUrl,
  boundComplete,
}: {
  item: MyTaskItem;
  now: Date;
  baseUrl: string;
  boundComplete: () => Promise<void>;
}) {
  const canComplete = item.state !== "COMPLETE" && item.state !== "ARCHIVED";
  const overdue = isOverdue(item, now);

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[#141414]">
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: STATE_COLOR[item.state] }}
      />
      <a href={myTaskItemHref(item, item.id)} className="flex-1 truncate text-neutral-200 hover:underline">
        {item.hasParent && <span className="mr-1 text-neutral-600">↳</span>}
        {item.title}
      </a>
      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
        {myTaskWorkspaceLabel(item)}
      </span>
      {item.priority !== "NORMAL" && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {PRIORITY_LABEL[item.priority]}
        </span>
      )}
      {item.dueDate && (
        <span className={`font-mono text-[10px] ${overdue ? "text-[#ff8a70]" : "text-neutral-500"}`}>
          {overdue ? "Overdue " : ""}
          {new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      )}
      <CopyLinkButton url={buildItemShareUrl(baseUrl, item)} />
      {canComplete && (
        <form action={boundComplete}>
          <button
            type="submit"
            className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#3ecf8e] hover:text-[#3ecf8e]"
          >
            Complete
          </button>
        </form>
      )}
    </div>
  );
}

export function MyTasksList({
  groups,
  now,
  baseUrl,
  boundComplete,
}: {
  groups: MyTasksGroup<MyTaskItem>[];
  now: Date;
  baseUrl: string;
  boundComplete: (itemId: string) => () => Promise<void>;
}) {
  const isEmpty = groups.every((group) => group.items.length === 0);

  if (isEmpty) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
        No Items here — you&apos;re all caught up.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-[#0d0d0d]">
      <div className="px-1 py-1">
        {groups.map((group) => (
          <div key={group.key}>
            {group.label && (
              <div className="px-3 pt-4 pb-2 font-mono text-[10.5px] uppercase tracking-wider text-neutral-500">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <MyTaskRow
                key={item.id}
                item={item}
                now={now}
                baseUrl={baseUrl}
                boundComplete={boundComplete(item.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
