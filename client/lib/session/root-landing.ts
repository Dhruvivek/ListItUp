export interface RootLandingSession {
  user: { id: string };
}

export function resolveRootRedirect(
  session: RootLandingSession | null,
  defaultWorkspaceId: string | null
): string {
  if (!session) return "/sign-in";
  return defaultWorkspaceId ? `/workspaces/${defaultWorkspaceId}` : "/my-tasks";
}
