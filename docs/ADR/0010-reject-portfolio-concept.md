# Reject Portfolio as a Product Concept

While grilling [#8](https://github.com/Dhruvivek/ListItUp/issues/8) (List feature surface & views), we decided `Portfolio` — Asana's grouping of related Projects for manager-level rollup views (`brainstorm/Work.md`'s `Portfolio` section) — will not exist in ListItUp, now or as a later phase. This is a deliberate scope cut against the Asana-parity baseline the brainstorm doc assumed, not an oversight: ListItUp's "medium fish" target ([`docs/ADR/0008`](./0008-medium-fish-domain-model-redefinition.md)) blends Asana-style team features with Todoist-style simplicity, and a Portfolio rollup layer is exactly the kind of manager-tooling complexity that scope was meant to bound. [#9](https://github.com/Dhruvivek/ListItUp/issues/9) ("Decide Portfolio & Goals scope") is narrowed to Goals only as a result — a `Goal` will attach directly to a `List`, with no Portfolio grouping layer in between.

## Status

accepted

## Consequences

- `brainstorm/Work.md`'s `Portfolio`, `Portfolio Home`, `Inside a Portfolio`, and `Portfolio Status` sections describe a feature ListItUp will not build; don't treat them as pending scope.
- The List-browsing page (`#8`) has no `Portfolio` search/filter facet.
- A List's Overview tab has no `Connected Portfolios` field. `Connected Goal` remains a planned future field once `#9` settles Goals.
- `#9`'s title changes from "Decide Portfolio & Goals scope" to "Decide Goals scope."
