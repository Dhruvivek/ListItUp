import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import {
  addChildItemAction,
  addItemAssigneeAction,
  addItemDependencyAction,
  applyExistingLabelAction,
  createAndApplyLabelAction,
  defineCustomFieldAction,
  removeItemAssigneeAction,
  removeItemDependencyAction,
  removeItemLabelAction,
  setItemCustomFieldValueAction,
  transitionItemStateAction,
  updateItemDetailsAction,
} from "./actions";
import { loadItemDetailData } from "./page-data";
import { StateControl } from "./StateControl";

type Props = {
  params: Promise<{ workspaceId: string; listId: string; itemId: string }>;
};

const STATE_LABEL: Record<string, string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
  ARCHIVED: "Archived",
};

export default async function ItemDetailPage({ params }: Props) {
  const { workspaceId, listId, itemId } = await params;
  const session = await requireAuthenticatedSession(
    `/workspaces/${workspaceId}/lists/${listId}/items/${itemId}`
  );

  const data = await loadItemDetailData(prisma, { userId: session.user.id, workspaceId, listId, itemId });

  if (!data) {
    notFound();
  }

  const boundUpdateDetails = updateItemDetailsAction.bind(null, workspaceId, listId, itemId);
  const boundTransition = transitionItemStateAction.bind(null, workspaceId, listId, itemId);
  const boundAddAssignee = addItemAssigneeAction.bind(null, workspaceId, listId, itemId);
  const boundRemoveAssignee = (userId: string) => removeItemAssigneeAction.bind(null, workspaceId, listId, itemId, userId);
  const boundAddChild = addChildItemAction.bind(null, workspaceId, listId, itemId);
  const boundApplyExistingLabel = applyExistingLabelAction.bind(null, workspaceId, listId, itemId);
  const boundRemoveLabel = (labelId: string) => removeItemLabelAction.bind(null, workspaceId, listId, itemId, labelId);
  const boundCreateAndApplyLabel = createAndApplyLabelAction.bind(null, workspaceId, listId, itemId);
  const boundSetCustomFieldValue = (definitionId: string) =>
    setItemCustomFieldValueAction.bind(null, workspaceId, listId, itemId, definitionId);
  const boundDefineCustomField = defineCustomFieldAction.bind(null, workspaceId, listId, itemId);
  const boundAddDependency = addItemDependencyAction.bind(null, workspaceId, listId, itemId);
  const boundRemoveDependency = (blockerId: string, blockedId: string) =>
    removeItemDependencyAction.bind(null, workspaceId, listId, itemId, blockerId, blockedId);

  const unassignedMembers = data.assignableMembers.filter(
    (member) => !data.assignees.some((assignee) => assignee.userId === member.userId)
  );

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <a
            href={`/workspaces/${workspaceId}/lists/${listId}?tab=list`}
            className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a] hover:text-[#ff8a70]"
          >
            {"// " + data.listName}
          </a>
        </div>

        {data.parent && (
          <a
            href={`/workspaces/${workspaceId}/lists/${listId}/items/${data.parent.id}`}
            className="mb-2 inline-block text-xs text-neutral-500 hover:text-neutral-300"
          >
            ↑ {data.parent.title}
          </a>
        )}

        {data.canEdit ? (
          <form action={boundUpdateDetails} className="flex flex-col gap-4">
            <input
              type="text"
              name="title"
              defaultValue={data.title}
              className="w-full bg-transparent text-2xl font-light text-white focus:outline-none"
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Section
                </div>
                <select
                  name="sectionId"
                  defaultValue={data.sectionId ?? ""}
                  className="w-full rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                >
                  <option value="">No Section</option>
                  {data.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Priority
                </div>
                <select
                  name="priority"
                  defaultValue={data.priority}
                  className="w-full rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Due date
                </div>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={data.dueDate ? data.dueDate.toISOString().slice(0, 10) : ""}
                  className="w-full rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="self-start rounded-md bg-[#ff6b4a] px-4 py-1.5 text-sm font-medium text-[#1a0800] hover:bg-[#ff8a70]"
            >
              Save
            </button>
          </form>
        ) : (
          <div>
            <h1 className="text-2xl font-light text-white">{data.title}</h1>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-neutral-400">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Section</div>
                {data.sections.find((s) => s.id === data.sectionId)?.name ?? "No Section"}
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Priority</div>
                {data.priority}
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Due date</div>
                {data.dueDate ? data.dueDate.toLocaleDateString() : "None"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">State</div>
          {data.canEdit ? (
            <StateControl
              currentState={data.state}
              currentBlockerReason={data.blockerReason}
              boundTransition={boundTransition}
            />
          ) : (
            <div className="text-sm text-neutral-300">{STATE_LABEL[data.state]}</div>
          )}
          {!data.canEdit && data.blockerReason && (
            <div className="mt-2 rounded-md border border-amber-900 bg-amber-950/30 px-3 py-2 text-xs text-amber-400">
              {data.blockerReason}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Assignees
          </div>
          <ul className="flex flex-col gap-1.5">
            {data.assignees.map((assignee) => (
              <li key={assignee.userId} className="flex items-center justify-between text-sm text-neutral-300">
                <span>{assignee.name}</span>
                {data.canEdit && (
                  <form action={boundRemoveAssignee(assignee.userId)}>
                    <button type="submit" className="text-xs text-neutral-600 hover:text-[#ff8a70]">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
            {data.assignees.length === 0 && <li className="text-sm text-neutral-600">No one yet.</li>}
          </ul>
          {data.canEdit && unassignedMembers.length > 0 && (
            <form action={boundAddAssignee} className="mt-3 flex items-center gap-2">
              <select
                name="userId"
                required
                defaultValue=""
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
              >
                <option value="" disabled>
                  Add an Assignee…
                </option>
                {unassignedMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Add
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">Labels</div>
          <div className="flex flex-wrap gap-2">
            {data.labels.map((label) => (
              <span
                key={label.id}
                className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-[#141414] px-2.5 py-1 text-xs text-neutral-300"
              >
                {label.name}
                {data.canEdit && (
                  <form action={boundRemoveLabel(label.id)}>
                    <button type="submit" className="text-neutral-600 hover:text-[#ff8a70]">
                      ×
                    </button>
                  </form>
                )}
              </span>
            ))}
            {data.labels.length === 0 && <span className="text-sm text-neutral-600">None yet.</span>}
          </div>
          {data.canEdit && data.availableLabels.length > 0 && (
            <form action={boundApplyExistingLabel} className="mt-3 flex items-center gap-2">
              <select
                name="labelId"
                required
                defaultValue=""
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
              >
                <option value="" disabled>
                  Apply a Label…
                </option>
                {data.availableLabels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Apply
              </button>
            </form>
          )}
          {data.canCreateLabel && (
            <form action={boundCreateAndApplyLabel} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                name="name"
                placeholder="New Label name"
                required
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Create &amp; apply
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Custom Fields
          </div>
          <div className="flex flex-col gap-3">
            {data.customFieldDefinitions.map((definition) => (
              <div key={definition.id} className="flex items-center gap-3">
                <span className="w-36 flex-shrink-0 text-sm text-neutral-400">{definition.name}</span>
                {data.canEdit ? (
                  <form
                    action={boundSetCustomFieldValue(definition.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    {definition.type === "DROPDOWN" ? (
                      <select
                        name="value"
                        defaultValue={data.customFieldValues[definition.id] ?? ""}
                        className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                      >
                        <option value="">—</option>
                        {definition.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={definition.type === "DATE" ? "date" : definition.type === "NUMBER" ? "number" : "text"}
                        name="value"
                        defaultValue={data.customFieldValues[definition.id] ?? ""}
                        className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                      />
                    )}
                    <button type="submit" className="text-xs text-neutral-500 hover:text-[#ff8a70]">
                      Save
                    </button>
                  </form>
                ) : (
                  <span className="text-sm text-neutral-300">
                    {data.customFieldValues[definition.id] ?? "—"}
                  </span>
                )}
              </div>
            ))}
            {data.customFieldDefinitions.length === 0 && (
              <span className="text-sm text-neutral-600">None defined yet.</span>
            )}
          </div>
          {data.canDefineCustomFields && (
            <form action={boundDefineCustomField} className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="text"
                name="name"
                placeholder="New field name"
                required
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <select
                name="type"
                defaultValue="TEXT"
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="DATE">Date</option>
              </select>
              <input
                type="text"
                name="options"
                placeholder="Dropdown options, comma-separated"
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Define field
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Dependencies
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-neutral-500">Is blocked by</div>
              <ul className="mt-1 flex flex-col gap-1">
                {data.blockedBy.map((blocker) => (
                  <li key={blocker.id} className="flex items-center justify-between text-sm">
                    <a
                      href={`/workspaces/${workspaceId}/lists/${blocker.listId}/items/${blocker.id}`}
                      className="text-neutral-300 hover:text-white hover:underline"
                    >
                      ← {blocker.title}
                    </a>
                    {data.canEdit && (
                      <form action={boundRemoveDependency(blocker.id, data.itemId)}>
                        <button type="submit" className="text-xs text-neutral-600 hover:text-[#ff8a70]">
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
                {data.blockedBy.length === 0 && <li className="text-sm text-neutral-600">None.</li>}
              </ul>
            </div>

            <div>
              <div className="text-xs text-neutral-500">Blocks</div>
              <ul className="mt-1 flex flex-col gap-1">
                {data.blocking.map((blocked) => (
                  <li key={blocked.id} className="flex items-center justify-between text-sm">
                    <a
                      href={`/workspaces/${workspaceId}/lists/${blocked.listId}/items/${blocked.id}`}
                      className="text-neutral-300 hover:text-white hover:underline"
                    >
                      → {blocked.title}
                    </a>
                    {data.canEdit && (
                      <form action={boundRemoveDependency(data.itemId, blocked.id)}>
                        <button type="submit" className="text-xs text-neutral-600 hover:text-[#ff8a70]">
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
                {data.blocking.length === 0 && <li className="text-sm text-neutral-600">None.</li>}
              </ul>
            </div>
          </div>

          {data.canEdit && (
            <form action={boundAddDependency} className="mt-3 flex flex-wrap items-center gap-2">
              <select
                name="direction"
                defaultValue="blockedBy"
                className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
              >
                <option value="blockedBy">Is blocked by…</option>
                <option value="blocks">Blocks…</option>
              </select>
              {data.sameListItems.length > 0 ? (
                <select
                  name="targetItemId"
                  required
                  defaultValue=""
                  className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200"
                >
                  <option value="" disabled>
                    Choose an Item in this List…
                  </option>
                  {data.sameListItems.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="targetItemId"
                  placeholder="Item ID (works across Lists too)"
                  required
                  className="rounded-md border border-neutral-700 bg-[#141414] px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
                />
              )}
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Link
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-xs text-neutral-600">Created by {data.creatorName}</div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Child Items
          </div>
          <ul className="flex flex-col gap-1.5">
            {data.children.map((child) => (
              <li key={child.id}>
                <a
                  href={`/workspaces/${workspaceId}/lists/${listId}/items/${child.id}`}
                  className="text-sm text-neutral-300 hover:text-white hover:underline"
                >
                  ↳ {child.title}
                </a>
              </li>
            ))}
            {data.children.length === 0 && <li className="text-sm text-neutral-600">None yet.</li>}
          </ul>
          {data.canEdit && (
            <form action={boundAddChild} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                name="title"
                placeholder="Add a child Item"
                required
                className="flex-1 rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
