# Grill Session: Task-Detail Feature Surface

## Context

Resolving [wayfinder ticket #10](https://github.com/Dhruvivek/ListItUp/issues/10), "Decide the task-detail feature surface" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its scope boundary with [#7](https://github.com/Dhruvivek/ListItUp/issues/7) (My Tasks) was already settled: `#7` decided only which Task Details panel fields exist and are visible (title, status, assignee, due date, section, list association, description, comments); `#10` owns the deep *behavior* of the four remaining fields from `brainstorm/Work.md`'s Task Details section — Custom Fields, Dependencies, Time Tracking (`Actual Time` + `Time Tracker`), and Attachments. Attachments also carries prior settled decisions from before the "medium fish" scope-up (`docs/QnA/listitup-gap-grilling.md` Q9-Q12, `docs/ADR/0002-s3-compatible-attachment-storage.md`) that this session re-confirms rather than re-deciding from scratch. Custom Fields, Dependencies, and Time Tracking were explicitly undecided going in — the old gap-grilling session's rejection of structured dependency objects is superseded along with the rest of that session.

## Questions

### 1. Custom Fields

**Recommended answer**:

Core v1, trimmed type set: Text, Number, Dropdown (single-select), and Date only — drop multi-select, people-picker, and formula fields. Field definitions live on the `List` (managed by List Lead/Admin, mirroring `Label` creation rights); field values are per-`Item`, editable by List Members.

**User answer**:

Agreed, go ahead as recommended.

**Settled outcome**:

`Custom Field` is core v1: a typed field (Text/Number/Dropdown/Date) defined per-`List` by its Lead/Admin, with values set per-`Item` by List Members.

### 2. Dependencies

**Recommended answer**:

Core v1, data model + panel only: a simple `blocks`/`is blocked by` link between any two Items, cross-List allowed (permission-checked), shown in the Task Details panel. No automatic status changes — an Item doesn't auto-flip to `Blocked` when its dependency isn't done, since `Blocked` remains a manual/explicit state per its existing definition. No critical-path calculation, no auto-rescheduling. Timeline's dependency-arrow visualization stays deferred; this only settles what a dependency *is*.

**User answer**:

Agreed, go ahead as recommended.

**Settled outcome**:

`Dependency` is core v1: a `blocks`/`is blocked by` link between two Items (cross-List allowed), manually managed, displayed in the Task Details panel. Does not affect `Blocked` state automatically. Timeline dependency-arrow visualization remains a separate, still-open follow-up.

### 3. Time Tracking (`Actual Time` + `Time Tracker`)

**Recommended answer**:

Later phase — real scope (timer state, multi-device consistency, manual-entry reconciliation), and its main payoff (reporting on logged time) depends on [#11](https://github.com/Dhruvivek/ListItUp/issues/11) (Reports/Analytics), still open.

**User answer**:

Agreed, go ahead as recommended.

**Settled outcome**:

Time Tracking is later phase. Not built in v1; revisit once `#11` settles what analytics consume logged time.

### 4. Attachments — re-confirm or revise for the new scale?

**Recommended answer**:

Re-confirm unchanged. Nothing about the medium-fish domain-model redefinition (multi-Assignee, 5-state lifecycle, two-tier roles) touches how files attach to an Item or where they're stored.

**User answer**:

Agreed, go ahead as recommended.

**Settled outcome**:

Attachments are unchanged: S3/MinIO-backed private object storage (`ADR 0002`, still stands), ZIP/images/PDFs/common documents allowed, 1GB per-file limit, no preview/virus-scanning, ZIP is download-only.

## Date

2026-09-03

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Custom Field`, `Dependency`.
- ADRs created: none — `ADR 0002` (Attachments) re-confirmed as-is; Custom Fields/Dependencies are additive feature-surface decisions, not durable/hard-to-reverse architecture calls.
- Specs affected: Unblocks a future Task Details spec under `docs/Specs-Planned/`. Flagged a follow-up comment on `#11` (Time Tracking now has a scope dependency on Analytics settling first). Timeline's dependency-arrow visualization (flagged from `#8`) remains open — `#10` only settled what a `Dependency` is, not how Timeline draws it.
