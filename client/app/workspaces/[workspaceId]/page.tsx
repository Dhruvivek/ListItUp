import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { greetingForHour } from "./greeting";
import { AssignedByMeWidget, MyTasksPreviewWidget, RecentListsWidget } from "./HomeWidgets";
import { loadHomePageData } from "./page-data";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await requireAuthenticatedSession(`/workspaces/${workspaceId}`);

  const now = new Date();
  const data = await loadHomePageData(prisma, { userId: session.user.id, workspaceId, now });

  if (!data) {
    notFound();
  }

  const greeting = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// " + data.workspaceName}
          </span>
        </div>

        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">{dateLabel}</p>
        <h1 className="mt-2 text-3xl font-light text-white">
          {greeting}, {session.user.name}.
        </h1>

        <div className="mt-8 flex flex-col gap-4">
          <MyTasksPreviewWidget items={data.myTasksPreview} workspaceId={workspaceId} />
          <RecentListsWidget lists={data.recentLists} workspaceId={workspaceId} />
          <AssignedByMeWidget items={data.assignedByMe} workspaceId={workspaceId} />
        </div>
      </div>
    </main>
  );
}
