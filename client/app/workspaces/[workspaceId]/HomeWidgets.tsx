import type { AssignedByMeItem } from "@/lib/item/item-assigned-by-me";
import type { MyTaskItem } from "@/lib/item/item-my-tasks";
import type { ListSummary } from "@/lib/list/list-browsing";

const STATE_COLOR: Record<MyTaskItem["state"], string> = {
  TO_DO: "#737373",
  IN_PROGRESS: "#5b9dff",
  BLOCKED: "#f5b642",
  COMPLETE: "#3ecf8e",
  ARCHIVED: "#525252",
};

function WidgetCard({
  label,
  seeAllHref,
  children,
}: {
  label: string;
  seeAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">{label}</h2>
        <a href={seeAllHref} className="text-xs text-neutral-500 hover:text-[#ff8a70]">
          See all
        </a>
      </div>
      {children}
    </section>
  );
}

function EmptyWidgetState({ message }: { message: string }) {
  return <p className="mt-4 text-sm text-neutral-600">{message}</p>;
}

export function MyTasksPreviewWidget({
  items,
  workspaceId,
}: {
  items: MyTaskItem[];
  workspaceId: string;
}) {
  return (
    <WidgetCard label="My Tasks" seeAllHref={`/my-tasks?workspace=${workspaceId}`}>
      {items.length === 0 ? (
        <EmptyWidgetState message="No Items assigned to you here — you're all caught up." />
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: STATE_COLOR[item.state] }}
              />
              <a
                href={`/workspaces/${item.sourceWorkspaceId}/lists/${item.listId}/items/${item.id}`}
                className="min-w-0 flex-1 truncate text-neutral-200 hover:underline"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function RecentListsWidget({
  lists,
  workspaceId,
}: {
  lists: ListSummary[];
  workspaceId: string;
}) {
  return (
    <WidgetCard label="Recent Lists" seeAllHref={`/workspaces/${workspaceId}/lists`}>
      {lists.length === 0 ? (
        <EmptyWidgetState message="No Lists here yet." />
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {lists.map((list) => (
            <li key={list.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm">
              <a
                href={`/workspaces/${workspaceId}/lists/${list.id}`}
                className="min-w-0 flex-1 truncate text-neutral-200 hover:underline"
              >
                {list.name}
              </a>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                {list.status.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function AssignedByMeWidget({
  items,
  workspaceId,
}: {
  items: AssignedByMeItem[];
  workspaceId: string;
}) {
  return (
    <WidgetCard label="Items I've Assigned" seeAllHref={`/workspaces/${workspaceId}/lists`}>
      {items.length === 0 ? (
        <EmptyWidgetState message="You haven't assigned any Items to others here yet." />
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: STATE_COLOR[item.state] }}
              />
              <a
                href={`/workspaces/${workspaceId}/lists/${item.listId}/items/${item.id}`}
                className="min-w-0 flex-1 truncate text-neutral-200 hover:underline"
              >
                {item.title}
              </a>
              <span className="font-mono text-[10px] text-neutral-600">
                {item.assigneeCount} {item.assigneeCount === 1 ? "assignee" : "assignees"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
