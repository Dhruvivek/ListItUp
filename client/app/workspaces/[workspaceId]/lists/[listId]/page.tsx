import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import {
  addItemAction,
  addListMemberAction,
  addSectionAction,
  duplicateSectionAction,
  deleteSectionAction,
  grantGuestAccessAction,
  moveItemToColumnAction,
  moveSectionAction,
  removeListMemberAction,
  renameSectionAction,
  restoreItemAction,
  revokeGuestAccessAction,
  setBoardGroupByAction,
  setListGroupByAction,
  updateListDescriptionAction,
} from "./actions";
import { BoardView } from "./BoardView";
import { DashboardTab } from "./DashboardTab";
import { FilesView } from "./FilesView";
import { loadListPageData, type ListPageData } from "./page-data";
import { SectionList } from "./SectionList";
import { TimelineView } from "./TimelineView";

type Props = {
  params: Promise<{ workspaceId: string; listId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type TabKey =
  | "overview"
  | "list"
  | "board"
  | "calendar"
  | "files"
  | "timeline"
  | "dashboard"
  | "messages";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "list", label: "List" },
  { key: "board", label: "Board" },
  { key: "calendar", label: "Calendar" },
  { key: "files", label: "Files" },
  { key: "timeline", label: "Timeline" },
  { key: "dashboard", label: "Dashboard" },
  { key: "messages", label: "Messages" },
];

const TAB_KEYS: readonly string[] = TABS.map((tab) => tab.key);

function isTabKey(value: string): value is TabKey {
  return TAB_KEYS.includes(value);
}

// Calendar ships in its own ticket (#32). Messages is this spec's
// deliberately reserved placeholder (v2 Chat/VC work). Dashboard's
// count/breakdown widgets shipped in #51 — its remaining widgets
// (heatmap #54, progress #55, contribution map #56, radar #57, peer
// comparison #58) are still to come, added onto DashboardTab as they ship.
const TAB_NOTES: Record<
  Exclude<TabKey, "overview" | "list" | "board" | "timeline" | "files" | "dashboard">,
  string
> = {
  calendar: "Calendar view ships in its own ticket (#32).",
  messages: "Reserved — Messages ships with the v2 Chat/VC system.",
};

function tabHref(workspaceId: string, listId: string, tab: TabKey): string {
  return tab === "overview"
    ? `/workspaces/${workspaceId}/lists/${listId}`
    : `/workspaces/${workspaceId}/lists/${listId}?tab=${tab}`;
}

function RolesColumn({
  title,
  entries,
  removeLabel,
  bindRemove,
}: {
  title: string;
  entries: { userId: string; name: string }[];
  removeLabel?: string;
  bindRemove?: (userId: string) => (formData: FormData) => Promise<void>;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{title}</div>
      {entries.length === 0 ? (
        <div className="mt-2 text-sm text-neutral-600">No one yet.</div>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li key={entry.userId} className="flex items-center justify-between gap-2 text-sm text-neutral-300">
              <span className="truncate">{entry.name}</span>
              {bindRemove && (
                <form action={bindRemove(entry.userId)}>
                  <button type="submit" className="text-xs text-neutral-600 hover:text-[#ff8a70]">
                    {removeLabel ?? "Remove"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverviewTab({
  data,
  boundUpdateDescription,
  boundAddMember,
  boundRemoveMember,
  boundGrantGuest,
  boundRevokeGuest,
}: {
  data: ListPageData;
  boundUpdateDescription: (formData: FormData) => Promise<void>;
  boundAddMember: (formData: FormData) => Promise<void>;
  boundRemoveMember: (userId: string) => (formData: FormData) => Promise<void>;
  boundGrantGuest: (formData: FormData) => Promise<void>;
  boundRevokeGuest: (userId: string) => (formData: FormData) => Promise<void>;
}) {
  const canManage = data.canEditDescription;

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
          Description
        </div>
        {canManage ? (
          <form action={boundUpdateDescription} className="mt-2 flex flex-col gap-2">
            <textarea
              name="description"
              defaultValue={data.description ?? ""}
              placeholder="What is this List for?"
              rows={3}
              className="w-full rounded-md border border-neutral-700 bg-[#141414] px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
            />
            <button
              type="submit"
              className="self-start rounded-md bg-[#ff6b4a] px-4 py-1.5 text-sm font-medium text-[#1a0800] hover:bg-[#ff8a70]"
            >
              Save
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-neutral-400">
            {data.description || "No description yet."}
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
          Roles
        </div>
        <div className="grid grid-cols-4 gap-6 rounded-lg border border-neutral-800 bg-[#0d0d0d] p-4">
          <RolesColumn title="Lead" entries={data.roles.leads} bindRemove={canManage ? boundRemoveMember : undefined} />
          <RolesColumn title="Member" entries={data.roles.members} bindRemove={canManage ? boundRemoveMember : undefined} />
          <RolesColumn title="Viewer" entries={data.roles.viewers} bindRemove={canManage ? boundRemoveMember : undefined} />
          <RolesColumn
            title="Guest"
            entries={data.roles.guests}
            removeLabel="Revoke"
            bindRemove={canManage ? boundRevokeGuest : undefined}
          />
        </div>

        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {data.eligibleMembers.length > 0 && (
              <form action={boundAddMember} className="flex items-center gap-2">
                <select
                  name="userId"
                  required
                  defaultValue=""
                  className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
                >
                  <option value="" disabled>
                    Add a Workspace Member…
                  </option>
                  {data.eligibleMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <select
                  name="role"
                  defaultValue="MEMBER"
                  className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
                >
                  <option value="MEMBER">as Member</option>
                  <option value="VIEWER">as Viewer</option>
                </select>
                <button
                  type="submit"
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
                >
                  Add
                </button>
              </form>
            )}

            <form action={boundGrantGuest} className="flex items-center gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="Grant Guest access by email"
                className="min-w-56 rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Grant
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ListPage({ params, searchParams }: Props) {
  const { workspaceId, listId } = await params;
  const query = await searchParams;
  const session = await requireAuthenticatedSession(`/workspaces/${workspaceId}/lists/${listId}`);

  const data = await loadListPageData(prisma, { userId: session.user.id, workspaceId, listId });

  if (!data) {
    notFound();
  }

  const activeTab: TabKey = query.tab && isTabKey(query.tab) ? query.tab : "overview";
  const boundUpdateDescription = updateListDescriptionAction.bind(null, workspaceId, listId);
  const boundAddMember = addListMemberAction.bind(null, workspaceId, listId);
  const boundRemoveMember = (userId: string) => removeListMemberAction.bind(null, workspaceId, listId, userId);
  const boundGrantGuest = grantGuestAccessAction.bind(null, workspaceId, listId);
  const boundRevokeGuest = (userId: string) => revokeGuestAccessAction.bind(null, workspaceId, listId, userId);
  const boundAddSection = addSectionAction.bind(null, workspaceId, listId);
  const boundRenameSection = (sectionId: string) => renameSectionAction.bind(null, workspaceId, listId, sectionId);
  const boundDuplicateSection = (sectionId: string) => duplicateSectionAction.bind(null, workspaceId, listId, sectionId);
  const boundDeleteSection = (sectionId: string) => deleteSectionAction.bind(null, workspaceId, listId, sectionId);
  const boundMoveSection = (sectionId: string, direction: "up" | "down") =>
    moveSectionAction.bind(null, workspaceId, listId, sectionId, direction);
  const boundSetGroupBy = setListGroupByAction.bind(null, workspaceId, listId);
  const boundAddItem = (sectionId: string | null) => addItemAction.bind(null, workspaceId, listId, sectionId);
  const boundSetBoardGroupBy = setBoardGroupByAction.bind(null, workspaceId, listId);
  const boundMoveItem = moveItemToColumnAction.bind(null, workspaceId, listId, data.boardGroupBy);
  const boundRestoreItem = (itemId: string) => restoreItemAction.bind(null, workspaceId, listId, itemId);

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <a
            href={`/workspaces/${workspaceId}/lists`}
            className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a] hover:text-[#ff8a70]"
          >
            {"// Back to Lists"}
          </a>
        </div>

        <h1 className="text-3xl font-light text-white">{data.name}</h1>

        <nav className="mt-6 flex flex-wrap items-center gap-6 border-b border-neutral-800 text-sm">
          {TABS.map((tab) => (
            <a
              key={tab.key}
              href={tabHref(workspaceId, listId, tab.key)}
              className={
                activeTab === tab.key
                  ? "border-b-2 border-[#ff6b4a] pb-3 text-white"
                  : "pb-3 text-neutral-500 hover:text-neutral-300"
              }
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {activeTab === "overview" ? (
          <OverviewTab
            data={data}
            boundUpdateDescription={boundUpdateDescription}
            boundAddMember={boundAddMember}
            boundRemoveMember={boundRemoveMember}
            boundGrantGuest={boundGrantGuest}
            boundRevokeGuest={boundRevokeGuest}
          />
        ) : activeTab === "list" ? (
          <SectionList
            sections={data.sections}
            unsectionedItems={data.unsectionedItems}
            archivedItems={data.archivedItems}
            canManage={data.canManageSections}
            groupBy={data.groupBy}
            workspaceId={workspaceId}
            listId={listId}
            boundAddSection={boundAddSection}
            boundRenameSection={boundRenameSection}
            boundDuplicateSection={boundDuplicateSection}
            boundDeleteSection={boundDeleteSection}
            boundMoveSection={boundMoveSection}
            boundSetGroupBy={boundSetGroupBy}
            boundAddItem={boundAddItem}
            boundRestoreItem={boundRestoreItem}
          />
        ) : activeTab === "board" ? (
          <BoardView
            columns={data.boardColumns}
            groupBy={data.boardGroupBy}
            canManage={data.canManageSections}
            workspaceId={workspaceId}
            listId={listId}
            archivedItems={data.archivedItems}
            boundSetGroupBy={boundSetBoardGroupBy}
            boundMoveItem={boundMoveItem}
            boundRestoreItem={boundRestoreItem}
          />
        ) : activeTab === "timeline" ? (
          <TimelineView items={data.timelineItems} workspaceId={workspaceId} listId={listId} />
        ) : activeTab === "files" ? (
          <FilesView entries={data.filesViewEntries} workspaceId={workspaceId} listId={listId} />
        ) : activeTab === "dashboard" ? (
          <DashboardTab
            counts={data.dashboard.counts}
            bySection={data.dashboard.bySection}
            byState={data.dashboard.byState}
            completionOverTime={data.dashboard.completionOverTime}
          />
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
            {TAB_NOTES[activeTab]}
          </div>
        )}
      </div>
    </main>
  );
}
