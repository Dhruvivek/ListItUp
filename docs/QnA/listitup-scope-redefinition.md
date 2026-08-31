# Grill Session: ListItUp Scope Redefinition

## Context

Naming the destination for a new wayfinder map ([#1](https://github.com/Dhruvivek/ListItUp/issues/1)) built to mine `brainstorm/profile.md` and `brainstorm/Work.md` (an Asana-style feature dump) for ListItUp's actual v1+ feature list. What started as "extract a feature list from these docs" turned into a full product-scope pivot mid-session.

## Questions

### 1. What kind of destination is this map finding its way to?

**Recommended answer**:

A v1+ feature roadmap: given the settled model already covers a lot of ground, the useful destination is a phased feature roadmap saying what's in, deferred, or rejected — ready to hand to `to-prd`/`to-issues` afterward.

**User answer**:

Confirmed (b) — a feature roadmap.

**Settled outcome**:

The map's destination is a settled, prioritized v1+ feature roadmap, not a narrower single decision or a full PRD written in-session.

### 2. Is redefining the settled model itself on the table, or is it a fixed constraint?

**Recommended answer**:

Free to revisit, but with a high bar — settled decisions stay default, reopening one needs an explicit new grilling exchange.

**User answer**:

Neither the settled model nor any previous model is fixed — needs brainstorming. Discard the previous decisions; a lot has changed; this is a fresh start.

**Settled outcome**:

The prior small-Workspace-only product model (`docs/QnA/listitup-product-model.md`, `docs/QnA/listitup-gap-grilling.md`, `docs/QnA/personal-and-team-workspaces.md`) is discarded, not just revisable. Which concepts (Project, Portfolio, Section, Subtask, Dependencies, multi-value Assignee, etc.) come back is explicitly left open — it's the job of the map's domain-model ticket, not settled here.

### 3. What's the time horizon — is there a real "never" bucket, or is everything just "later"?

**Recommended answer**:

Real "never" bucket, since the settled small-Workspace-only model ruled out multi-team org structures on scope grounds, not just phasing.

**User answer**:

The scope has changed — it is not a small-scale application anymore.

**Settled outcome**:

Scope is significantly larger than the old model assumed. The "never" bucket from the old scope (multi-team orgs, Portfolios, etc.) no longer automatically applies; each item needs re-evaluating under the new scope rather than staying excluded by inertia.

### 4. How big is "not small-scale anymore"?

**Recommended answer**:

No recommendation offered — this is the crux of the pivot.

**User answer**:

If Asana is the "big fish," ListItUp isn't becoming a small fish or the big fish — it's a **medium fish**: not an ordinary task-management app, but one with traditional task-management features like both Asana and Todoist, plus a few new differentiator features.

**Settled outcome**:

ListItUp's new scope target is a "medium fish": bigger than the old 2-8-person single-Workspace tool, blending Asana-style team/project features with Todoist-style personal simplicity, plus new differentiators — not necessarily a full multi-org enterprise clone of Asana. The exact scale (single bigger team vs. true multi-org) is left to the domain-model ticket.

### 5. What exactly counts as "Asana features" for the core baseline?

**Recommended answer**:

Treat the full brainstorm-doc surface as the literal baseline unless exclusions are flagged now — narrowing later is cheaper than re-mining the docs too early.

**User answer**:

There is a subset that isn't decided yet — that's what the map has to decide.

**Settled outcome**:

The full feature surface of `brainstorm/profile.md` + `brainstorm/Work.md` is the candidate baseline. Which subset becomes core v1 / later / rejected is explicitly undecided and is the map's actual work, broken into per-area feature-subset tickets.

### 6. Does "discard previous decisions" reach the infra ADRs too, or just the product-model docs?

**Recommended answer**:

Only product-model/scope docs are being redrawn; infra ADRs (auth, storage, rate-limiting, licensing, platform-operator boundary, Discord alert format) stand.

**User answer**:

Only product-model.

**Settled outcome**:

Infra ADRs `0001`-`0007` are unaffected by this pivot. Only the product-model QnA sessions and `CONTEXT.md`'s product glossary are in scope for redefinition.

### 7. Is there a Todoist-equivalent brainstorm doc, or does that need research?

**Recommended answer**:

Research ticket — Todoist's feature set is well-documented publicly and cheap for a research subagent to summarize as a second baseline input.

**User answer**:

Create a research ticket.

**Settled outcome**:

A wayfinder research ticket was created and fired to research Todoist's public feature set as a second baseline, alongside the Asana-derived brainstorm docs.

### 8. The "few new cool features" — specific ideas already, or open for the map to explore?

**Recommended answer**:

No recommendation offered.

**User answer**:

One concrete idea for now: a Discord-style voice-channel (VC) system in v1, and a chat system like Google Meet's, both personal (1:1) and inside a project, in v1. Video calls and screen share come later — explicitly not in v1. More new features may be added over time as they come up; this isn't a closed list.

**Settled outcome**:

The v1 differentiator baseline includes a Discord-style VC system and a Meet-style text chat (per-project and personal 1:1), with video calls and screen share deferred to a later phase. The map stays open to additional new differentiator features being added later — it is not expected to "complete" in the sense of closing off all future features.

## Date

2026-08-26

## Follow-Ups

- Glossary updates: none yet — `CONTEXT.md`'s product glossary (`Owner`, `Workspace`, absence of `Project`/`Portfolio`) is provisional pending the map's domain-model ticket.
- ADRs created: none in this session (infra ADRs `0001`-`0007` unaffected).
- Specs affected: supersedes the product-model conclusions of `docs/QnA/listitup-product-model.md`, `docs/QnA/listitup-gap-grilling.md`, `docs/QnA/personal-and-team-workspaces.md` (each now carries a superseded banner). See the wayfinder map: [Wayfinder Map: ListItUp v1+ feature roadmap](https://github.com/Dhruvivek/ListItUp/issues/1).
