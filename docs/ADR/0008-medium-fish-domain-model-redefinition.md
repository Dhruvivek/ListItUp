# Medium-Fish Domain Model Redefinition

ListItUp's product scope grew from a small (2-8 person) accountability tool into a "medium fish" that blends Asana-style team/project features with Todoist-style personal simplicity (see [Wayfinder Map #1](https://github.com/Dhruvivek/ListItUp/issues/1), `docs/QnA/listitup-scope-redefinition.md`). This required re-deciding the core entity hierarchy rather than just adding features on top of the old model. `List` keeps its name (the product's namesake) but absorbs Asana's Project-level capabilities: it can hold Sections, and richer views over its Items are decided per-feature downstream rather than requiring a separate `Project` entity. `Item` stays the deliberately broad canonical term — covering tasks, notes, ideas, and decisions — rather than narrowing to `Task`, and now supports nested child Items so any Item type can be broken down further. Accountability moves from a single `Owner` to zero-or-more `Assignees`, since real work (e.g. splitting a large data-extraction task) sometimes needs more than one person; a separate immutable `Creator` is tracked alongside. The Item lifecycle grows from 4 states to 5 (`To Do` / `In Progress` / `Blocked` / `Complete` / `Archived`) so a Workspace can tell "not started" apart from "someone's on it" now that Items can have several Assignees. No `Organization` layer is added above `Workspace`, and whether a `Portfolio`-equivalent exists is left to a downstream ticket.

## Status

accepted

## Consequences

- The old small-Workspace-only product-model QnA sessions (`docs/QnA/listitup-product-model.md`, `docs/QnA/listitup-gap-grilling.md`, `docs/QnA/personal-and-team-workspaces.md`) are superseded; their settled outcomes should not be treated as current.
- Any single Assignee can mark a multi-assignee Item Complete — there is no per-Assignee partial-completion tracking. Splitting work across people means splitting the Item into child Items, each with its own Assignee.
- Reports and Analytics that filtered or grouped by `Owner` need to account for `Assignee` being multi-valued.
- Nothing besides auth + Workspace-provisioning is implemented yet (`client/prisma/schema.prisma` has no `Item`/`Section`/`Assignee` models), so this is a model to build against, not a migration off existing product data.
