import type { MyTaskItem } from "@/lib/item/item-my-tasks";

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
  boundComplete,
}: {
  item: MyTaskItem;
  now: Date;
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
      <a
        href={`/workspaces/${item.sourceWorkspaceId}/lists/${item.listId}/items/${item.id}`}
        className="flex-1 truncate text-neutral-200 hover:underline"
      >
        {item.hasParent && <span className="mr-1 text-neutral-600">↳</span>}
        {item.title}
      </a>
      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
        {item.sourceWorkspaceKind === "PERSONAL" ? "Personal Space" : item.sourceWorkspaceName}
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
  items,
  now,
  boundComplete,
}: {
  items: MyTaskItem[];
  now: Date;
  boundComplete: (itemId: string) => () => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
        No Items here — you&apos;re all caught up.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-[#0d0d0d]">
      <div className="px-1 py-1">
        {items.map((item) => (
          <MyTaskRow key={item.id} item={item} now={now} boundComplete={boundComplete(item.id)} />
        ))}
      </div>
    </div>
  );
}
