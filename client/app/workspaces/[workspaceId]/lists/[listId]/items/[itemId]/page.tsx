import { notFound } from "next/navigation";

import { formatAttachmentSize } from "@/lib/item/item-attachments";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";

import {
  addChildItemAction,
  addItemAssigneeAction,
  addItemDependencyAction,
  addNoteAction,
  applyExistingLabelAction,
  archiveItemAction,
  createAndApplyLabelAction,
  defineCustomFieldAction,
  removeItemAssigneeAction,
  removeItemDependencyAction,
  removeItemLabelAction,
  restoreItemAction,
  setItemCustomFieldValueAction,
  transitionItemStateAction,
  updateItemDetailsAction,
  upsertPersonalNoteAction,
} from "./actions";
import { loadItemDetailData } from "./page-data";
import { StateControl } from "./StateControl";

type Props = {
  params: Promise<{ workspaceId: string; listId: string; itemId: string }>;
  searchParams: Promise<{ attachmentError?: string }>;
};

const STATE_LABEL: Record<string, string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
  ARCHIVED: "Archived",
};

// Keyed by the Route Handler's ?attachmentError= value (#39).
const ATTACHMENT_ERROR_MESSAGE: Record<string, string> = {
  "missing-file": "Choose a file to attach.",
  "type-not-allowed": "That file type isn't supported. Allowed: ZIP, images, PDFs, and common office documents.",
  "too-large": "That file is over the 1GB limit.",
  forbidden: "You don't have permission to attach files to this Item.",
  "item-not-found": "This Item no longer exists.",
};

export default async function ItemDetailPage({ params, searchParams }: Props) {
  const { workspaceId, listId, itemId } = await params;
  const { attachmentError } = await searchParams;
  const session = await requireAuthenticatedSession(
    `/workspaces/${workspaceId}/lists/${listId}/items/${itemId}`
  );

  const data = await loadItemDetailData(prisma, { userId: session.user.id, workspaceId, listId, itemId });

  if (!data) {
    notFound();
  }

  const boundUpdateDetails = updateItemDetailsAction.bind(null, workspaceId, listId, itemId);
  const boundTransition = transitionItemStateAction.bind(null, workspaceId, listId, itemId);
  const boundArchive = archiveItemAction.bind(null, workspaceId, listId, itemId);
  const boundRestore = restoreItemAction.bind(null, workspaceId, listId, itemId);
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
  const boundAddNote = addNoteAction.bind(null, workspaceId, listId, itemId);
  const boundUpsertPersonalNote = upsertPersonalNoteAction.bind(null, workspaceId, listId, itemId);

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
          {data.state === "ARCHIVED" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-300">Archived</span>
              {data.canEdit && (
                <form action={boundRestore}>
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
                  >
                    Restore
                  </button>
                </form>
              )}
            </div>
          ) : data.canEdit ? (
            <div className="flex flex-wrap items-start gap-3">
              <StateControl
                currentState={data.state}
                currentBlockerReason={data.blockerReason}
                boundTransition={boundTransition}
              />
              <form action={boundArchive}>
                <button
                  type="submit"
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-[#ff6b4a] hover:text-white"
                >
                  Archive
                </button>
              </form>
            </div>
          ) : (
            <div className="text-sm text-neutral-300">{STATE_LABEL[data.state]}</div>
          )}
          {data.state !== "ARCHIVED" && !data.canEdit && data.blockerReason && (
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

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Attachments
          </div>

          {attachmentError && (
            <p className="mb-2 text-sm text-[#ff8a70]">
              {ATTACHMENT_ERROR_MESSAGE[attachmentError] ?? "Couldn't attach that file."}
            </p>
          )}

          <ul className="flex flex-col gap-1.5">
            {data.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={`/api/workspaces/${workspaceId}/lists/${listId}/items/${itemId}/attachments/${attachment.id}`}
                  className="truncate text-neutral-300 hover:text-white hover:underline"
                >
                  {attachment.fileName}
                </a>
                <span className="flex-shrink-0 text-xs text-neutral-600">
                  {formatAttachmentSize(attachment.sizeBytes)} · {attachment.uploaderName}
                </span>
              </li>
            ))}
            {data.attachments.length === 0 && <li className="text-sm text-neutral-600">None yet.</li>}
          </ul>

          {data.canEdit && (
            <form
              action={`/api/workspaces/${workspaceId}/lists/${listId}/items/${itemId}/attachments`}
              method="POST"
              encType="multipart/form-data"
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="file"
                name="file"
                required
                className="flex-1 text-sm text-neutral-400 file:mr-3 file:rounded-md file:border file:border-neutral-700 file:bg-[#141414] file:px-3 file:py-1.5 file:text-sm file:text-neutral-200"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Attach
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">Notes</div>

          <ul className="flex flex-col gap-3">
            {data.notes.map((note) => (
              <li key={note.id} className="rounded-md border border-neutral-800 bg-[#0e0e0e] px-3 py-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{note.authorName}</span>
                  <span>{note.createdAt.toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-200">{note.body}</p>
                {note.mentions.length > 0 && (
                  <p className="mt-1.5 text-xs text-[#ff8a70]">
                    {note.mentions.map((mention) => `@${mention.name}`).join(" ")}
                  </p>
                )}
              </li>
            ))}
            {data.notes.length === 0 && <li className="text-sm text-neutral-600">None yet.</li>}
          </ul>

          {data.canEdit && (
            <form action={boundAddNote} className="mt-3 flex flex-col gap-2">
              <textarea
                name="body"
                placeholder="Add a Note…"
                required
                rows={2}
                className="w-full rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              {data.mentionCandidates.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {data.mentionCandidates.map((candidate) => (
                    <label key={candidate.userId} className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <input type="checkbox" name="mentionedUserIds" value={candidate.userId} />
                      @{candidate.name}
                    </label>
                  ))}
                </div>
              )}
              <button
                type="submit"
                className="self-start rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Add Note
              </button>
            </form>
          )}
        </div>

        {data.isAssignee && (
          <div className="mt-8">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                Personal Note
              </span>
              <span className="text-[11px] text-neutral-600">Only you can see this</span>
            </div>
            <form action={boundUpsertPersonalNote} className="flex flex-col gap-2">
              <textarea
                name="body"
                defaultValue={data.personalNote ?? ""}
                placeholder="Private planning notes…"
                rows={2}
                className="w-full rounded-md border border-neutral-700 bg-[#141414] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6b4a] focus:outline-none"
              />
              <button
                type="submit"
                className="self-start rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-[#ff6b4a] hover:text-white"
              >
                Save
              </button>
            </form>
          </div>
        )}

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
