import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolveRootRedirect } from "@/lib/session/root-landing";
import { resolveDefaultWorkspaceId } from "@/lib/workspace/default-workspace";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const defaultWorkspaceId = session
    ? await resolveDefaultWorkspaceId(prisma, session.user.id)
    : null;

  redirect(resolveRootRedirect(session, defaultWorkspaceId));
}
