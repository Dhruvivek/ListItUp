# Home, Profile, Updates & My Tasks

## Problem Statement

Once Lists and Items exist (List & Item Core spec), a User still has no entry point into their own work: no per-Workspace landing page, no cross-Workspace personal task queue, no notification surface for changes that affect them, no identity page, and no working navigation for moving between their Personal Space and shared Workspaces. `app/my-tasks/page.tsx` and `app/workspaces/[workspaceId]/page.tsx` exist today only as placeholder stubs.

These four surfaces (Home, Profile, Updates, My Tasks) plus the Workspace switcher are where most Users spend their time day to day, but none of them introduce new domain concepts — they read and compose data that the Domain Model and List & Item Core specs already define.

## Solution

Ship Home (per-Workspace landing page), Profile (cross-Workspace identity page), Updates (a top-level notifications surface with Activity/Bookmarks/Archive/@Mentioned tabs and a preferences page), My Tasks (a cross-Workspace, unified view of Items assigned to the current User with List/Board/Calendar/Files/Dashboard-shell views), and the Workspace switcher plus permanently-pinned Personal Space navigation section.

None of these surfaces need a new `lib/` seam: they compose `lib/list/`, `lib/item/`, and `lib/permissions/` from the List & Item Core spec, plus a new, small notification-delivery path for Updates (triggered by Assignee changes, Notes/@Mentions, Item state changes, and due-date reminders). Test them as Server Component smoke tests, with focused unit tests only around the notification-trigger logic itself.

## User Stories

1. As a User, I want a Workspace switcher listing only the shared Workspaces I belong to, so that I can move between team contexts without my Personal Space cluttering that list.
2. As a User, I want my Personal Space shown as its own permanently-pinned navigation section, collapsed by default and expandable, so that it stays available without competing for space with the Workspace switcher.
3. As a User, I want picking a Workspace from the switcher to take me to that Workspace's Home page, so that switching context always lands me somewhere useful.
4. As a User opening a Workspace, I want a Home page with a lightweight greeting header showing the current date and time, so that the page feels current without committing to header metrics this release has not settled.
5. As a User on Home, I want a My Tasks preview widget scoped to the current Workspace, so that I can see a slice of my assigned work without leaving Home.
6. As a User on Home, I want a Recent Lists widget scoped to Lists I can see in the current Workspace, so that I can jump back into what I was just working on.
7. As a User on Home, I want an "Items I've Assigned" widget showing Items I created and assigned to someone else, scoped to the current Workspace, so that I can track delegated work without opening every List.
8. As a User, I want Home to have no Collaborators/People widget, no Out-of-Office indicator, no team/department tag, and no unrelated app-store-style widget, so that Home stays focused on my own Workspace-scoped work.
9. As a User, I want a Profile page independent of any Workspace, showing my avatar, Display Name, and About Me, so that my personal identity is consistent everywhere I go in the product.
10. As a User, I want to edit my avatar, Display Name, and About Me from my Profile page, so that I can keep my identity current.
11. As a User, I want Profile to carry no work widgets (no Goals, no task counts), so that it stays a pure identity surface distinct from Home.
12. As a User, I want a top-level Updates nav item with an unread-count badge, so that I know at a glance whether something needs my attention.
13. As a User opening Updates, I want an Activity tab as the default view, listing notifications for Assignee changes, Notes, Item state changes, and Mentions that affect me, so that I see what changed without hunting for it.
14. As a User in Updates, I want to filter the Activity tab and sort it newest-first, so that I can narrow down a busy notification stream.
15. As a User, I want to Bookmark a notification from the Activity tab, so that I can find it again later in the Bookmarks tab without it getting buried.
16. As a User, I want an Archive tab in Updates listing notifications I have archived, distinct from Archived Lists or Items, so that clearing my Activity feed does not delete anything.
17. As a User, I want an @Mentioned tab listing only notifications where I was directly `@mentioned`, so that I can find things addressed to me specifically.
18. As a User, I want each notification to show read/unread state, and to be marked read when I open it, so that my unread badge stays accurate.
19. As a User, I want a "Manage Notifications" preferences page, so that I can control which notification types reach me.
20. As a User, I want a due-date reminder notification to fire for Items I am assigned as their due date approaches, so that I do not miss deadlines through Updates alone.
21. As a User, I want an @Mention notification to only be generated for Users who already have access to the mentioned Note's Item, so that Updates never exposes an Item's content to someone without access to it.
22. As a User, I want a My Tasks page unifying Items assigned to me across every Workspace I belong to, each tagged with its source Workspace, so that I have one place to plan my day regardless of which team it comes from.
23. As a User on My Tasks, I want to filter by source Workspace, so that I can focus on one team's work when I need to.
24. As a User on My Tasks, I want List, Board, Calendar, Files, and a reserved Dashboard tab as views over the same assigned Items, so that I can work the same data in whichever shape suits the moment.
25. As a User on My Tasks, I want Add Task, Search, Filter, Sort, and Group actions, so that I can manage a large personal queue.
26. As a User on My Tasks, I want a narrowly-scoped Share action that copies a link to an Item, so that I can hand someone a direct link without a broader sharing surface this release has not built.
27. As a User on My Tasks, I want a Quick-Add capture box that parses natural-language shortcuts (for example, a due date or Priority written inline) into the right Item fields, so that capturing new work is fast.
28. As a User, I want My Tasks to default to showing only To Do and Blocked Items, with Complete and Archived Items reachable only through an explicit filter, so that my default view stays focused on what still needs attention.
29. As a User, I want My Tasks to default-sort by: overdue first, then High Priority, then nearest due date, then undated Items last, so that the most urgent work surfaces without me building a custom sort.
30. As a User, I want My Tasks and Home to have no gamification (points, streaks, leaderboards), so that the product stays about doing the work, not competing over it.
31. As a User completing an Item from My Tasks, I want that change to update the same Item wherever else it is shown (its source List, Home widgets, Updates), so that My Tasks is never a separate copy of my work.

## Implementation Decisions

- Build Home, Profile, Updates, and My Tasks as Server Components reading through `lib/list/`, `lib/item/`, and `lib/permissions/` (from the List & Item Core spec) — no new domain-mutation seam for these four surfaces beyond what already exists.
- Build one small addition, a notification-delivery path (new, minimal `lib/` module or extension of an existing one — name and exact placement is an implementation-time call, not a new domain concept) that: creates a notification record when an Item's Assignee list changes, when a Note is created (including resolving `@Mention`s against the Note's Item access list), when an Item's lifecycle state changes, and on a due-date-approaching schedule for each assigned Item. This is the only new persisted concept in this spec.
- Model per-User notification state (read/unread, bookmarked, archived) as flags or a status field on the notification record, scoped to the receiving User, not shared state.
- The Workspace switcher queries only `SHARED`-kind containers (per the Domain Model spec's internal container discriminator) that the current User has membership in; the Personal Space section renders the User's one `PERSONAL`-kind container directly and is never populated from the switcher's query.
- Home's greeting header ships with date/time only in this release; no numeric header stats are implemented, since the QnA session that raised the possibility of header stats deferred the question to the Reports & Analytics session, which did not revisit it. Treat header stats as unspecified, not merely deferred, and do not infer a specific metric set for them.
- "Items I've Assigned" is implemented as: Items whose Creator is the current User and whose Assignee list includes at least one User other than the current User, scoped to the currently open Workspace. Document this as a known approximation in code comments or the PR description — the QnA session that defined it flagged the definition itself as revisitable, not a durable contract other features should build on.
- My Tasks' Dashboard tab renders a reserved/placeholder state in this spec; its content ships in the Reports & Analytics spec, matching the same reservation pattern used for the List page's Dashboard and Messages tabs.
- My Tasks' default sort order (overdue, then High Priority, then nearest due date, then undated) and default visibility (To Do and Blocked only) are implemented as the page's default query parameters, not a persisted per-User preference, in this release.
- Quick-Add's natural-language parsing covers due date and Priority shortcuts at minimum; it creates the Item through `lib/item/`'s existing create function from the List & Item Core spec rather than a parallel creation path, defaulting to the User's Inbox List (or a List the User selects) when no List is specified.
- My Tasks' Share action produces a copy-able direct link to an Item; it does not implement a broader sharing/permission-grant surface — opening that link still goes through the same `lib/permissions/` check as any other access to that Item.

## Testing Decisions

- Test Home, Profile, My Tasks, and each Updates tab as Server Component smoke tests (`app/*/page.smoke.test.tsx`), following the existing `app/page.smoke.test.tsx` pattern: call the exported page function directly, assert on its returned data shape or redirect behavior for signed-out/no-access cases, without rendering through React.
- Test the notification-delivery path's trigger logic as focused unit and integration tests: Assignee-change notification creation, Note/@Mention notification creation (including the access-list validation that blocks notifying a User without Item access), Item state-change notification creation, and due-date reminder scheduling — following the `lib/workspace/*.test.ts` / `*.integration.test.ts` split (pure trigger-condition logic as unit tests, actual row creation against a real Prisma client as integration tests).
- Test My Tasks' default sort and default visibility as a smoke test asserting the returned Item ordering and filtered set for a fixture set of Items across multiple states, Priorities, and due dates — this is behavior worth locking down explicitly since it is a specific, non-obvious ordering rule.
- Test the Workspace switcher and Personal Space nav section as a smoke test asserting a `SHARED`-kind container never appears in the Personal Space slot and vice versa, and that a Workspace the User does not belong to never appears in the switcher.
- Test cross-Workspace unification on My Tasks with a fixture spanning at least two Workspaces plus the User's Personal Space, asserting each returned Item carries correct source-Workspace tagging and that completing an Item from My Tasks is reflected when reading the same Item through its source List (proving My Tasks is not a copy).
- No new browser/E2E coverage required in this spec.

## Out of Scope

- Any List/Item mutation logic itself — this spec only composes `lib/list/` and `lib/item/` from the List & Item Core spec.
- Report save/export and Analytics visualizations, including the actual content of My Tasks' and List's Dashboard tabs — Reports & Analytics spec.
- Home header numeric stats — unspecified (see Implementation Decisions), not part of this spec's scope; do not build a guessed metric set.
- Custom-tab management on Updates, and Relevance-sort/alternate-density modes — later phase.
- Recurring due dates and saved/named Filters on My Tasks — later phase; this spec's due-date reminder notification is a one-time-per-approaching-deadline trigger, not a recurrence engine.
- Karma/gamification anywhere on Home or My Tasks — rejected, effectively permanent.
- The v2 Chat/VC system's Direct Message surface — out of scope, v2.
- `Portfolio` and `Goal` — rejected outright (ADR 0010, ADR 0011); no "My Goals" widget on Profile.
- Public Task Tracking / "Company Position" (issue #14) and GitHub Integration (issue #15) — still ungrilled, excluded.

## Further Notes

- This spec depends on the List & Item Core spec shipping first (it reads `lib/list/` and `lib/item/` directly) and, transitively, on the Domain Model spec.
- Home's header stats and the exact Quick-Add natural-language grammar are the two least-settled details in this spec; both are flagged above as implementation-time judgment calls rather than fully closed decisions, and should be confirmed against the original QnA sessions (`docs/QnA/listitup-profile-and-home-surface.md`, `docs/QnA/my-tasks-feature-surface.md`) before building.
- The notification-delivery path introduced here is intentionally the only new schema/seam in this spec; if it grows beyond simple trigger-and-record behavior (for example, if a queue or outbox is needed for reliability, mirroring the auth epic's `SecurityNoticeOutbox` pattern), that growth should be raised as its own decision rather than absorbed silently into this spec's scope.
