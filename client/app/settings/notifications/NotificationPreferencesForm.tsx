"use client";

import { useActionState } from "react";

import type { PreferenceCategory } from "@/lib/notification/notification-preferences";

import {
  updateNotificationPreferencesAction,
  type UpdateNotificationPreferencesState,
} from "./actions";

const CATEGORY_LABEL: Record<PreferenceCategory, string> = {
  assignee: "Assignee change",
  noteOrMention: "Note / Mention",
  state: "Item state change",
  dueDateReminder: "Due-date reminder",
};

const CATEGORY_DESCRIPTION: Record<PreferenceCategory, string> = {
  assignee: "When you're assigned to or removed from an Item.",
  noteOrMention:
    "When a Note is added to one of your Items, or you're @mentioned.",
  state: "When an Item you're assigned to changes state.",
  dueDateReminder: "As the due date on an Item you're assigned to approaches.",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as PreferenceCategory[];

const primaryButtonClass =
  "mt-2 inline-flex h-[58px] min-h-[58px] items-center justify-center gap-3 border border-[#ff6b4a] bg-[#ff6b4a] px-6 py-4 text-sm font-medium text-black shadow-[0_0_0_1px_rgba(255,107,74,.18),0_18px_60px_rgba(255,107,74,.12)] transition-colors hover:bg-[#ff8a70] focus:outline-none focus:ring-2 focus:ring-[#ff8a70] focus:ring-offset-2 focus:ring-offset-[#080808] disabled:cursor-not-allowed disabled:opacity-60";

const initialState: UpdateNotificationPreferencesState = { status: "idle" };

export function NotificationPreferencesForm({
  enabledByCategory,
}: {
  enabledByCategory: Record<PreferenceCategory, boolean>;
}) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferencesAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-5">
      {CATEGORIES.map((category) => (
        <label
          key={category}
          className="flex items-start justify-between gap-4 border border-[#1a1a1a] bg-[#0d0d0d]/95 px-4 py-4"
        >
          <span>
            <span className="block text-sm text-white">
              {CATEGORY_LABEL[category]}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {CATEGORY_DESCRIPTION[category]}
            </span>
          </span>
          <input
            type="checkbox"
            name={category}
            defaultChecked={enabledByCategory[category]}
            className="mt-1 h-4 w-4 shrink-0 accent-[#ff6b4a]"
          />
        </label>
      ))}

      {state.status === "success" ? (
        <p role="status" className="text-sm text-neutral-300">
          Notification preferences updated.
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
