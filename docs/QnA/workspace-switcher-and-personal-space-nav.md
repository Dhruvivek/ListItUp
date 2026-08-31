# Grill Session: Workspace Switcher & Personal Space Nav

## Context

Before starting wayfinder ticket [#8](https://github.com/Dhruvivek/ListItUp/issues/8) ("Decide the Project feature surface & views") and the tickets after it, the user described a navigation flow in mind: a workspace switcher to move between Workspaces, with a permanently pinned Personal section in the nav bar so the user never has to switch out of their current Workspace to reach personal Lists. No existing doc had settled nav-bar/IA structure — `CONTEXT.md` only established `Workspace` as the top container and `Home` as a per-Workspace landing page (`docs/QnA/listitup-profile-and-home-surface.md`), and `My Tasks` as the cross-Workspace assigned-Items view (`docs/QnA/personal-and-team-workspaces.md`, carried forward by `docs/QnA/listitup-core-domain-model-v2.md`). This session also surfaced and resolved a terminology change beyond the nav question itself.

## Questions

### 1. What does the permanent Personal section actually show?

**Recommended answer**: Show the personal Workspace's own Lists directly, the same way any Workspace's Lists show in the nav. Keep `My Tasks` as the separate, already-settled cross-Workspace view.

**User answer**: Confirmed the logic, but flagged that "personal Workspace" and "Workspace" should be two differently-named things: `Personal Space` and `Workspace` (the group/shared kind) — see Q6.

**Settled outcome**: The pinned section shows the User's `Personal Space` Lists directly. `My Tasks` remains the separate cross-Workspace assigned-Items view, unchanged.

### 2. Is the personal Workspace also an entry inside the workspace switcher?

**Recommended answer**: Leave it out of the switcher; pin it permanently instead, since including it in both places is redundant and works against the "no hustle" goal.

**User answer**: Leave it from the switcher.

**Settled outcome**: `Personal Space` never appears as a switcher entry. It is reached only via its permanent pinned nav section.

### 3. Is the pinned Personal section always expanded, or collapsed by default?

**Recommended answer**: Always expanded by default.

**User answer**: Collapsed by default — keeps the UI clean and gives the User a clear visual separation between their Personal Space and the current Workspace.

**Settled outcome**: The pinned Personal Space section is collapsed by default, expandable on click.

### 4. What label does the pinned section use?

**Recommended answer**: Fixed label "Personal", with `Personal Workspace` as the underlying entity name.

**User answer**: "Personal Space."

**Settled outcome**: Superseded by Q6 — `Personal Space` is the real glossary term, not just a nav-bar label.

### 5. What happens when the User picks a different Workspace from the switcher?

**Recommended answer**: Navigate to that Workspace's `Home` page.

**User answer**: Yes.

**Settled outcome**: Selecting a Workspace from the switcher navigates to that Workspace's `Home` page.

### 6. Is the Personal Space/Workspace split a full terminology change or just nav-bar copy?

**Recommended answer**: Full terminology change — `Personal Space` becomes the real glossary term everywhere, and `Workspace` narrows to mean the shared/group kind only, reversing `CONTEXT.md`'s prior instruction to avoid "personal space." A glossary change, not a hard-to-reverse architectural one, so no new ADR.

**User answer**: Agreed — full change, but keep the `CONTEXT.md` edit minimal (only what actually needs to change), and raise a GitHub ticket recording the decision, closed as resolved with a comment.

**Settled outcome**: `Personal Space` replaces `personal Workspace` as the canonical term throughout. `Workspace` now refers only to the shared/group kind. The underlying implementation (a single-member, auto-provisioned container) is unchanged — this is a naming decision, not a data-model change.

## Date

2026-08-31

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Personal Space` as its own term; `Workspace` narrowed to the shared/group kind (dropped "personal space" from its avoid-list, added `personal Workspace`); `Inbox List` and `Label` updated to say `Personal Space` instead of "personal Workspace." `Home`, `My Tasks`, and role/permission entries were left unchanged as not requiring an edit for this rename.
- ADRs created: None — naming change only, not a hard-to-reverse architectural decision.
- Specs affected: Informs the nav-bar/IA implementation for wayfinder ticket [#8](https://github.com/Dhruvivek/ListItUp/issues/8) onward. Recorded and resolved as a GitHub issue per the user's request.
