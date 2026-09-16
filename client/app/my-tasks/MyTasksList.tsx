import { AlertTriangle, Check, OctagonPause } from "lucide-react";

import { MemberAvatar } from "@/components/workspace/MemberAvatar";
import { StatusBadge } from "@/components/workspace/StatusBadge";
import { buildItemShareUrl } from "@/lib/item/item-sharing";
import {
  myTaskItemHref,
  myTaskRowBadge,
  myTaskWorkspaceLabel,
  type MyTaskItem,
  type MyTasksGroup,
  type MyTasksSmartSectionKey,
} from "@/lib/item/item-my-tasks";

import { CopyLinkButton } from "./CopyLinkButton";

const PRIORITY_DOT_COLOR: Record<MyTaskItem["priority"], string> = {
  HIGH: "#f2545b",
  NORMAL: "#5a5a56",
  LOW: "#5a5a56",
};

const PRIORITY_LABEL: Record<MyTaskItem["priority"], string> = {
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low",
};

const PRIORITY_TEXT_COLOR: Record<MyTaskItem["priority"], string> = {
  HIGH: "#f2545b",
  NORMAL: "#8f8f8a",
  LOW: "#8f8f8a",
};

// Section headers get the mock's icon+color treatment for Overdue/Blocked;
// every other key (a smart section's date buckets, or an explicit
// Group-by's Workspace/Priority/Due-date keys) falls back to a plain
// ink-faint label.
const SECTION_HEADER: Partial<Record<MyTasksSmartSectionKey, { color: string; icon: React.ComponentType<{ className?: string }> }>> = {
  OVERDUE: { color: "#f2545b", icon: AlertTriangle },
  BLOCKED: { color: "#f5b642", icon: OctagonPause },
};

function GroupHeader({ groupKey, label }: { groupKey: string; label: string }) {
  const decorated = SECTION_HEADER[groupKey as MyTasksSmartSectionKey];
  const Icon = decorated?.icon;

  return (
    <div
      className="flex items-center gap-2 px-3 pb-2 pt-3 font-[family-name:var(--font-mono-label)] text-[10.5px] uppercase tracking-[0.1em]"
      style={{ color: decorated?.color ?? "#5a5a56" }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </div>
  );
}

function CompleteToggle({
  canComplete,
  boundComplete,
}: {
  canComplete: boolean;
  boundComplete: () => Promise<void>;
}) {
  if (!canComplete) {
    return (
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] bg-[#ff6b4a]">
        <Check className="h-[11px] w-[11px] text-[#1a0800]" />
      </span>
    );
  }

  return (
    <form action={boundComplete}>
      <button
        type="submit"
        aria-label="Mark complete"
        className="h-4 w-4 flex-shrink-0 rounded-[5px] border-[1.5px] border-[#333333] transition-colors hover:border-[#ff6b4a]"
      />
    </form>
  );
}

function MyTaskRow({
  item,
  now,
  baseUrl,
  viewerName,
  boundComplete,
}: {
  item: MyTaskItem;
  now: Date;
  baseUrl: string;
  viewerName: string;
  boundComplete: () => Promise<void>;
}) {
  const canComplete = item.state !== "COMPLETE" && item.state !== "ARCHIVED";
  const badge = myTaskRowBadge(item, now);

  return (
    <div className="flex items-center gap-3 rounded-[8px] px-2.5 py-[9px] transition-colors hover:bg-[#1a1a1a]">
      <CompleteToggle canComplete={canComplete} boundComplete={boundComplete} />
      <a href={myTaskItemHref(item, item.id)} className="min-w-0 flex-1 truncate text-[13.5px] text-[#e5e5e0] hover:underline">
        {item.hasParent && <span className="mr-1 text-[#5a5a56]">↳</span>}
        {item.title}
      </a>
      <span className="whitespace-nowrap rounded-full border border-[#333333] bg-[#1a1a1a] px-2 py-0.5 font-[family-name:var(--font-mono-label)] text-[10.5px] text-[#8f8f8a]">
        {myTaskWorkspaceLabel(item)}
      </span>
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_DOT_COLOR[item.priority] }} />
      <span
        className="whitespace-nowrap font-[family-name:var(--font-mono-label)] text-[11.5px]"
        style={{ color: PRIORITY_TEXT_COLOR[item.priority] }}
      >
        {PRIORITY_LABEL[item.priority]}
      </span>
      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
      <CopyLinkButton url={buildItemShareUrl(baseUrl, item)} />
      <MemberAvatar name={viewerName} />
    </div>
  );
}

export function MyTasksList({
  groups,
  now,
  baseUrl,
  viewerName,
  boundComplete,
}: {
  groups: MyTasksGroup<MyTaskItem>[];
  now: Date;
  baseUrl: string;
  viewerName: string;
  boundComplete: (itemId: string) => () => Promise<void>;
}) {
  const isEmpty = groups.every((group) => group.items.length === 0);

  if (isEmpty) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#232323] px-4 py-16 text-center text-sm text-[#5a5a56]">
        No Items here — you&apos;re all caught up.
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#232323] bg-[#141414] p-2">
      {groups.map((group) => (
        <div key={group.key}>
          {group.label && <GroupHeader groupKey={group.key} label={group.label} />}
          {group.items.map((item) => (
            <MyTaskRow
              key={item.id}
              item={item}
              now={now}
              baseUrl={baseUrl}
              viewerName={viewerName}
              boundComplete={boundComplete(item.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
