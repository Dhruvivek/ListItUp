# Grill Session: ListItUp Product Model

> **Superseded 2026-08-26**: the small-Workspace-only scope this session settled (no `Project`/`Portfolio`, single `Owner`, 2-8 person Workspaces) is discarded under a bigger "medium fish" product scope. See [Wayfinder Map: ListItUp v1+ feature roadmap](https://github.com/Dhruvivek/ListItUp/issues/1) and `docs/QnA/listitup-scope-redefinition.md`. Kept here for historical reasoning only — do not treat its settled outcomes as current.

## Context

Clarifying the core product model for ListItUp as it expands from list capture into personal work, collaboration, tasks, reports, and analytics.

## Questions

### 1. Should ListItUp use separate Personal Space, Workspace, and Project Space concepts?

**Recommended answer**:

Use one canonical top-level container: `Workspace`. Keep the hierarchy as `User -> Workspace -> List -> Item`, with `Workspace` starting personal and potentially becoming collaborative later. Avoid `Personal Space` and `Project Space` until the product proves it needs additional grouping.

**User answer**:

Recommendation is good.

**Settled outcome**:

ListItUp uses `Workspace` as the canonical operating space. `Personal Space` and `Project Space` are avoided as separate core concepts for now.

### 2. Should Task become a first-class concept, or should it remain an Item with task-specific properties?

**Recommended answer**:

Keep `Item` as the canonical term, and treat task behavior as capabilities an Item can have. ListItUp should stay list-first while supporting accountability details such as completion, due date, assignee, and priority when an Item represents work.

**User answer**:

Recommendation is good, but ultimately the goal for this app is to help maintain accountability for project development and personal tasks.

**Settled outcome**:

`Item` remains the canonical term. Task-like behavior is modeled as accountability details on Items rather than a separate top-level `Task` concept.

### 3. When we say accountability, who is accountable for an Item?

**Recommended answer**:

Every actionable Item should have one clear `Owner`: the User responsible for moving it forward. In a personal Workspace, the Owner is usually the same User who created it. In a collaborative Workspace later, Creator and Owner can differ. Avoid shared ownership for the MVP because it makes reminders, reports, and analytics vague.

**User answer**:

Recommendation is good.

**Settled outcome**:

Actionable Items have one Owner. Owner is the accountability anchor for future reminders, reports, and analytics.

### 4. Should an actionable Item always need a due date to count as accountable?

**Recommended answer**:

No. An Item can be accountable with just an Owner and a clear state. Due dates should be optional, but when present they power overdue reports, upcoming views, and reminders. This avoids forcing fake dates onto project development work where priority or next action matters more than a deadline.

**User answer**:

Recommendation is good.

**Settled outcome**:

Due dates are optional accountability details. Owner and state are enough for an Item to be accountable.

### 5. What should the core Item states be for the MVP?

**Recommended answer**:

Use `Open`, `Blocked`, `Complete`, and `Archived`. `Open` means it still needs attention. `Blocked` means progress is stopped by an external dependency or unresolved decision. `Complete` means it no longer needs attention. `Archived` means it is removed from active use but preserved. Avoid `In Progress` for MVP because many personal and project Items are intermittently worked on, and "in progress" often becomes vague status theater unless workflow stages are also tracked.

**User answer**:

Recommendation is good.

**Settled outcome**:

The MVP Item states are `Open`, `Blocked`, `Complete`, and `Archived`. `In Progress` is intentionally excluded from the MVP state model.

### 6. Should Project exist as a user-facing concept, or should project development work be represented as Lists inside a Workspace?

**Recommended answer**:

Do not add `Project` as a first-class concept yet. Represent a project as a `List` whose Items are project work. Later, if users need portfolio-level grouping, add `Area` or `Folder` above Lists. This keeps the current hierarchy simple and respects the existing glossary's guidance to avoid using `project` as a synonym for `List`.

**User answer**:

Recommendation is good.

**Settled outcome**:

Project development work is represented as Lists inside a Workspace. `Project` is not a first-class user-facing concept for now.

### 7. Should Report mean a saved document generated from Items, or a live view of accountability data?

**Recommended answer**:

For MVP, `Report` should mean a live summary view of Items across Lists, filtered by Owner, state, date, and Workspace. Avoid saved/exported reports until users prove they need weekly snapshots or shareable artifacts. Live reports are enough to answer "what needs attention?", "what is blocked?", and "what was completed?" without adding document-management complexity.

**User answer**:

Recommendation is good.

**Settled outcome**:

`Report` means a live accountability summary view, not a saved/exported document.

### 8. What should Analytics mean in this app: productivity scoring, trend charts, or operational health?

**Recommended answer**:

Define `Analytics` as operational health over Items and Lists: completion rate, blocked count, overdue count, aging Open Items, and Owner workload. Avoid productivity scores, streaks, and gamified rankings because they can encourage shallow task churn instead of real accountability.

**User answer**:

Recommendation is good. The user is also considering heatmaps, task mapping like GitHub contribution maps, progress graphs, and radar charts.

**Settled outcome**:

`Analytics` means operational health signals. Heatmaps, contribution-style maps, progress graphs, and radar charts are possible visualizations for those signals, not separate domain concepts.

### 9. For analytics visuals like heatmaps, contribution maps, progress graphs, and radar charts, what should each visual measure?

**Recommended answer**:

Keep each visualization tied to one accountability question. Heatmaps answer "when did work get completed?", contribution-style maps answer "how consistently did the Owner move Items forward?", progress graphs answer "is this List getting closer to completion?", and radar charts answer "where is attention imbalanced across Open, Blocked, Overdue, and Completed work?" Avoid showing charts until there is enough data to make them meaningful; empty analytics should degrade into simple counts and reports.

**User answer**:

Recommendation is good. In group projects, the user also wants people to see their contributions compared with others to improve a competitive environment among peers.

**Settled outcome**:

Analytics visualizations must be tied to accountability questions. Contribution comparison is a future collaborative analytics capability, but should be designed carefully so it encourages meaningful accountability rather than shallow completion chasing.

### 10. In collaborative Workspaces, should contribution comparison be visible to everyone by default?

**Recommended answer**:

No. Start with private self-analytics plus Workspace-level aggregate analytics. Add peer comparison only as an explicit Workspace setting later. Public comparisons should compare meaningful signals like completed owned Items, resolved blocked Items, and stale owned Items, not raw task count alone. This avoids turning the app into a scoreboard where people split work into tiny Items to look productive.

**User answer**:

Recommendation is good.

**Settled outcome**:

Peer contribution comparison is not visible by default. Collaborative Workspaces may later enable it explicitly, and comparison metrics should avoid raw task count as the primary measure.

### 11. What should the MVP support first: personal accountability only, or collaboration from day one?

**Recommended answer**:

Build personal accountability first, but shape the domain so collaboration can be added later. That means one User, one Workspace, Lists, Items, Owner, states, optional due dates, reports, and basic analytics. Do not build invitations, roles, shared permissions, or peer comparison in the first slice. This keeps the MVP demoable end to end and avoids building social mechanics before the core accountability loop works.

**User answer**:

Collaboration from day one, since the main focus is group projects.

**Settled outcome**:

Collaboration is part of the initial product model. A personal Workspace is treated as a single-member Workspace, not a separate product mode.

### 12. What collaboration roles should exist in a Workspace at launch?

**Recommended answer**:

Use three Workspace roles: `Admin`, `Member`, and `Viewer`. Avoid calling the Workspace role `Owner` because `Owner` already means the User responsible for an Item. `Admin` can manage the Workspace and members. `Member` can create Lists and Items, update owned Items, and participate in reports. `Viewer` can read shared Lists and reports but cannot change work.

**User answer**:

Recommendation is good.

**Settled outcome**:

Launch collaboration uses `Admin`, `Member`, and `Viewer` as Workspace roles. Item accountability remains represented by `Owner`.

### 13. In a collaborative Workspace, who can change the Owner of an Item?

**Recommended answer**:

`Admin` and `Member` can assign or reassign an Item Owner, but `Viewer` cannot. If a Member reassigns someone else's Item, the change should be visible in the Item's activity later, but full audit history is not required in the first implementation slice. This keeps group project coordination flexible while preserving accountability.

**User answer**:

Recommendation is good.

**Settled outcome**:

`Admin` and `Member` can assign or reassign Item Owner. `Viewer` cannot change ownership.

### 14. Should Lists be visible to the whole Workspace by default, or should each List have its own visibility?

**Recommended answer**:

Lists should be visible to the whole Workspace by default, with optional private Lists deferred. Since the main focus is group projects, default shared visibility makes reports, ownership, and analytics coherent. Private Lists add permission complexity and can hide accountability data, so they should wait until the collaborative core is working.

**User answer**:

Recommendation is good.

**Settled outcome**:

Lists are shared across the Workspace by default. Private Lists are deferred.

### 15. What should be the first demoable product slice after this grilling session?

**Recommended answer**:

Build the `Collaborative Workspace Accountability Loop`. It should let an Admin create a Workspace, invite or add Members, create a shared List, add Items, assign each Item to an Owner, set state to Open/Blocked/Complete/Archived, optionally add due dates, and view a basic Report showing Open, Blocked, Overdue, and Complete Items by Owner. Analytics visuals should wait for the next slice because they need enough completed or aged activity data to be meaningful.

**User answer**:

Recommendation is good.

**Settled outcome**:

The first demoable slice is the `Collaborative Workspace Accountability Loop`. Analytics visualizations are deferred until after the core collaborative accountability loop exists.

## Date

2026-07-08

## Follow-Ups

- Glossary updates: `Workspace`, `Item`, `Owner`, `Admin`, `Member`, `Viewer`, `Open`, `Blocked`, `Report`, `Analytics`
- ADRs created: None
- Specs affected: Future PRD for `Collaborative Workspace Accountability Loop`
