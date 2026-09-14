# Reject Goal as a Product Concept

While grilling [#9](https://github.com/Dhruvivek/ListItUp/issues/9) (Goals scope), we decided `Goal` — Asana's OKR-style objective that Projects and Portfolios link to for progress rollup (`brainstorm/Work.md`'s "Connected goals" field and Portfolio Goals tab; `brainstorm/profile.md`'s "My Goals" widget) — will not exist in ListItUp. This is a deliberate rejection, not a deferral: in Asana's model a Goal is fundamentally a many-to-many rollup construct (many Projects and Portfolios can link to one Goal, with progress computed across them), which is the same "manager-tooling complexity" shape [ADR 0010](./0010-reject-portfolio-concept.md) already drew a line against for Portfolio. `#9`'s follow-up comment had floated a simplified, single-List-scoped Goal as a fallback, but on review that halfway version doesn't earn its keep against the "medium fish" scope either.

## Status

accepted

## Consequences

- `brainstorm/Work.md`'s "Connected goals" Project-Overview field and the Portfolio "Goals" tab, and `brainstorm/profile.md`'s "My Goals" widget, describe a feature ListItUp will not build; don't treat them as pending scope.
- The `Connected Goal` field [ADR 0010](./0010-reject-portfolio-concept.md) reserved as a future hook on a List's Overview tab is removed, not left pending — a List's Overview tab has no Goal-related field at all.
- No `Goal` entity, and no `On Track`/`At Risk`/`Off Track` status enum, is added to the domain model. `List Status` (`On Track`/`On Hold`/`Completed`/`Dropped`, [`docs/QnA/list-feature-surface-and-views.md`](../QnA/list-feature-surface-and-views.md) Q4) remains the only "track health" concept in ListItUp, avoiding a naming collision between two different "On Track" meanings at different levels.
- `#9` is closed as rejected. If a goal-tracking feature is wanted later, it needs a fresh ticket against the current domain model rather than resuming `#9`.
