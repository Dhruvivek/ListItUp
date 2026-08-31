# Grill Session: My Tasks Feature Surface & Views

## Context

Resolving [wayfinder ticket #7](https://github.com/Dhruvivek/ListItUp/issues/7), "Decide the My Tasks feature surface & views" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its blockers, [#2](https://github.com/Dhruvivek/ListItUp/issues/2) (core domain model) and [#3](https://github.com/Dhruvivek/ListItUp/issues/3) (Todoist baseline research), were already settled/resolved. Mines the `My Tasks`/`List View`/`Board View`/`Calendar View`/`Dashboard View`/`Files View`/`Task Details` sections of `brainstorm/Work.md`, cross-checked against `docs/Research/todoist-feature-set.md` (on the unmerged `research/todoist-feature-set` branch) for personal-task features Asana's brainstorm doesn't cover, deciding core v1 / later phase / rejected for each.

## Questions

### 1. Scope boundary with #10

**Recommended answer**:

`#7` decides only which Task Details fields exist and are visible in My Tasks' views; `#10` ("Decide the task-detail feature surface") owns the deep behavior of custom fields, dependencies, time tracking, and attachments, since `#10`'s own body already claims that scope.

**User answer**:

Yes.

**Settled outcome**:

`#7` bucket-decides field existence/visibility only. Custom fields, dependencies, time tracking, and attachments' actual mechanics are `#10`'s job.

### 2. Does an Item belong to one List, or many?

**Recommended answer**:

One List only — nothing in the settled domain model anticipated multi-List membership; introducing it is a real domain-model change that shouldn't be a side effect of bucketing My Tasks columns.

**User answer**:

Confirmed one List only.

**Settled outcome**:

An `Item` belongs to exactly one `List`. Asana's "add/remove projects" Task action doesn't apply — dropped.

### 3. Views

**Recommended answer**:

`List` and `Board` core v1; `Calendar` and `Files` later phase; `Dashboard` deferred entirely to `#11` (Reports/Analytics).

**User answer**:

All five ship in v1: List, Board, Calendar, Files, and Dashboard.

**Settled outcome**:

`List`, `Board`, `Calendar`, `Files`, and `Dashboard` are all core v1 views. See Q12 for how `Dashboard`'s scope was reconciled with `#11`.

### 4. Common actions

**Recommended answer**:

Add Task, Search, Filter, Sort, Group — core v1. Share — core v1, scoped narrowly to copying a link for someone who already has access (not a new sharing-grant mechanism). Customize View — later phase.

**User answer**:

Agreed.

**Settled outcome**:

Add Task, Search, Filter, Sort, Group, and narrowly-scoped Share are core v1. Customize View is later phase.

### 5. My Tasks' own grouping — reuse `Section`, or something else?

**Recommended answer**:

Use "Group by" a field (List, Due Date, Priority) rather than a new personal `Section`-like object — avoids repeating the naming-collision pattern from `#6`'s `Archive` tab.

**User answer**:

Agreed (option a).

**Settled outcome**:

My Tasks groups Items via "Group by" a field. No new cross-List `Section` object.

### 6. Labels (Todoist gap)

**Recommended answer**:

Later phase — a genuinely new domain concept (entity + management UI) not needed for a working My Tasks v1.

**User answer**:

Core v1 (see Q13 for the creation/visibility model).

**Settled outcome**:

`Label` ships in v1 — see `CONTEXT.md`'s new `Label` entry and Q13 below for the creation-rights model.

### 7. Recurring due dates (Todoist gap)

**Recommended answer**:

Later phase — real complexity beyond scheduling, since it touches whether a completed recurring Item rolls forward or spawns a new Item (an `Item`-identity question).

**User answer**:

Later phase.

**Settled outcome**:

Recurring due dates are later phase. The Item-identity question (roll-forward vs. new-Item-per-occurrence) is unresolved and deferred with it.

### 8. Reminders / due-date notifications (Todoist gap)

**Recommended answer**:

Later phase, but flag as a gap on the now-closed `#6` regardless of phase, since due-date reminders weren't in that ticket's settled notification-trigger list.

**User answer**:

Core v1.

**Settled outcome**:

Due-date reminders are a core v1 notification trigger, added to `Updates`' scope (`#6`, closed) via a follow-up comment on that issue.

### 9. Saved/custom Filters (Todoist gap)

**Recommended answer**:

Later phase — one-off filtering (Q4) covers the v1 need.

**User answer**:

Agreed.

**Settled outcome**:

Saved/named Filters are later phase.

### 10. Quick-Add natural-language capture syntax (Todoist gap)

**Recommended answer**:

Later phase — real NLP-parsing investment; a plain Add Task form covers v1.

**User answer**:

Core v1.

**Settled outcome**:

Quick-Add NLP capture syntax (typed date/label/assignee/list shorthand in the Add Task field) is core v1.

### 11. Karma / streaks / gamification (Todoist gap)

**Recommended answer**:

Reject, never — `Brand.md` explicitly says to avoid productivity theater; this is a brand-fit rejection, not a phasing question.

**User answer**:

Reject for now; only reconsider far in the future (v4/v5) if a concrete need emerges, otherwise never.

**Settled outcome**:

Karma/streaks/gamification are rejected for the foreseeable future. Not permanently barred, but no plan to revisit without a real, concrete need.

### 12. Dashboard view now conflicts with #11

**Recommended answer**:

`#7` defines a trimmed personal Dashboard now (completed count, overdue count, Item-state breakdown) using only what the domain model already supports, so My Tasks v1 doesn't stall on an unrelated open ticket.

**User answer**:

Dashboard view ships as part of `#7`'s v1 bucket, but its actual content/metrics will be discussed in detail in `#11`.

**Settled outcome**:

`Dashboard` is a core v1 view (bucket decision), but its metrics/content are deferred to `#11`. Flagged via a follow-up comment on `#11` that My Tasks v1 now has a scope dependency on it.

### 13. Label creation and visibility model

**Recommended answer**:

Personal Workspace: the sole User creates Labels freely. Shared Workspace: only `Owner`/`Admin` can create a Label (mirroring List-creation rights), visible to and applicable by any Member with access, once created. Rejected a fully-fixed, non-customizable Label set as functionally redundant with `Priority`.

**User answer**:

Agreed — go with this model.

**Settled outcome**:

`Label` creation rights mirror `List` creation rights: freeform in a personal Workspace, `Owner`/`Admin`-only in a shared Workspace. Any Member with access to an Item can apply an existing Label. Recorded in `CONTEXT.md`.

### 14. `Task Visibility` field — real concept or not?

**Recommended answer**:

Drop it — List-level access (role, Guest scoping) already governs who sees an Item; a per-Item visibility override is a real, non-trivial permissions feature that isn't needed for v1.

**User answer**:

Drop it.

**Settled outcome**:

No per-Item visibility override. List-level roles/Guest scoping remain the only visibility mechanism.

### 15. Section management actions in My Tasks' List view

**Recommended answer**:

Drop `Rename/Add/Duplicate Section` from My Tasks (they only make sense for a List's real Sections — `#8`'s territory). Keep "Add Rule" reinterpreted as configuring the active Group-by criterion, and keep `Expand/Collapse Groups`.

**User answer**:

Agreed (option a).

**Settled outcome**:

My Tasks' List view drops literal Section-management actions. "Add Rule" configures the Group-by criterion; `Expand/Collapse Groups` collapses/expands the current grouping.

## Date

2026-08-28

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Label`. Confirmed (no edit needed) that `Item`'s existing "inside a List" phrasing already reflects single-List membership (Q2).
- ADRs created: None — this session bucketed feature scope; the one genuinely hard-to-reverse call (`Item` identity across recurring-due-date completions) was explicitly deferred, not decided.
- Specs affected: Unblocks a future My Tasks spec under `docs/Specs-Planned/`. Flagged follow-up comments on `#6` (due-date reminders gap in `Updates`' notification triggers) and `#11` (Dashboard content/metrics dependency). Scope boundary with `#10` (Task Details deep behavior) recorded via a comment there.
