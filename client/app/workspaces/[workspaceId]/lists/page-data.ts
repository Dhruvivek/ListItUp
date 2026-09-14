import type { ListStatus, PrismaClient } from "@/generated/prisma/client";
import { browseLists, type ListSummary } from "@/lib/list/list-browsing";
import { isValidListStatus } from "@/lib/list/list-lifecycle";

export type ListBrowsingQuery = {
  tab?: string;
  search?: string;
  status?: string;
  member?: string;
  starred?: string;
};

export type ListBrowsingPageData = {
  workspaceName: string;
  lists: ListSummary[];
  workspaceMembers: { userId: string; name: string }[];
  archived: boolean;
  status?: ListStatus;
  search?: string;
  memberFilter?: string;
  starredOnly: boolean;
};

// Kept separate from the page component itself, and taking an injected
// PrismaClient rather than importing the app's shared singleton, so the
// data-loading and visibility logic can be exercised directly in a smoke
// test without a real Next.js request scope (headers()/session lookup lives
// only in page.tsx) and without lib/prisma.ts's server-only guard, which
// throws under plain tsx execution (see Architecture.md).
export async function loadListBrowsingPageData(
  database: PrismaClient,
  userId: string,
  workspaceId: string,
  query: ListBrowsingQuery
): Promise<ListBrowsingPageData | null> {
  const membership = await database.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });

  if (!membership) {
    return null;
  }

  const archived = query.tab === "archived";
  const status = query.status && isValidListStatus(query.status) ? query.status : undefined;
  const starredOnly = query.starred === "true";

  const [lists, members] = await Promise.all([
    browseLists(database, {
      userId,
      workspaceId,
      search: query.search,
      status,
      memberUserId: query.member,
      starredOnly,
      archived,
    }),
    database.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    workspaceName: membership.workspace.name,
    lists,
    workspaceMembers: members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
    })),
    archived,
    status,
    search: query.search,
    memberFilter: query.member,
    starredOnly,
  };
}
