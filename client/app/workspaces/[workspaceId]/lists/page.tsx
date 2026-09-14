import { notFound } from "next/navigation";

import type { ListStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import {
  archiveListAction,
  createListAction,
  restoreListAction,
  toggleListStarredAction,
} from "./actions";
import { loadListBrowsingPageData, type ListBrowsingQuery } from "./page-data";

type Props = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<ListBrowsingQuery>;
};

const STATUS_OPTIONS: { value: ListStatus; label: string }[] = [
  { value: "ON_TRACK", label: "On Track" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export default async function ListBrowsingPage({ params, searchParams }: Props) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const session = await requireAuthenticatedSession(`/workspaces/${workspaceId}/lists`);

  const data = await loadListBrowsingPageData(prisma, session.user.id, workspaceId, query);

  if (!data) {
    notFound();
  }

  const { lists, workspaceMembers, archived, status, search, memberFilter, starredOnly } = data;

  const boundArchive = archiveListAction.bind(null, workspaceId);
  const boundRestore = restoreListAction.bind(null, workspaceId);
  const boundToggleStarred = toggleListStarredAction.bind(null, workspaceId);
  const boundCreate = createListAction.bind(null, workspaceId);

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// " + data.workspaceName}
          </span>
        </div>

        <h1 className="text-3xl font-light text-white">Lists</h1>

        <nav className="mt-6 flex items-center gap-6 border-b border-neutral-800 text-sm">
          <a
            href={`/workspaces/${workspaceId}/lists`}
            className={
              archived
                ? "pb-3 text-neutral-500 hover:text-neutral-300"
                : "border-b-2 border-[#ff6b4a] pb-3 text-white"
            }
          >
            Lists
          </a>
          <a
            href={`/workspaces/${workspaceId}/lists?tab=archived`}
            className={
              archived
                ? "border-b-2 border-[#ff6b4a] pb-3 text-white"
                : "pb-3 text-neutral-500 hover:text-neutral-300"
            }
          >
            Archived
          </a>
        </nav>

        <form
          method="GET"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-[#0d0d0d] p-4"
        >
          {archived && <input type="hidden" name="tab" value="archived" />}
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search Lists by name"
            className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="member"
            defaultValue={memberFilter ?? ""}
            className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
          >
            <option value="">All Members</option>
            {workspaceMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input type="checkbox" name="starred" value="true" defaultChecked={starredOnly} />
            Starred only
          </label>
          <button
            type="submit"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
          >
            Apply
          </button>
        </form>

        {!archived && (
          <form action={boundCreate} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              name="name"
              placeholder="New List name"
              required
              className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#ff6b4a] px-4 py-1.5 text-sm font-medium text-[#1a0800] hover:bg-[#ff8a70]"
            >
              New List
            </button>
          </form>
        )}

        <ul className="mt-6 flex flex-col gap-2">
          {lists.map((list) => (
            <li
              key={list.id}
              className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-[#0d0d0d] px-4 py-3"
            >
              <form action={boundToggleStarred.bind(null, list.id)}>
                <button
                  type="submit"
                  aria-label={list.isStarredByViewer ? "Unstar List" : "Star List"}
                  className={
                    list.isStarredByViewer
                      ? "text-[#ff8a70]"
                      : "text-neutral-600 hover:text-neutral-400"
                  }
                >
                  ★
                </button>
              </form>

              <a
                href={`/workspaces/${workspaceId}/lists/${list.id}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <div className="truncate text-sm font-medium text-white">{list.name}</div>
                {list.description && (
                  <div className="truncate text-xs text-neutral-500">{list.description}</div>
                )}
              </a>

              <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                {list.status.replaceAll("_", " ")}
              </span>

              <span className="font-mono text-xs text-neutral-600">
                {list.memberCount} {list.memberCount === 1 ? "member" : "members"}
              </span>

              {archived ? (
                <form action={boundRestore.bind(null, list.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
                  >
                    Restore
                  </button>
                </form>
              ) : (
                <form action={boundArchive.bind(null, list.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
                  >
                    Archive
                  </button>
                </form>
              )}
            </li>
          ))}

          {lists.length === 0 && (
            <li className="rounded-lg border border-dashed border-neutral-800 px-4 py-10 text-center text-sm text-neutral-600">
              {archived ? "No archived Lists." : "No Lists match your filters yet."}
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
