"use client";

import { useState } from "react";

import type { ItemState } from "@/generated/prisma/client";

const STATES: { value: ItemState; label: string }[] = [
  { value: "TO_DO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Complete" },
  { value: "ARCHIVED", label: "Archived" },
];

export function StateControl({
  currentState,
  currentBlockerReason,
  boundTransition,
}: {
  currentState: ItemState;
  currentBlockerReason: string | null;
  boundTransition: (formData: FormData) => Promise<void>;
}) {
  const [selected, setSelected] = useState<ItemState>(currentState);

  return (
    <form action={boundTransition} className="flex flex-col gap-2">
      <select
        name="state"
        value={selected}
        onChange={(event) => setSelected(event.target.value as ItemState)}
        className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
      >
        {STATES.map((state) => (
          <option key={state.value} value={state.value}>
            {state.label}
          </option>
        ))}
      </select>

      {selected === "BLOCKED" && (
        <input
          type="text"
          name="blockerReason"
          defaultValue={currentBlockerReason ?? ""}
          placeholder="Blocker reason (required)"
          required
          className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
        />
      )}

      <button
        type="submit"
        className="self-start rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
      >
        Update state
      </button>
    </form>
  );
}
