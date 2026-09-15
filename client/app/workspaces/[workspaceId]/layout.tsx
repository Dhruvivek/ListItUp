import { notFound } from "next/navigation";

import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { loadWorkspaceNavData } from "./layout-data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await requireAuthenticatedSession(`/workspaces/${workspaceId}`);

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  });

  if (!membership) {
    notFound();
  }

  const navData = await loadWorkspaceNavData(prisma, session.user.id);

  return (
    <div className="flex min-h-screen bg-[#080808]">
      <WorkspaceSidebar
        currentWorkspaceId={workspaceId}
        currentWorkspaceName={membership.workspace.name}
        switchableWorkspaces={navData.switchableWorkspaces}
        personalSpace={navData.personalSpace}
        unreadNotificationCount={navData.unreadNotificationCount}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
