# Grill Session: List Feature Surface & Views

## Context

Resolving [wayfinder ticket #8](https://github.com/Dhruvivek/ListItUp/issues/8), "Decide the Project feature surface & views" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its blocker, [#2](https://github.com/Dhruvivek/ListItUp/issues/2) (core domain model), already settled that there is no separate `Project` entity — `List` absorbed Asana's Project-level capabilities. So this session decides what of Asana's Project Workspace surface (browsing, header, Overview tab, views) `List` needs, mining the `Projects` and `Project Workspace` sections of `brainstorm/Work.md`. It also resolves two follow-ups flagged onto `#8` by earlier sessions: no restore surface exists anywhere for archived Lists/Items (flagged from grilling [#6](https://github.com/Dhruvivek/ListItUp/issues/6)), and My Tasks dropped literal Section-management actions since those belong to a List's real Sections (flagged from grilling [#7](https://github.com/Dhruvivek/ListItUp/issues/7), Q15).

## Questions

### 1. Dedicated List-browsing page

**Recommended answer**:

Yes, core v1 — once a Workspace has more than a handful of Lists, "recent" (Home's widget) isn't "all."

**User answer**:

Agreed.

**Settled outcome**:

A dedicated page lists every List the user has access to, with search.

### 2. List templates

**Recommended answer**:

Later phase — template authoring/versioning is real scope, not needed for a working v1.

**User answer**:

Not now.

**Settled outcome**:

List templates are later phase.

### 3. Is List-header "Favorite" the same concept as the `Starred` nav item in `brainstorm/Work.md`'s top-level nav?

**Recommended answer**:

Yes — unify as one `Starred` concept, and settle its minimal v1 shape here since it surfaces first on the List header: a boolean toggle per List/User plus a filter on the browsing page (Q1). Leave a deeper dedicated `Starred` page for its own ticket if one gets opened later.

**User answer**:

Okay.

**Settled outcome**:

`Starred` is one unified concept. v1 ships a boolean toggle per List (per User) and a `Starred` filter on the List-browsing page.

### 4. List Status field

**Recommended answer**:

Core v1, adopt all six Asana values as-is (`On Track`/`At Risk`/`Off Track`/`On Hold`/`Completed`/`Dropped`) — it's a plain enum, no real complexity.

**User answer**:

Keep only 4 — drop `Off Track` and `At Risk`.

**Settled outcome**:

`List Status` is core v1, a 4-value enum: `On Track`, `On Hold`, `Completed`, `Dropped`. No "struggling but not stalled" signal exists between `On Track` and the terminal states — deliberate simplification.

### 5. "Share" action on the List header

**Recommended answer**:

Confirm this isn't a new concept — it's the existing List-role (`Lead`/`Member`/`Viewer`) and `Guest` invite UI from `ADR-0009`.

**User answer**:

Confirm.

**Settled outcome**:

`Share` surfaces the existing invite flow. No new design.

### 6. "Customize" action on the List header

**Recommended answer**:

Narrow scope: which views are shown/hidden and in what order on the List's view tab-bar. Later phase for anything deeper.

**User answer**:

Drop `Customize` for now.

**Settled outcome**:

`Customize` is not in v1 at all.

### 7. Description & Roles (Overview tab)

**Recommended answer**:

Both core v1 — trivial. `Description` needs one new field on `List`; `Roles` just displays data `ADR-0009` already models.

**User answer**:

Okay.

**Settled outcome**:

`Description` and `Roles` are core v1.

### 8. Activity Timeline (Overview tab)

**Recommended answer**:

Reuse `Updates` (`#6`, closed), filtered to this List's Items/Notes, rather than a new feed.

**User answer**:

Reuse it.

**Settled outcome**:

A List's Activity Timeline is `Updates` filtered by List. No new feed.

### 9. Key Resources (Overview tab)

**Recommended answer**:

Later phase — real but non-essential pinned-links feature.

**User answer**:

Later.

**Settled outcome**:

Key Resources is later phase.

### 10. Milestones (Overview tab)

**Recommended answer**:

Later phase — a genuinely new concept that overlaps with the Timeline view (Q14); don't invent two new things in one ticket.

**User answer**:

Later.

**Settled outcome**:

Milestones is later phase.

### 11. AI Summary (Overview tab)

**Recommended answer**:

Later phase — real AI-feature investment, not core-v1 necessary.

**User answer**:

Later.

**Settled outcome**:

AI Summary is later phase.

### 12. Connected goals / Connected portfolios (Overview tab)

**Recommended answer**:

Omit both from v1 Overview rather than a dead placeholder hook, since [#9](https://github.com/Dhruvivek/ListItUp/issues/9) (Portfolio & Goals) is still open.

**User answer**:

We're dropping the concept of Portfolios [entirely — see Q20].

**Settled outcome**:

`Connected Portfolios` is rejected outright (see Q20). `Connected Goals` stays a future Overview hook once `#9` settles Goals.

### 13. Core views: List / Board / Calendar / Files / Dashboard

**Recommended answer**:

Core v1, reusing the same view components `#7` (My Tasks) already shipped, scoped per-List instead of cross-List.

**User answer**:

All in v1.

**Settled outcome**:

`List`, `Board`, `Calendar`, `Files`, `Dashboard` are all core v1 views on a List.

### 14. Timeline (Gantt) view

**Recommended answer**:

Later phase — genuinely complex, and the dependency-arrow part overlaps with `#10` (task-detail dependencies), still open.

**User answer**:

Need Timeline in v1.

**Settled outcome**:

`Timeline` is core v1 — see Q21 for its trimmed v1 scope.

### 15. Workflow / automation view

**Recommended answer**:

Later phase, possibly reject outright — real scope beyond the "medium fish" target.

**User answer**:

Automation later.

**Settled outcome**:

`Workflow`/automation is later phase.

### 16. Messages view

**Recommended answer**:

Bucket-only decision: reserve a "Messages" slot in v1's view list, but don't build content until `#12` (Chat/VC) settles.

**User answer**:

Yep, chat will be discussed in `#12`.

**Settled outcome**:

`Messages` is a reserved v1 view slot; content is entirely `#12`'s scope.

### 17. Archived-List browsing/restore (flagged from `#6`)

**Recommended answer**:

Yes — an `Archived` filter/tab on the List-browsing page (Q1), showing archived Lists with a restore action.

**User answer**:

Yes, v1 needs an archive section for both Lists and Items, with a restore button.

**Settled outcome**:

v1 ships an `Archived` filter/tab on the List-browsing page, listing archived Lists with a `Restore` action per List.

### 18. Archived-Item browsing/restore within a List (flagged from `#6`)

**Recommended answer**:

Yes — an `Archived` filter/toggle on a List's List/Board view, scoped to that List, with a restore action per Item.

**User answer**:

Yes.

**Settled outcome**:

v1 ships an `Archived` filter/toggle on a List's List/Board view, with a `Restore` action per Item.

### 19. Section-management actions (flagged from `#7` Q15)

**Recommended answer**:

Confirm these live in a List's List view: `Add Rule` (grouping config), `Rename Section`, `Add Section`, `Duplicate Section`, `Expand/Collapse Groups`, `Hide Empty Groups`, `Delete Section`.

**User answer**:

Confirm, add all.

**Settled outcome**:

All Section-management actions are core v1 in a List's List view.

### 20. Scope of "dropping Portfolio"

**Recommended answer**:

Reject `Portfolio` as a product concept outright — not just omit it from the Overview tab. Narrow `#9` to "Decide Goals scope" only. Keep `Connected Goal` as a future Overview hook, Goals attaching directly to a `List` once `#9` settles, with no Portfolio layer in between.

**User answer**:

Rejecting Portfolio entirely.

**Settled outcome**:

`Portfolio` is rejected as a product concept for ListItUp. `#9` is narrowed to Goals scope only (see `docs/ADR/0010-reject-portfolio-concept.md`).

### 21. Timeline (Gantt) v1 scope

**Recommended answer**:

Date-based bars only for v1 (start/due date positioning, drag-to-reschedule, grouped by Section). Defer dependency arrows until `#10` settles what a dependency looks like on an Item.

**User answer**:

Date-wise only for v1.

**Settled outcome**:

v1 `Timeline` shows date-based bars only (start/due date, drag-to-reschedule, grouped by Section). No dependency-arrow visualization until `#10` lands.

### 22. List-browsing page filter facets

**Recommended answer**:

`Search` (name), `Status` (the 4 values from Q4), `Members` (any List-level role holder — folding "Owner" in, since `List` has no single-owner field), `Starred` (from Q3). Drop the `Portfolios` facet.

**User answer**:

Okay, add these.

**Settled outcome**:

The List-browsing page filters on `Search`, `Status`, `Members`, and `Starred`. No `Portfolios` facet.

## Date

2026-09-03

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Starred`, `List Status`, `Restore`.
- ADRs created: `docs/ADR/0010-reject-portfolio-concept.md` — rejects `Portfolio` as a product concept (Q20).
- Specs affected: Unblocks a future List/Project-workspace spec under `docs/Specs-Planned/`. Narrowed `#9`'s scope to Goals only via a follow-up comment there (title updated). Flagged `Timeline`'s dependency-arrow gap as pending on `#10`.
