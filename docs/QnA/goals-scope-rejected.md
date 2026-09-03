# Grill Session: Goals Scope

## Context

Resolving [wayfinder ticket #9](https://github.com/Dhruvivek/ListItUp/issues/9), "Decide Goals scope" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). `#9` originally asked whether ListItUp needs Portfolio- and Goals-equivalent concepts at all; a follow-up comment narrowed it to Goals only after [#8](https://github.com/Dhruvivek/ListItUp/issues/8) rejected Portfolio outright ([ADR 0010](../ADR/0010-reject-portfolio-concept.md)), leaving a working assumption that a `Goal`, if kept, would attach directly to a `List` with no Portfolio layer in between. Source material: `brainstorm/Work.md`'s "Connected goals" field (Project Overview) and Portfolio Goals tab, and `brainstorm/profile.md`'s "My Goals" widget (create/track goals, status On Track/At Risk/Off Track).

## Questions

### 1. Does `Goal` exist as a product concept in ListItUp at all?

**Recommended answer**:

Keep it, deliberately simplified: a `Goal` as a lightweight, user-authored tracker attached to exactly one `List`, no cross-List aggregation — preserving the intent behind the "Connected Goal" hook `#8`/ADR 0010 reserved, without reintroducing Portfolio-shaped rollup complexity.

**User answer**:

Drop the Goal concept.

**Settled outcome**:

`Goal` does not exist as a product concept in ListItUp.

### 2. Is this a permanent rejection or a v1 deferral?

**Recommended answer**:

V1 deferral, recorded only in the wayfinder map's "Out of scope" section and this transcript — no ADR, since nothing durable/hard-to-reverse is being decided.

**User answer**:

Permanent rejection — treat it the same as Portfolio.

**Settled outcome**:

`Goal` is permanently rejected as a product concept, the same treatment as Portfolio ([ADR 0011](../ADR/0011-reject-goals-concept.md)). The `Connected Goal` hook ADR 0010 had reserved on a List's Overview tab is removed rather than left pending.

## Date

2026-09-03

## Follow-Ups

- Glossary updates: none — rejected concepts don't get a `CONTEXT.md` entry (consistent with how Portfolio was handled).
- ADRs created: `docs/ADR/0011-reject-goals-concept.md` — rejects `Goal` as a product concept.
- Specs affected: none pending on `Goal`. The wayfinder map (`#1`)'s "Out of scope" section now records both Portfolio and Goal as rejected.
