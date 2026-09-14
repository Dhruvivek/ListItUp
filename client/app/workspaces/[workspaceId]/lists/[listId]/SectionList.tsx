"use client";

import { useState } from "react";

import type { SectionSummary } from "./page-data";

// Item count per Section is always 0 until lib/item/ ships (#30) — Section
// management and the List view's grouping mechanics are this ticket's
// scope, not Item rendering.
const ITEM_COUNT_PER_SECTION = 0;

export function SectionList({
  sections,
  canManage,
  groupBy,
  boundAddSection,
  boundRenameSection,
  boundDuplicateSection,
  boundDeleteSection,
  boundMoveSection,
  boundSetGroupBy,
}: {
  sections: SectionSummary[];
  canManage: boolean;
  groupBy: string;
  boundAddSection: (formData: FormData) => Promise<void>;
  boundRenameSection: (sectionId: string) => (formData: FormData) => Promise<void>;
  boundDuplicateSection: (sectionId: string) => () => Promise<void>;
  boundDeleteSection: (sectionId: string) => () => Promise<void>;
  boundMoveSection: (sectionId: string, direction: "up" | "down") => () => Promise<void>;
  boundSetGroupBy: (formData: FormData) => Promise<void>;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [hideEmpty, setHideEmpty] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  function toggleCollapsed(sectionId: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  const visibleSections = hideEmpty
    ? sections.filter(() => ITEM_COUNT_PER_SECTION > 0)
    : sections;

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canManage && (
          <form action={boundAddSection} className="flex items-center gap-2">
            <input
              type="text"
              name="name"
              placeholder="New Section name"
              required
              className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#ff6b4a] px-4 py-1.5 text-sm font-medium text-[#1a0800] hover:bg-[#ff8a70]"
            >
              Add Section
            </button>
          </form>
        )}

        {canManage && (
          <form action={boundSetGroupBy} className="flex items-center gap-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Add Rule — group by
            </label>
            <select
              name="groupBy"
              defaultValue={groupBy}
              className="rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200"
            >
              <option value="SECTION">Section</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
            >
              Apply
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setHideEmpty((current) => !current)}
          className={
            hideEmpty
              ? "rounded-full border border-[#ff6b4a] px-3 py-1 text-xs text-[#ff8a70]"
              : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
          }
        >
          Hide empty Sections
        </button>
      </div>

      {visibleSections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-16 text-center text-sm text-neutral-600">
          {sections.length === 0
            ? "No Sections yet."
            : "Every Section is empty — toggle “Hide empty Sections” off to see them."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleSections.map((section) => {
            const collapsed = collapsedIds.has(section.id);
            const isRenaming = renamingId === section.id;

            return (
              <div key={section.id} className="rounded-lg border border-neutral-800 bg-[#0d0d0d]">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(section.id)}
                    aria-label={collapsed ? "Expand Section" : "Collapse Section"}
                    className="text-neutral-500 hover:text-neutral-200"
                  >
                    {collapsed ? "▸" : "▾"}
                  </button>

                  {isRenaming ? (
                    <form
                      action={async (formData) => {
                        await boundRenameSection(section.id)(formData);
                        setRenamingId(null);
                      }}
                      className="flex flex-1 items-center gap-2"
                    >
                      <input
                        type="text"
                        name="name"
                        defaultValue={section.name}
                        autoFocus
                        className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-2 py-1 text-sm text-neutral-200 focus:border-[#ff6b4a] focus:outline-none"
                      />
                      <button type="submit" className="text-xs text-[#ff8a70]">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-xs text-neutral-500 hover:text-neutral-300"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span className="flex-1 text-sm font-semibold text-white">{section.name}</span>
                  )}

                  <span className="font-mono text-xs text-neutral-600">
                    {ITEM_COUNT_PER_SECTION} items
                  </span>

                  {canManage && !isRenaming && (
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <button
                        type="button"
                        onClick={() => setRenamingId(section.id)}
                        className="hover:text-neutral-200"
                      >
                        Rename
                      </button>
                      <form action={boundDuplicateSection(section.id)}>
                        <button type="submit" className="hover:text-neutral-200">
                          Duplicate
                        </button>
                      </form>
                      <form action={boundMoveSection(section.id, "up")}>
                        <button type="submit" className="hover:text-neutral-200">
                          Move up
                        </button>
                      </form>
                      <form action={boundMoveSection(section.id, "down")}>
                        <button type="submit" className="hover:text-neutral-200">
                          Move down
                        </button>
                      </form>
                      <form action={boundDeleteSection(section.id)}>
                        <button type="submit" className="hover:text-[#ff8a70]">
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <div className="border-t border-neutral-800 px-4 py-6 text-center text-xs text-neutral-600">
                    Items ship in their own ticket (#30).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
