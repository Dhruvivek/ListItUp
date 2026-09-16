import { Bell, ChevronRight, Search } from "lucide-react";
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
  const timeLabel = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-[#232323] bg-[#0d0d0d] px-7">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-mono-label)] text-[11px] uppercase tracking-[0.08em] text-[#5a5a56]">
            Workspace
          </span>
          <ChevronRight className="h-3 w-3 text-[#5a5a56]" />
          <span className="text-[13px] font-semibold text-[#e5e5e0]">Home</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] border border-[#333333] bg-[#141414] text-[#8f8f8a] hover:bg-[#1a1a1a] hover:text-[#e5e5e0]"
          >
            <Search className="h-[15px] w-[15px]" />
          </button>
          <a
            href="/updates"
            aria-label="Updates"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] border border-[#333333] bg-[#141414] text-[#8f8f8a] hover:bg-[#1a1a1a] hover:text-[#e5e5e0]"
          >
            <Bell className="h-[15px] w-[15px]" />
          </a>
        </div>
      </header>

      <main className="flex-1 bg-[#080808] px-10 pb-16 pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <div className="mb-2 font-[family-name:var(--font-mono-label)] text-[11px] uppercase tracking-[0.08em] text-[#ff8a70]">
              {dateLabel}
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight text-[#e5e5e0]">
              {greeting}, {session.user.name}
            </h1>
            <p className="mt-1 text-[13px] text-[#8f8f8a]">
              {timeLabel} — {data.workspaceName}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <MyTasksPreviewWidget
                items={data.myTasksPreview}
                workspaceId={workspaceId}
                workspaceName={data.workspaceName}
                viewerName={session.user.name}
                now={now}
              />
            </div>
            <RecentListsWidget lists={data.recentLists} workspaceId={workspaceId} />
            <div className="col-span-3">
              <AssignedByMeWidget items={data.assignedByMe} workspaceId={workspaceId} now={now} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
