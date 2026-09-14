# Grill Session: ListItUp Core Domain Model (v2, "Medium Fish")

## Context

Resolving [wayfinder ticket #2](https://github.com/Dhruvivek/ListItUp/issues/2), "Redefine ListItUp's core domain model & entity hierarchy" — the blocking ticket on the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Settles the entity hierarchy, accountability model, role/permission system, and Item lifecycle for the "medium fish" pivot described in `docs/QnA/listitup-scope-redefinition.md`.

## Questions

### 1. Does a Project-equivalent container return, and is it a rename of `List` or a new layer?

**Recommended answer**: Rename `List` to `Project` at the same layer, adding `Section` inside a Project.

**User answer**: Keep it as `List` — the app is named ListItUp; `List` will carry all Project-level features.

**Settled outcome**: `List` keeps its name and absorbs Project-like capabilities (Sections live inside a List; richer views are per-feature downstream decisions). No separate `Project` entity.

### 2. Is there an Organization/Team layer above Workspace, or does Workspace remain the top container?

**Recommended answer**: Keep `Workspace` as the top container; don't add `Organization` yet.

**User answer**: Agreed.

**Settled outcome**: No `Organization` layer. `Workspace` remains the top container.

### 3. Single `Owner` or multi-value `Assignee`?

**Recommended answer**: Keep single accountability, rename `Owner` → `Assignee`.

**User answer**: Make it multi-assignee — e.g. a large data-extraction task that one person can't do alone needs multiple people assigned.

**Settled outcome**: `Assignee` is multi-valued. An Item can have zero or more Assignees.

### 4. Keep `Item` or rename to `Task`?

**Recommended answer**: Rename to `Task`, since the product now explicitly targets Asana/Todoist-style task management.

**User answer**: Keep `Item` — ListItUp isn't a clone of Asana or Todoist, it's a standalone application, and `Item` needs to cover notes, ideas, and decisions too, not just tasks.

**Settled outcome**: `Item` remains the canonical term.

### 5. Does `Open`/`Blocked`/`Complete`/`Archived` still cover it, or does it need more granularity?

**Recommended answer** (round 1): Keep the 4-state model; the old "avoid status theater" reasoning still holds.

**User answer** (round 1): `Open` is confusing — it conflates "not started" and "in progress." Wants to think more about it.

**Recommended answer** (round 2): Add a real 5th state — `To Do` / `In Progress` / `Blocked` / `Complete` / `Archived` — since multi-Assignee Items make "has anyone actually started this?" a real coordination question, not status theater.

**User answer** (round 2): Agreed.

**Settled outcome**: 5-state model: `To Do`, `In Progress`, `Blocked`, `Complete`, `Archived`.

### 6. Does personal vs. shared Workspace remain the right split?

**Recommended answer**: Keep as-is; nothing about the new scope invalidates the prior reasoning.

**User answer**: Agreed.

**Settled outcome**: Unchanged from `docs/QnA/personal-and-team-workspaces.md` (personal Workspace + `My Tasks` as the cross-Workspace view).

### 7. Does an Item support nested sub-Items ("Subtask")?

**Recommended answer**: Yes, any Item can have child Items — one nesting mechanism for all Item types.

**User answer**: Agreed.

**Settled outcome**: Any Item may have nested child Items. There is no separate `Subtask` concept — nesting applies uniformly.

### 8. With multiple Assignees, who can mark an Item Complete?

**Recommended answer**: Any single Assignee — per-Assignee partial completion is real complexity better solved by splitting into child Items.

**User answer**: Agreed.

**Settled outcome**: Any single Assignee can mark a multi-Assignee Item Complete.

### 9. Naming: `Assignee` or keep `Owner` (now plural)?

**Recommended answer**: `Assignee` — unambiguous as a plural, matches Asana/Todoist/brainstorm-doc vocabulary.

**User answer**: Agreed (`Assignee` "sounds cool").

**Settled outcome**: `Assignee` replaces `Owner` in the glossary.

### 10. Does the `Admin`/`Member`/`Viewer` ladder still work, or does richer per-List structure need per-List permissions or a `Workspace Owner` tier?

**Recommended answer** (round 1): Keep permissions Workspace-wide; add a `Workspace Owner` tier for irrevocable delete/transfer authority.

**User answer** (round 1): Want *both* per-List roles and Workspace-level roles — a List is like a Project, and different Lists have different leads/members; not everyone in the Workspace should see every List. Workspace-level roles are for company-wide concerns.

**Settled outcome**: Two independent tiers — Workspace-level (`Owner`/`Admin`/`Member`/`Viewer`) and List-level (`Lead`/`Member`/`Viewer`), detailed in Q11-Q16 below.

### 11. Are List-level roles assignable to non-Workspace-members, or does List access require Workspace membership first?

**Recommended answer**: Workspace membership always required first; List-level roles are a restriction/assignment within that membership.

**User answer**: Workspace membership first; a "third person" (external, e.g. a client) only ever gets `Viewer`-equivalent access via invitation.

**Settled outcome** (refined further in Q16): internal collaborators always join the Workspace first; genuinely external people use the separate `Guest` mechanism instead (see Q16), not a Workspace invitation.

### 12. Does a new List default to visible to the whole Workspace, or private/opt-in?

**Recommended answer**: Opt-in (private by default) — matches the "different leads/members per List" scenario.

**User answer**: Agreed.

**Settled outcome**: Lists are private by default. This reverses the old settled call in `docs/QnA/listitup-product-model.md` (Q14, now superseded).

### 13. What should the List-level role ladder look like?

**Recommended answer**: `Lead` / `Member` / `Viewer`, deliberately different words from the Workspace ladder to avoid confusion.

**User answer**: Agreed.

**Settled outcome**: List-level roles are `Lead`, `Member`, `Viewer`.

### 14. What does the Workspace-level ladder mean now that List access is separately gated?

**Recommended answer**: `Owner` (sole, un-demotable, delete/transfer authority) / `Admin` (manage members, create Lists, assign List-level roles) / `Member` (no List access by default) / `Viewer` (never more than read, anywhere) — Workspace `Member` alone grants no List access.

**User answer**: Agreed, plus: `Owner` and `Admin` can see all Lists in the Workspace; `Member` and `Viewer` can only see Lists they're assigned to.

**Settled outcome**: Workspace ladder is `Owner`/`Admin`/`Member`/`Viewer` as above. `Owner` and `Admin` have implicit access to every List, including private ones.

### 15. Is "Viewer-only via invitation for a third person" a distinct guest-invite flow, or the new default for every invite?

**Recommended answer**: A distinct client/guest invite type — the inviter picks `Member` or `Viewer` for teammates at invite time.

**User answer**: While inviting, the inviter can choose `Member` or `Viewer` for an actual Workspace member; for a "third person" it's always `Viewer` — no choice.

**Settled outcome**: Refined further by Q16 — the "third person, always Viewer" case became the separate `Guest` mechanism entirely, not a Workspace invitation.

### 16. Can the "third person"/Guest be added directly to a List without joining the Workspace, and is Guest strictly read-only, addable to multiple Lists independently?

**User's correction**: External Collaborators (renamed `Guest`) can only be added to a specific List, never to the whole Workspace.

**Recommended answer** (after correction): `Guest` is strictly read-only within that one List, and the same person can independently be a Guest on multiple Lists (no Workspace-level identity ties those together).

**User answer**: Yes to both.

**Settled outcome**: `Guest` is a third, separate access path — added directly to one specific List by that List's `Lead` or a Workspace `Admin`/`Owner`, never joins the Workspace, read-only, no cross-List visibility, and independently grantable per List.

### 17. Detailed role-and-permission spec review (user-authored draft)

The user drafted a full role/permission specification (Workspace roles, List roles, Guest access, effective-access resolution order, data model shape, invitation flows, UX/security rules) and asked for a review against everything settled so far.

**Findings surfaced**:
- The draft used `Task`/`TaskAssignee`/`TaskWatcher` throughout, conflicting with the settled decision (Q4) to keep `Item` as the broad canonical term.
- The draft introduced a new, previously undiscussed restriction: Workspace `Member` cannot create Lists (only `Admin`/`Owner` can).
- The draft introduced a new concept, `Watcher` (in addition to `Creator`/`Assignee`), not previously discussed.

**User answer**: (1) `Task` in the draft was loose phrasing — normalize to `Item` everywhere. (2) Confirmed: `Member` cannot create Lists. (3) Drop `Watcher` for v1; keep `Creator` and `Assignee(s)`.

**Settled outcome**: The full role/permission spec is accepted with `Item` terminology throughout (no `Task` subtype), `Member` excluded from List creation, and no `Watcher` concept in v1. Recorded in `docs/ADR/0009-two-tier-roles-with-list-scoped-guests.md`.

## Date

2026-08-26

## Follow-Ups

- Glossary updates: `CONTEXT.md` rewritten — `Section`, `Assignee`, `Creator`, `Workspace Owner`, `List Lead`, `List Member`, `List Viewer`, `Guest`, `To Do`, `In Progress` added; `Owner` and `Open` removed; `List`, `Item`, `Admin`, `Member`, `Viewer`, `My Tasks`, `Personal Note`, `Report`, `Analytics` updated.
- ADRs created: `docs/ADR/0008-medium-fish-domain-model-redefinition.md`, `docs/ADR/0009-two-tier-roles-with-list-scoped-guests.md`.
- Specs affected: unblocks the 8 remaining tickets on the [wayfinder map](https://github.com/Dhruvivek/ListItUp/issues/1) (Home/Dashboard, Inbox, My Tasks, Projects, Portfolio/Goals, task-details, Reports/Analytics, Chat/VC design), all of which depended on this domain model being settled.
