import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { completeMyTaskItemAction } from "./actions";
import { MyTasksList } from "./MyTasksList";
import { loadMyTasksPageData } from "./page-data";

type Props = {
  searchParams: Promise<{ workspace?: string; completed?: string; archived?: string }>;
};

function myTasksHref(query: { workspace?: string; completed?: string; archived?: string }): string {
  const params = new URLSearchParams();
  if (query.workspace) params.set("workspace", query.workspace);
  if (query.completed) params.set("completed", query.completed);
  if (query.archived) params.set("archived", query.archived);
  const search = params.toString();
  return search ? `/my-tasks?${search}` : "/my-tasks";
}

export default async function MyTasksPage({ searchParams }: Props) {
  const session = await requireAuthenticatedSession("/my-tasks");
  const query = await searchParams;

  const sourceWorkspaceId = query.workspace || undefined;
  const includeCompleted = query.completed === "1";
  const includeArchived = query.archived === "1";
  const now = new Date();

  const data = await loadMyTasksPageData(prisma, {
    userId: session.user.id,
    sourceWorkspaceId,
    includeCompleted,
    includeArchived,
    now,
  });

  const boundComplete = (itemId: string) => completeMyTaskItemAction.bind(null, itemId);

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// My Tasks"}
          </span>
        </div>
        <h1 className="text-3xl font-light text-white">Welcome, {session.user.name}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
          Every Item assigned to you, unified across your Workspaces and Personal Space.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href={myTasksHref({ completed: query.completed, archived: query.archived })}
            className={
              !data.selectedWorkspaceId
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            All Workspaces
          </a>
          {data.filterWorkspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={myTasksHref({ workspace: workspace.id, completed: query.completed, archived: query.archived })}
              className={
                data.selectedWorkspaceId === workspace.id
                  ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                  : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
              }
            >
              {workspace.isPersonal ? "Personal Space" : workspace.name}
            </a>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={myTasksHref({
              workspace: query.workspace,
              completed: includeCompleted ? undefined : "1",
              archived: query.archived,
            })}
            className={
              includeCompleted
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            Completed
          </a>
          <a
            href={myTasksHref({
              workspace: query.workspace,
              completed: query.completed,
              archived: includeArchived ? undefined : "1",
            })}
            className={
              includeArchived
                ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
                : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            }
          >
            Archived
          </a>
        </div>

        <MyTasksList items={data.items} now={now} boundComplete={boundComplete} />

        {!includeCompleted && !includeArchived && (
          <p className="mt-3 text-xs text-neutral-600">
            Complete and Archived Items are hidden by default — use the filters above to reveal them.
          </p>
        )}
      </div>
    </main>
  );
}
