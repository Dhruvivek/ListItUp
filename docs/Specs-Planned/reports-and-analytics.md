# Reports & Analytics

## Problem Statement

Once Lists and Items carry real data (List & Item Core spec) and Users have a My Tasks queue (Home/Profile/Updates/My Tasks spec), there is still no way to summarize that data: no saved, reusable filter views, no CSV export, and no operational-health signals (completion rate, blocked/overdue counts, aging Items, workload) surfaced anywhere. The `Dashboard` tab is reserved but empty on both List and My Tasks pages from the prior specs.

ADR 0012 already settled that `Report` reverses the old snapshot model — a saved Report is a persisted filter/setup that always re-runs live, never a frozen copy — and that both saving a Report and exporting one as CSV are core v1, List-scoped only (no cross-List or Workspace-wide ad-hoc reporting in this release).

## Solution

Ship List-scoped Report save/rename/delete, CSV export, and the Analytics content that fills the List and My Tasks Dashboard tabs: count/breakdown widgets, and four visualizations (a completion heatmap, a contribution map, a progress graph, and a state-imbalance radar chart), each tied to one specific accountability question rather than a generic productivity score.

One new seam, `lib/report/`, carries this spec's behavior: Report CRUD and query execution, plus Analytics aggregation. It is deliberately separate from `lib/item/` because it is read/aggregation-shaped (queries across many Items) rather than mutation-shaped, and because ADR 0012 gives it its own settled semantics to implement precisely.

## User Stories

1. As a List Member, I want to save my current filter setup on a List as a named Report, so that I can re-run the same view later without rebuilding it.
2. As a List Member, I want any Member to be able to save a Report without needing List Lead or Admin approval, so that Reports are as easy to create as any other personal productivity tool, unlike Lists or Labels which have creation gates.
3. As a List Member, I want a Report I save to be private to me by default, so that my personal filter setups do not clutter the List for everyone else unless I choose to share them.
4. As a List Member, I want reopening a saved Report to re-run its filter against current data, never a frozen snapshot, so that a Report always reflects what is actually happening in the List right now.
5. As a List Member, I want to rename or delete a Report I created, so that I can keep my saved Reports tidy.
6. As a List Member, I want to export a Report's current results as a CSV file, so that I can share or archive a point-in-time view outside ListItUp.
7. As a User, I want Reports to be List-scoped only in this release, with no top-level Reports nav item and no cross-List or Workspace-wide ad-hoc reporting, so that the feature ships with a clear, bounded surface.
8. As a User opening a List's Dashboard tab, I want widgets for Total, Completed, Incomplete, and Overdue Item counts, so that I get an at-a-glance read on the List's health.
9. As a User on a List's Dashboard, I want a breakdown of Items by Section, by state, and Completion-Over-Time, so that I can see where work is concentrated and how completion is trending.
10. As a User on My Tasks' Dashboard tab, I want the same category of widgets (Total/Completed/Incomplete/Overdue, breakdown by state or by source List, Completion-Over-Time) scoped to my own assigned Items across every Workspace, so that I get the same at-a-glance read on my personal queue.
11. As a User, I want a completion heatmap showing when Items were completed, aggregated (not broken out per Member), available on both List and My Tasks Dashboards, so that I can see completion rhythm over time.
12. As a User on My Tasks, I want a contribution map showing how consistently I am moving my own work forward, personal-only (not shown for anyone else), so that I get private insight into my own pace.
13. As a User on a List's Dashboard, I want a contribution map broken out per Member, so that a Lead or Admin can see the List's overall pace of progress across its people.
14. As a User, I want a progress graph showing how close a List (or, on My Tasks, my personal queue) is to done, aggregated, available on both Dashboards, so that I can track overall progress toward completion.
15. As a User on My Tasks, I want a radar chart showing my own attention imbalance across To Do, Blocked, Overdue, and Complete, personal-only, so that I can see where my own attention is skewed.
16. As a User on a List's Dashboard, I want a radar chart broken out per Member showing the same attention-imbalance shape, so that a Lead or Admin can see where the List's people are collectively over- or under-attending to different states.
17. As a List Member, I want per-Member charts on a List's Dashboard to be visible by default to every Member of that List (not Workspace-wide), so that visibility matches who already has access to the List's Items.
18. As a User, I want per-Member charts on a List's Dashboard to plot non-raw-count metrics (rates, shares, or normalized measures rather than bare Item counts), so that the chart cannot be read as a raw-output leaderboard between Members.
19. As a Workspace Owner or Admin, I want an explicit "peer comparison" capability to exist as a separate, off-by-default setting from the default per-Member charts, so that any more direct Member-to-Member comparison is something a Workspace has to opt into, not something that ships on by default.
20. As a User, I want Analytics to have no AI-generated summary and no gamification elements (scores, streaks, leaderboards) in this release, so that the feature stays about accountability, not engagement mechanics.
21. As a User, I want every Analytics widget or visualization to be traceable to one specific accountability question (for example, "is completion on track," "who is overloaded," "where is attention imbalanced") rather than existing as a generic metric with no clear purpose, so that the Dashboard stays legible rather than becoming a wall of numbers.
22. As a User, I want the List Dashboard and My Tasks Dashboard tabs, previously reserved as empty placeholders, to now render their real content, so that the tab structure from the earlier specs is fulfilled rather than left permanently empty.

## Implementation Decisions

- Build `lib/report/` covering: Report create/rename/delete, Report query execution (re-running a saved filter/setup against current List data live, never persisting a result snapshot), CSV serialization of a Report's current result set, and Analytics aggregation functions for each widget/visualization listed above (count/breakdown queries, heatmap data, contribution-map data, progress-graph data, radar-chart data). All read access is checked through `lib/permissions/`, matching every other seam.
- A Report record persists its owning User, its List, its name, and its filter/setup definition (Assignee, state, or date filters, per `CONTEXT.md`'s Report definition) — it does not persist result rows. Running/opening a Report always re-executes its filter against current Item data.
- Report visibility defaults to private-to-creator; sharing a Report with other List Members (if built at all in this pass) is a smaller follow-on decision, not assumed by this spec — treat "private by default" as the settled, must-ship behavior and any sharing UI as optional scope to confirm before building.
- CSV export streams or generates the Report's current query result server-side and returns it as a downloadable file from a Route Handler (an external-consumer-shaped operation per the Next.js conventions doc, justifying a Route Handler rather than a Server Action here).
- Analytics aggregation queries are scoped per List (for List Dashboards) or per current User across Workspaces (for My Tasks Dashboards) — there is no Workspace-wide or cross-List aggregation surface in this release, matching the Report scope boundary.
- Per-Member List Dashboard charts (contribution map, radar chart) query and render metrics normalized per Member (for example, a completion rate or a share of total, not a bare count) specifically to satisfy the non-raw-count guardrail; the underlying aggregation function should make normalized output the default return shape rather than something the UI layer has to remember to compute.
- Implement "peer comparison" as a distinct, off-by-default Workspace-level (or List-level — confirm which scope ADR 0012's session intended before building) setting, separate from the always-on default per-Member charts described above. Do not conflate the two: default per-Member charts are non-comparative by construction (normalized metrics, List-scoped visibility only), while peer comparison is an explicit additional capability a Workspace opts into.
- `Workload` (the later-phase, List-scoped Analytics view re-homed from the rejected Portfolio concept) and AI Summary are not built in this spec; leave no placeholder UI for them beyond what the List page's existing tab structure already reserves.

## Testing Decisions

- Test `lib/report/`'s Report CRUD as `lib/report/*.test.ts` (pure validation, e.g. name/filter-shape rules) and `*.integration.test.ts` (real Prisma client: create/rename/delete persistence, and proving a saved Report's query re-runs against freshly-changed Item data rather than returning stale results).
- Test CSV export with a focused unit test on the serialization function itself (given a fixed result set, assert exact CSV output/headers), independent of the Route Handler that streams it.
- Test each Analytics aggregation function (counts/breakdowns, heatmap, contribution map, progress graph, radar chart) as unit tests against fixture Item sets with known expected outputs — these are pure computation over data already fetched, so they do not need a real database to verify correctness.
- Test the per-Member chart guardrail explicitly: a fixture with uneven raw Item counts across Members should still assert the returned chart data is a normalized metric, not proportional to raw count, to prove the guardrail is enforced in code, not just by convention.
- Test the List Dashboard and My Tasks Dashboard tabs as Server Component smoke tests, following the pattern established in the List & Item Core and Home/Profile/Updates/My Tasks specs, asserting the reserved-placeholder state from those specs has been replaced with real widget data.
- Test peer comparison's off-by-default state and its effect when enabled as a smoke test on the List Dashboard, asserting the default-rendered charts are unchanged when the setting is off and that enabling it is what's actually required to unlock the comparative view.
- No new browser/E2E coverage required in this spec.

## Out of Scope

- `Workload` — later-phase, List-scoped Analytics view; no schema or UI in this spec.
- AI Summary — later phase.
- Cross-List or Workspace-wide ad-hoc reporting, and a top-level Reports nav item — explicitly out of scope per ADR 0012; Reports stay List-scoped only in v1.
- Karma/gamification, leaderboards, productivity scores — rejected, effectively permanent.
- Report sharing with other List Members beyond the creator (if not confirmed as in-scope before implementation) — treat as an optional follow-on, not assumed shipped by this spec.
- `Portfolio` and `Goal` — rejected outright (ADR 0010, ADR 0011); no rollup reporting across Lists.
- Public Task Tracking / "Company Position" (issue #14) and GitHub Integration (issue #15) — still ungrilled, excluded.

## Further Notes

- This spec depends on the List & Item Core spec (Item/List data to aggregate) and the Home/Profile/Updates/My Tasks spec (the My Tasks Dashboard tab shell it fills in); it is the last of the four specs in build order.
- Two details need confirmation against `docs/QnA/reports-analytics-scope.md` before implementation: whether Report sharing beyond the creator was actually settled as in-scope or just discussed, and whether the "peer comparison" off-by-default setting is Workspace-scoped or List-scoped. Both are called out above as decisions this spec infers rather than states with full confidence.
- Home's header-stats question (raised in the Home/Profile/Updates/My Tasks spec, deferred to this session, never actually revisited by it) remains unresolved after this spec too — do not use this spec as an opportunity to retroactively decide it without a dedicated grilling pass.
