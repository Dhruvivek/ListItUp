# Grill Session: Personal Dashboard/Profile & Home Feature Surface

## Context

Resolving [wayfinder ticket #5](https://github.com/Dhruvivek/ListItUp/issues/5), "Decide the personal dashboard/profile & Home feature surface" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its only blocker, [#2](https://github.com/Dhruvivek/ListItUp/issues/2) (core domain model), was already settled (`docs/QnA/listitup-core-domain-model-v2.md`). Mines `brainstorm/profile.md` (Profile page) and the Home section of `brainstorm/Work.md` for ListItUp's v1 feature surface, deciding core v1 / later phase / rejected for each brainstormed feature.

Out of scope for this session: the **My Goals** widget, which depends on [#9](https://github.com/Dhruvivek/ListItUp/issues/9) "Decide Portfolio & Goals scope" (still open) — not decided here.

## Questions

### 1. Is this one surface or two?

**Recommended answer**: Keep them separate — a cross-Workspace `Profile` (identity/account) and a per-Workspace `Home` (dashboard), mirroring the precedent `My Tasks` already set as a cross-Workspace concept.

**User answer**: Keep them separate.

**Settled outcome**: `Profile` is a cross-Workspace personal identity page. `Home` is a per-Workspace landing dashboard. No widget duplication between them.

### 2. Core profile identity fields

**Recommended answer**: Core v1 — avatar, Display Name (already a defined term), edit-profile action, "About Me" free text. No new domain concepts involved.

**User answer**: Keep them.

**Settled outcome**: Avatar, Display Name, edit-profile action, and About Me are core v1 Profile fields.

### 3. Out of Office status

**Recommended answer**: Later phase — implies availability/notification semantics for Assignees that haven't been designed, and shouldn't block Profile v1.

**User answer** (round 1): Leave for right now.

**Clarified** (round 2 — Q12): Confirmed as Later phase rather than leaving the bucketing itself open.

**Settled outcome**: Out of Office status is a later-phase feature, not core v1.

### 4. Team/department tag on profile

**Recommended answer**: Reject for v1 — no `Team`/`Department` entity exists in the domain model, and there's no defined consumer (filtering, directory) for a freeform tag.

**User answer**: Reject for v1.

**Settled outcome**: No team/department field in v1 Profile. Open to revisit only if a real domain-modeled use for org sub-structure emerges later.

### 5. My Tasks preview widget on Home

**Recommended answer**: Core v1 — trivial, reuses the already-settled `My Tasks` view as a preview/link-out.

**User answer**: Sounds good.

**Settled outcome**: Home shows a My Tasks preview widget, linking to the full `My Tasks` view.

### 6. "Recent Projects" / "Projects" widget

**Recommended answer**: Core v1, renamed to **Recent Lists** — shows Lists the current User has access to and has recently visited, respecting private-by-default Lists.

**User answer**: Agreed.

**Settled outcome**: Home shows a Recent Lists widget (renamed from "Recent Projects"), scoped to Lists the User can actually see.

### 7. Frequent Collaborators / People

**Recommended answer**: Later phase — "frequent" needs activity/collaboration history not yet modeled, and computing a collaborator set depends on List membership existing first.

**User answer**: Not essential for v1.

**Settled outcome**: No Collaborators/People widget in v1 Home. Deferred until there's real usage data and List membership to compute it from.

### 8. "Tasks I've Assigned" (delegated-work view)

**Recommended answer** (round 1): Later phase — `My Tasks` (Assignee-facing) is already the v1 priority; an Assigner-facing view is secondary.

**User answer** (round 1): Add it also in v1.

**Settled outcome**: Included in v1, as **Items I've Assigned** (avoiding "Task" per the settled `Item` terminology). See Q13-14 for how it's scoped.

### 9. Home header

**Recommended answer**: Split into (a) date + time-based greeting — cosmetic, core v1, no new concepts; (b) numeric stats (tasks-completed count, collaborators count) + time filter (My Week/My Month) — overlaps the still-open Reports/Analytics ticket ([#11](https://github.com/Dhruvivek/ListItUp/issues/11)), so defer entirely to that ticket.

**User answer**: (a).

**Settled outcome**: Home header shows date + time-based greeting only in v1. Stats and time-filtering are deferred to #11, not decided here.

### 10. Customize control / configurable widgets

**Recommended answer**: Later phase — a full add/remove/rearrange widget system is a sizable feature on its own; ship v1 Home as a fixed, curated layout instead.

**User answer**: Later phase.

**Settled outcome**: No widget-customization framework in v1. Home's v1 layout is fixed (My Tasks preview, Recent Lists, Items I've Assigned).

### 11. Learn App widget

**Recommended answer**: Reject (never) — Asana-specific product-education content, not something ListItUp needs to clone.

**User answer**: Rejected.

**Settled outcome**: No Learn App widget, ever.

### 12. Clarifying Q3 (Out of Office)

**Recommended answer**: Settle it as Later phase now rather than leaving the bucketing itself open — an untracked loose end is worse than "later phase," which already means "not blocking v1."

**User answer**: Not confirmed yet — add it in later phase.

**Settled outcome**: Out of Office is confirmed Later phase (see Q3).

### 13. What does "Items I've Assigned" actually query?

**Recommended answer**: Creator-based for v1 — Items where the current User is `Creator` and the `Assignee` list includes someone else. No domain-model change needed, but doesn't catch delegation on Items the current User didn't create themself. True per-assignment "assigned by" tracking would need a new field, deferred as a possible later-phase upgrade.

**User answer**: Creator-based.

**Settled outcome**: Items I've Assigned is computed as `Creator == current User AND Assignee includes someone other than current User`. No new `Assigned By` field in v1.

### 14. Where does "Items I've Assigned" live?

**Recommended answer**: Scoped to Home, per-Workspace — delegation happens within a List the User has access to, consistent with Q1's Profile/Home split.

**User answer**: Home, per-Workspace.

**Settled outcome**: Items I've Assigned is a per-Workspace Home widget, not a cross-Workspace view like `My Tasks`.

### 15. Does Profile carry any dashboard widgets?

**Recommended answer**: Identity-only — duplicating widgets across Profile and Home creates two surfaces that can drift out of sync for no benefit.

**User answer**: Identity only.

**Settled outcome**: Profile has no work widgets. All work-related widgets (My Tasks preview, Recent Lists, Items I've Assigned) live on Home exclusively.

## Date

2026-08-27

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Home` and `Profile` as page-level terms.
- ADRs created: None — this session bucketed feature scope (core v1 / later / rejected), it didn't make a hard-to-reverse architectural call. The Creator-based approximation for Items I've Assigned (Q13) is explicitly flagged as revisitable, not durable.
- Specs affected: Unblocks a future Home/Profile spec under `docs/Specs-Planned/` (to be written via `to-prd`/`to-issues`). My Goals remains excluded pending [#9](https://github.com/Dhruvivek/ListItUp/issues/9).
