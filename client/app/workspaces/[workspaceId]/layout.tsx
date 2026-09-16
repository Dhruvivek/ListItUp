import { JetBrains_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";

import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { loadWorkspaceNavData } from "./layout-data";

// DESIGN.md calls for Inter (display) + JetBrains Mono (labels/body) across
// the app; scoped to this subtree rather than the root layout since the
// rest of the app hasn't adopted the dark operational theme yet.
const inter = Inter({ variable: "--font-display", subsets: ["latin"] });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-mono-label", subsets: ["latin"] });

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

  const navData = await loadWorkspaceNavData(prisma, session.user.id, workspaceId);

  return (
    <div
      className={`${inter.variable} ${jetBrainsMono.variable} flex min-h-screen bg-[#080808] font-[family-name:var(--font-display)]`}
    >
      <WorkspaceSidebar
        currentWorkspaceId={workspaceId}
        currentWorkspaceName={membership.workspace.name}
        currentUserName={session.user.name}
        switchableWorkspaces={navData.switchableWorkspaces}
        personalSpace={navData.personalSpace}
        unreadNotificationCount={navData.unreadNotificationCount}
        lists={navData.lists}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
