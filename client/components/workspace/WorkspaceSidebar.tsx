"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";

import type { WorkspaceNavEntry } from "@/app/workspaces/[workspaceId]/layout-data";

type WorkspaceSidebarProps = {
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  switchableWorkspaces: WorkspaceNavEntry[];
  personalSpace: WorkspaceNavEntry | null;
};

export function WorkspaceSidebar({
  currentWorkspaceId,
  currentWorkspaceName,
  switchableWorkspaces,
  personalSpace,
}: WorkspaceSidebarProps) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isPersonalSpaceOpen, setIsPersonalSpaceOpen] = useState(false);

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col gap-1 border-r border-neutral-800 bg-[#0d0d0d] p-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsSwitcherOpen((open) => !open)}
          aria-expanded={isSwitcherOpen}
          aria-label="Switch Workspace"
          className="flex w-full items-center gap-2.5 rounded-md border border-neutral-800 bg-[#141414] px-2.5 py-2 text-left hover:border-neutral-700"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">
            {currentWorkspaceName}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-neutral-500" />
        </button>

        {isSwitcherOpen && (
          <ul className="absolute left-0 right-0 z-10 mt-1 rounded-md border border-neutral-800 bg-[#141414] py-1 shadow-lg">
            {switchableWorkspaces.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-500">No other Workspaces yet.</li>
            )}
            {switchableWorkspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/workspaces/${workspace.id}`}
                  className={
                    workspace.id === currentWorkspaceId
                      ? "block px-3 py-2 text-sm text-[#ff8a70]"
                      : "block px-3 py-2 text-sm text-neutral-300 hover:bg-[#1a1a1a] hover:text-white"
                  }
                >
                  {workspace.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setIsPersonalSpaceOpen((open) => !open)}
          aria-expanded={isPersonalSpaceOpen}
          disabled={!personalSpace}
          className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPersonalSpaceOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Personal Space
        </button>

        {isPersonalSpaceOpen && personalSpace && (
          <div className="flex flex-col gap-0.5 pl-2">
            <Link
              href={`/workspaces/${personalSpace.id}`}
              className="rounded-md px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-[#1a1a1a] hover:text-white"
            >
              {personalSpace.name}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
