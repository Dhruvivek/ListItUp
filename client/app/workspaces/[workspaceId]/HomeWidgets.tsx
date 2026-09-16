import { ArrowRight, Check, LayoutList } from "lucide-react";

import type { AssignedByMeItem } from "@/lib/item/item-assigned-by-me";
import type { MyTaskItem } from "@/lib/item/item-my-tasks";
import type { RecentListSummary } from "./page-data";

const STATE_COLOR: Record<MyTaskItem["state"], string> = {
  TO_DO: "#737373",
  IN_PROGRESS: "#5b9dff",
  BLOCKED: "#f5b642",
  COMPLETE: "#3ecf8e",
  ARCHIVED: "#525252",
};

const AVATAR_COLORS = ["#ff8a70", "#5b9dff", "#3ecf8e", "#f5b642", "#f2545b"];

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

function avatarColorForName(name: string): string {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash]!;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-mono-label)] text-[10px] font-bold text-[#1a0800]"
      style={{ backgroundColor: avatarColorForName(name) }}
      title={name}
    >
      {initialsFromName(name)}
    </span>
  );
}

type BadgeTone = "red" | "amber" | "blue" | "green" | "muted";

const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  red: "bg-[#f2545b24] text-[#f2545b]",
  amber: "bg-[#f5b64224] text-[#f5b642]",
  blue: "bg-[#5b9dff24] text-[#5b9dff]",
  green: "bg-[#3ecf8e24] text-[#3ecf8e]",
  muted: "bg-[#202020] text-[#8f8f8a]",
};

function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`whitespace-nowrap rounded-[5px] px-[7px] py-[2px] font-[family-name:var(--font-mono-label)] text-[10px] font-semibold tracking-wide ${BADGE_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function formatDueDate(dueDate: Date): string {
  return dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dueDateBadge(
  item: { state: MyTaskItem["state"]; dueDate: Date | null },
  now: Date
): { tone: BadgeTone; label: string } {
  if (item.state === "COMPLETE") return { tone: "green", label: "Complete" };
  if (item.state === "BLOCKED") return { tone: "amber", label: "Blocked" };
  if (item.dueDate && item.dueDate.getTime() < now.getTime()) {
    return { tone: "red", label: `Overdue · ${formatDueDate(item.dueDate)}` };
  }
  if (item.dueDate) return { tone: "blue", label: `Due ${formatDueDate(item.dueDate)}` };
  return { tone: "muted", label: "No due date" };
}

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
    <section className="rounded-xl border border-[#232323] bg-[#141414] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-mono-label)] text-[11px] uppercase tracking-wider text-[#5a5a56]">
          {label}
        </h2>
        <a href={seeAllHref} className="flex items-center gap-1 text-[12px] font-semibold text-[#ff8a70] hover:text-[#ff6b4a]">
          View all <ArrowRight className="h-3 w-3" />
        </a>
      </div>
      {children}
    </section>
  );
}

function EmptyWidgetState({ message }: { message: string }) {
  return <p className="mt-4 text-sm text-[#5a5a56]">{message}</p>;
}

export function MyTasksPreviewWidget({
  items,
  workspaceId,
  viewerName,
  now,
}: {
  items: MyTaskItem[];
  workspaceId: string;
  viewerName: string;
  now: Date;
}) {
  return (
    <WidgetCard label="My Tasks" seeAllHref={`/my-tasks?workspace=${workspaceId}`}>
      {items.length === 0 ? (
        <EmptyWidgetState message="No Items assigned to you here — you're all caught up." />
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {items.map((item) => {
            const badge = dueDateBadge(item, now);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-[#1a1a1a]"
              >
                <span
                  className={
                    item.state === "COMPLETE"
                      ? "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] bg-[#ff6b4a]"
                      : "h-4 w-4 flex-shrink-0 rounded-[5px] border-[1.5px] border-[#333333]"
                  }
                >
                  {item.state === "COMPLETE" && <Check className="h-[11px] w-[11px] text-[#1a0800]" />}
                </span>
                <a
                  href={`/workspaces/${item.sourceWorkspaceId}/lists/${item.listId}/items/${item.id}`}
                  className="min-w-0 flex-1 truncate text-[13.5px] text-[#e5e5e0] hover:underline"
                >
                  {item.title}
                </a>
                <Badge tone={badge.tone}>{badge.label}</Badge>
                <Avatar name={viewerName} />
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

export function RecentListsWidget({
  lists,
  workspaceId,
}: {
  lists: RecentListSummary[];
  workspaceId: string;
}) {
  return (
    <WidgetCard label="Recent Lists" seeAllHref={`/workspaces/${workspaceId}/lists`}>
      {lists.length === 0 ? (
        <EmptyWidgetState message="No Lists here yet." />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {lists.map((list) => (
            <li key={list.id}>
              <a href={`/workspaces/${workspaceId}/lists/${list.id}`} className="group flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#1a1a1a]">
                  <LayoutList className="h-4 w-4 text-[#ff8a70]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[#e5e5e0] group-hover:underline">
                    {list.name}
                  </span>
                  <span className="block text-[11.5px] text-[#5a5a56]">
                    {list.itemCount} {list.itemCount === 1 ? "item" : "items"} · {list.completionPercent}% complete
                  </span>
                </span>
              </a>
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
  now,
}: {
  items: AssignedByMeItem[];
  workspaceId: string;
  now: Date;
}) {
  return (
    <WidgetCard label="Items I've Assigned" seeAllHref={`/workspaces/${workspaceId}/lists`}>
      {items.length === 0 ? (
        <EmptyWidgetState message="You haven't assigned any Items to others here yet." />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          {items.map((item) => {
            const badge = dueDateBadge(item, now);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-[#1a1a1a]"
              >
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: STATE_COLOR[item.state] }}
                />
                <a
                  href={`/workspaces/${workspaceId}/lists/${item.listId}/items/${item.id}`}
                  className="min-w-0 flex-1 truncate text-[13.5px] text-[#e5e5e0] hover:underline"
                >
                  {item.title}
                </a>
                <div className="flex flex-shrink-0 -space-x-1.5">
                  {item.assigneeNames.slice(0, 2).map((name) => (
                    <Avatar key={name} name={name} />
                  ))}
                  {item.assigneeCount > 2 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#202020] font-[family-name:var(--font-mono-label)] text-[10px] font-bold text-[#8f8f8a]">
                      +{item.assigneeCount - 2}
                    </span>
                  )}
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
