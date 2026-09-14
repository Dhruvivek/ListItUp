# List & Item Core

## Problem Statement

`List` and `Item` are ListItUp's two central entities (ADR 0008), but nothing about them is built beyond a bare `List` row with a name. Users need a place to create, browse, and organize Lists; a way to control who can see and edit each List under the settled role model (ADR 0009); and a way to create, assign, track, and enrich the Items inside a List with the facets the domain model defines — state, Priority, Labels, Custom Fields, Dependencies, Notes, and Attachments. This is the largest single vertical slice of the product and the one every other feature surface (Home, My Tasks, Reports) reads from or writes into.

This spec depends on the Domain Model, Schema Migration & Permissions spec: it assumes the schema and `lib/permissions/` seam already exist and builds Server Actions, Server Components, and UI on top of them.

## Solution

Ship a List-browsing page, a per-List page with its Overview tab and views (List, Board, Calendar, Files, Timeline, and a reserved-but-empty Dashboard/Messages slot), List-level role and Guest management, Section management, and a full Item detail surface (Assignee, state, Priority, Blocker, Label, Custom Field values, Dependency, Attachment, Note with `@Mention`, and per-Assignee Personal Note). Archived Lists and Items are both browsable and restorable in v1.

Two new seams carry this spec's behavior: `lib/list/` (List CRUD, membership/role/Guest management, Sections, Starred, Status, Custom Field definitions) and `lib/item/` (Item CRUD and all its facets). Both call through `lib/permissions/` for every authorization check rather than querying membership tables directly.

## User Stories

1. As a User, I want to create a List in my Personal Space freely, so that I can organize my own work without needing anyone's approval.
2. As a Workspace Owner or Admin, I want to create a List inside a shared Workspace, so that I can set up new work areas for the team.
3. As a Workspace Member without Admin rights, I want List creation to be unavailable to me in a shared Workspace, so that shared Workspace structure stays controlled.
4. As a List's creator, I want to become its first List Lead automatically, so that I retain control of the List I just made.
5. As a User, I want a dedicated List-browsing page scoped to the Workspace or Personal Space I currently have open, so that I can find Lists without hunting through navigation.
6. As a User on the List-browsing page, I want to search Lists by name and filter by Status, Members, and Starred, so that I can narrow a long list down quickly.
7. As a User, I want to Star a List from the browsing page, so that I can mark it for quick access independent of anyone else's view.
8. As a List Lead or Workspace Admin, I want to set a List's Status (On Track, On Hold, Completed, Dropped), so that I can communicate its coarse health to everyone with access.
9. As a User, I want an Archived tab on the List-browsing page listing Lists I have access to that were archived, so that I can find and restore them later.
10. As a List Lead or Workspace Admin, I want to Archive or Restore a List, so that I can retire or bring back a List without deleting its data.
11. As a User opening a List, I want an Overview tab showing its Description and its Roles (who has List Lead, Member, Viewer, and Guest access), so that I understand the List's purpose and who is on it before diving into Items.
12. As a List Lead or Workspace Admin, I want to edit a List's Description from its Overview tab, so that I can keep the List's purpose current.
13. As a List Lead, I want to add or remove a List-level Member or Viewer from a List, restricted to Users who already belong to the List's Workspace, so that I control List membership at the point closest to the data.
14. As a List Lead or Workspace Admin, I want to grant or revoke Guest access to a List for a person without adding them to the Workspace, so that I can bring in an external collaborator scoped to exactly this List.
15. As a Workspace Viewer added to a List with a higher List-level role, I want my effective access to stay read-only, so that the Viewer ceiling holds no matter what List role I am given.
16. As a User with access to a List, I want a List view showing its Items organized into Sections, so that I can see the List's structure at a glance.
17. As a List Lead, List Member, or Workspace Admin/Owner, I want to Add, Rename, Duplicate, or Delete a Section within a List view, so that I can reorganize the List's structure as work evolves.
18. As a User in a List's List view, I want to Expand/Collapse a Section's Items and Hide Empty Sections, so that I can manage visual clutter on a busy List.
19. As a User with access to a List, I want a Board view grouping the List's Items into columns by a field I choose (Section, state, Assignee, or another grouping field), so that I can work the List Kanban-style.
20. As a User moving an Item between Board columns, I want the Item's grouped field (for example, its state) to update to match the column I moved it into, so that the board stays consistent with the Item's data.
21. As a User with access to a List, I want a Calendar view placing Items on the day of their due date, so that I can see the List's schedule.
22. As a User with access to a List, I want a Files view aggregating every Attachment across the List's Items in one place, so that I do not have to open each Item to find a file.
23. As a User with access to a List, I want a Timeline view showing each Item with a due date as a date-based bar, so that I can see the List's schedule at a glance, understanding that Dependency arrows are not rendered in this release.
24. As a User opening a List, I want to see reserved Dashboard and Messages tabs in the List's navigation even though their content is not built yet, so that the List's overall tab structure does not change shape again when those specs ship.
25. As a List Member, I want to create an Item inside a List, choosing its title, Section, Assignees, Priority, and due date, so that I can capture actionable work with the context it needs.
26. As a List Viewer or Guest, I want Item creation and editing to be unavailable to me, so that read-only access is enforced everywhere Items are shown.
27. As an Item's Creator, I want my Creator attribution to stay fixed even as the Item's Assignees change, so that authorship history is never lost.
28. As any single Assignee of an Item, I want to mark it Complete on my own, so that I do not need every other Assignee's confirmation to finish shared work.
29. As a List Member, I want to move an Item through To Do, In Progress, Blocked, Complete, and Archived states, so that the Item's status reflects real progress.
30. As a List Member marking an Item Blocked, I want to be required to enter a short Blocker reason, so that anyone reading the Item understands what is stopping it.
31. As a List Member, I want to create a nested child Item under any Item, at any depth, so that I can break work down without a separate "subtask" concept to manage.
32. As a User in my Personal Space, I want to create and apply Labels to my own Items freely, so that I can organize across my personal Lists without asking anyone.
33. As a Workspace Owner or Admin, I want to be the only ones who can create new Labels in a shared Workspace, so that a Workspace's Label vocabulary stays controlled, mirroring List-creation rights.
34. As any List Member with access to an Item, I want to apply an existing Label to it, so that applying Labels is not gated the same way creating them is.
35. As a List Lead or Workspace Admin, I want to define Custom Fields on a List (Text, Number, Dropdown, or Date), so that the List can track structured data specific to its purpose.
36. As a List Member, I want to set a Custom Field's value on an Item, so that I can record the structured data the List's Lead defined.
37. As a List Member, I want to link two Items with a Dependency (one blocks the other), including Items in different Lists I have access to, so that I can represent real-world blocking relationships across the product's structure.
38. As a User, I want a Dependency to be purely informational, so that linking two Items never silently changes either one's lifecycle state.
39. As a List Member, I want to attach a file to an Item, so that I can keep supporting context with the work it relates to.
40. As a User, I want Attachments capped at 1GB per file with no preview or malware scanning in this release, so that the feature ships without a broader file-safety commitment I have not made yet.
41. As a List Member, I want to add a Note to an Item and `@mention` another User who already has access to that Item, so that I can loop someone in on context or a decision.
42. As a User, I want `@Mention` to be blocked for anyone who does not already have access to the mentioned Note's Item, so that mentioning cannot be used to leak visibility to someone without access.
43. As an Assignee of a shared Item, I want to attach a Personal Note visible only to me, so that I can keep private planning context without changing the shared Item or its team-visible Notes.
44. As a User, I want an Archived filter/toggle inside a List's own view, separate from the List-browsing page's Archived tab, so that I can find and restore an individual archived Item without leaving the List.
45. As a User restoring an archived Item, so that it returns to active use exactly as it was before archiving, so that archiving is safe and reversible.

## Implementation Decisions

- Build `lib/list/` covering: List create/update/archive/restore, List-level membership and role assignment, Guest grant/revoke, Section create/rename/duplicate/delete/reorder, Starred toggle, Status change, and Custom Field definition create/update. Every mutation checks authorization by calling `lib/permissions/` first; no direct membership-table queries inside `lib/list/`'s own logic.
- Build `lib/item/` covering: Item create/update/archive/restore (including nested child Items via the self-referencing parent field), Assignee add/remove, state transitions (with Blocker reason required when transitioning into `BLOCKED`), Priority, Label apply (not create — creation is `lib/list`'s or a Personal Space concern per role), Custom Field value set, Dependency create/remove, Attachment create (metadata + storage key; actual upload transport is a route handler that calls into this module), Note create with Mention validation, and Personal Note upsert. Every mutation checks authorization by calling `lib/permissions/` first.
- Route structure: a List-browsing route per Workspace/Personal Space context, and a per-List route with tabs for Overview and each view (List, Board, Calendar, Files, Timeline, Dashboard, Messages). Dashboard and Messages render a visibly reserved/placeholder tab in this spec — their content ships in the Reports & Analytics spec and the (later, v2) Chat/VC work respectively, but the tab structure ships now so the List page's navigation shape is stable going forward.
- List Overview's "Activity Timeline" (an Updates feed filtered to one List) is explicitly deferred to the Home/Profile/Updates/My Tasks spec, since the Updates feed does not exist yet; this spec's Overview tab ships with Description and Roles only.
- Board view's grouping field is user-selectable (Section, state, Assignee, or another supported field), matching the "Group by" mechanism used on My Tasks (see the Home/Profile/Updates/My Tasks spec) rather than introducing a second, List-specific grouping concept.
- Section-level "Add Rule" (alongside Add/Rename/Duplicate/Delete Section and Expand/Collapse/Hide Empty) ships as a simple, manually-triggered per-Section rule (for example, a default value applied to Items added to that Section) — not a Workflow/automation engine, which stays a later-phase concept per the settled List feature-surface session. Treat the exact rule types as an implementation-time detail to confirm against that session's transcript before building, since this spec infers the mechanism rather than quoting an exact list from it.
- Timeline view renders only date-based bars from each Item's due date (and, where present, a start date); it does not render Dependency arrows in this release even though the Dependency data needed for that visualization now exists.
- Attachments use the existing S3/MinIO-compatible object storage decision (ADR 0002): private storage, accepted types limited to ZIP, images, PDFs, and common office documents, 1GB per file, no preview rendering, no malware scanning, and ZIP contents are download-only (not browsable in-app).
- Guest grants and List-level membership both require the target List to already exist and, for List-level membership, require the target User to already hold Workspace-level membership in that List's Workspace — enforced by `lib/list/`, not left to the caller.

## Testing Decisions

- Test `lib/list/` as colocated `lib/list/*.test.ts` (pure logic, e.g. Status/Starred/Section ordering rules) and `lib/list/*.integration.test.ts` (real Prisma client, e.g. List creation authorization, membership/Guest grant persistence), following the existing `lib/workspace/` pattern.
- Test `lib/item/` the same way: unit tests for pure rules (state-transition validity, Blocker-reason requirement, Creator immutability) and integration tests for anything that touches multiple rows (Assignee changes, Dependency creation across Lists, Mention validation against an Item's access list).
- Test each List view and the List-browsing page as Server Component smoke tests (`*.smoke.test.tsx`, calling the exported page function directly, no React rendering) asserting the correct Items/Lists are returned for a given User's effective access — reusing the existing `app/page.smoke.test.tsx` pattern of asserting on the function's return/redirect behavior rather than rendered markup.
- Explicitly test the permission boundary at this layer, not just in `lib/permissions/`'s own unit tests: a List Viewer or Guest attempting an Item mutation through `lib/item/` must be rejected, proving the Server Action layer actually calls the seam rather than trusting client-side UI hiding alone.
- Test Board view's move-updates-grouped-field behavior and Timeline's date-bar rendering as component-level tests only where they carry logic beyond passing data through (for example, the state-change side effect of a Board move); pure layout has no independent test.
- No browser/E2E coverage is required for this spec; reserve Playwright coverage for release-verification specs, matching how the auth epic isolated its browser suite into its own ticket (issue #32).

## Out of Scope

- Home, Profile, Updates (including the List Overview Activity Timeline that reads from it), My Tasks, and the Workspace switcher/Personal Space nav — all belong to the Home/Profile/Updates/My Tasks spec.
- Report save/export and all Analytics content, including the Dashboard view's actual widgets and visualizations — belong to the Reports & Analytics spec. This spec only reserves the Dashboard tab.
- The v2 Chat/VC system's Messages tab content, Channels, and Direct Messages — this spec only reserves the Messages tab.
- `Workload` (a later-phase, List-scoped Analytics view) and List templates — later phase, not in this spec.
- Recurring due dates and saved/named Filters on Lists or Items — later phase.
- `Portfolio` and `Goal` — rejected outright (ADR 0010, ADR 0011).
- Public Task Tracking / "Company Position" (issue #14) and GitHub Integration (issue #15) — still ungrilled, excluded.

## Further Notes

- This spec depends on the Domain Model, Schema Migration & Permissions spec shipping first; it should not start until that schema and `lib/permissions/` exist.
- The Home/Profile/Updates/My Tasks spec and the Reports & Analytics spec both depend on this spec's `lib/item/` and `lib/list/` seams — Quick-Add capture on My Tasks, for instance, is expected to call `lib/item/`'s create function rather than duplicating Item-creation logic.
- The exact "Add Rule" mechanism and the precise Board-view grouping field list are inferred from the settled List feature-surface session's summary rather than quoted verbatim from it; confirm against `docs/QnA/list-feature-surface-and-views.md` before implementing those two details specifically.
