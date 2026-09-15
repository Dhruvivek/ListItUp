import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import { NotificationPreferencesForm } from "./NotificationPreferencesForm";
import { loadNotificationsPreferencesPageData } from "./page-data";

export default async function NotificationsSettingsPage() {
  const session = await requireAuthenticatedSession("/settings/notifications");
  const data = await loadNotificationsPreferencesPageData(
    prisma,
    session.user.id
  );

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// Settings"}
          </span>
        </div>

        <h1 className="text-3xl font-light text-white">Manage Notifications</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-400">
          Choose which changes notify you. Turning a type off stops new
          notifications of that kind from being created for you.
        </p>

        <section className="mt-10">
          <NotificationPreferencesForm
            enabledByCategory={data.enabledByCategory}
          />
        </section>
      </div>
    </main>
  );
}
