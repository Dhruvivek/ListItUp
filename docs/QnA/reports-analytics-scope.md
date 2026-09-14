# Grill Session: Reports/Analytics Scope

## Context

Resolving [wayfinder ticket #11](https://github.com/Dhruvivek/ListItUp/issues/11), "Revisit Reports/Analytics scope at the new scale" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its only blocker, [#2](https://github.com/Dhruvivek/ListItUp/issues/2) (core domain model), was already settled.

The old model (`docs/QnA/listitup-product-model.md` Q7-Q10, superseded) settled `Report` as a live view only (no saved/exported documents), `Analytics` as operational-health signals only (no productivity scores/streaks/gamification), and peer contribution comparison off by default. This session re-checks those calls against the "medium fish" scale and mines `brainstorm/Work.md`'s Dashboard/Progress/Workload material — My Tasks' Dashboard View widgets, a List's Overview "AI Summary," and the now-rejected Portfolio's Dashboard/Progress/Workload pages — deciding core v1 / later phase / rejected for each. It also resolves two dependencies flagged by closed tickets: [#7](https://github.com/Dhruvivek/ListItUp/issues/7) needed this session to define My Tasks' Dashboard content, and [#10](https://github.com/Dhruvivek/ListItUp/issues/10) needed this session to decide whether v1 Analytics requires logged-time metrics before Time Tracking gets built.

## Questions

### 1. Does "Analytics = operational health only" still hold at the bigger scale?

**Recommended answer**:

Keep the definition unchanged — operational health only (completion rate, blocked/overdue counts, aging items, workload), still no gamification. Whether an AI-generated narrative layer sits on top of these signals is a separate question, not a redefinition of what Analytics measures.

**User answer**:

Do not introduce AI right now, keep it simple.

**Settled outcome**:

`Analytics` keeps its old-model definition: operational-health signals only, no productivity scores/streaks/leaderboards, no AI involved in producing the numbers themselves.

### 2. Does "Report = live view only" still hold?

**Recommended answer**:

Keep as-is: `Report` stays a live view, no saved/exported documents.

**User answer**:

It's okay for a Report to be saved and exported now.

**Settled outcome**:

Reversed from the old model — see Q7-Q9 for what "save" and "export" mean concretely. This is recorded as [ADR 0012](../ADR/0012-reports-support-saving-and-export.md) since it's a direct reversal of a prior explicit decision.

### 3. Does "peer contribution comparison off by default" still hold?

**Recommended answer**:

Keep as-is: off by default, opt-in later via an explicit Workspace setting, never raw task count as the headline metric.

**User answer**:

Agreed.

**Settled outcome**:

Confirmed unchanged — but see Q14/Q15 for how this interacts with the now-v1 per-person charts (contribution map, radar chart), which show every List Member's row by default without counting as "peer comparison" in this sense.

### 4. Does AI-generated summarization (a List's Overview-tab "AI Summary," including brainstorm's "Risk Report") enter core v1 scope now?

**Recommended answer**:

Stays later phase — nothing about the bigger scope changes the calculus [#8](https://github.com/Dhruvivek/ListItUp/issues/8) already used (real AI-feature investment, not core-v1 necessary).

**User answer**:

Later phase.

**Settled outcome**:

Re-confirms `#8`'s existing call. `AI Summary` (Recent Activity digest + Risk Report + optional scheduled auto-summaries) is later phase, unchanged.

### 5. Does v1 Analytics need logged-time metrics, pulling Time Tracking forward from later phase?

**Recommended answer**:

No — v1 Analytics is built entirely from Item state/dates, which already exist. Time Tracking stays later phase.

**User answer**:

Introduce Analytics now; Time Tracking targets v2.

**Settled outcome**:

v1 Analytics ships without logged-time metrics. `Time Tracking` (`Actual Time`/`Time Tracker`, from `#10`) stays deferred, explicitly targeting v2 rather than an unspecified "later."

### 6. Where does Portfolio's rejected "Workload" concept re-home, if anywhere?

**Recommended answer**:

Re-home at the List level as a later-phase Analytics view (per-Member open-Item counts within that List). Reject a Workspace-wide cross-List version for now.

**User answer**:

Agreed.

**Settled outcome**:

`Workload` is a later-phase, List-scoped Analytics view. Added to `CONTEXT.md`. No Workspace-wide version.

### 7. "Saved" Report — does it mean a reusable filter definition, or a frozen snapshot?

**Recommended answer**:

A saved, named filter/setup that re-runs live later (same shape as the "Saved Filters" idea `#7` deferred to later phase, applied here to Reports).

**User answer**:

Save means save inside the system (as opposed to exporting a file out of it).

**Settled outcome**:

A Saved Report is a named, reusable filter/setup persisted inside the app. Opening it always re-runs against current data — nothing is frozen. This is distinct from Export (Q8), which produces a file that leaves the system.

### 8. What does "export" mean, and what phase?

**Recommended answer**:

CSV export, later phase.

**User answer**:

CSV export, core v1.

**Settled outcome**:

Exporting a Report's current results as a CSV file is core v1.

### 9. Is "Dashboard" (the widget-based View already shipped as core v1 on My Tasks and List) the same concept as "Report," or different?

**Recommended answer**:

Dashboard is a View type (like List/Board/Calendar) that renders widgets built from Report and Analytics data. Report/Analytics are what's measured; Dashboard is where you look at it.

**User answer**:

Agreed.

**Settled outcome**:

`Dashboard` is now formally defined in `CONTEXT.md` as the View that surfaces Report and Analytics data via widgets. Saving/exporting applies to an individual Report, not to a Dashboard's widget layout (Dashboard customization was already later phase per `#7` Q4).

### 10. Given Analytics stays simple/no-AI, do any of the brainstormed visualizations (heatmap, contribution map, progress graph, radar chart) make it into v1?

**Recommended answer**:

Plain counts/text only in v1; all four visualizations later phase.

**User answer**:

All four in v1.

**Settled outcome**:

All four visualizations ship in v1, each still tied to one specific accountability question (per the old model's rule) rather than being decorative. See Q17 for the mapping and placement.

### 11. Is the persisted "Saved Report" itself core v1, alongside CSV export?

**Recommended answer**:

Core v1 — export needs something to export from, so shipping save in the same slice avoids a half-built, export-only surface.

**User answer**:

Core v1.

**Settled outcome**:

Saved Report ships in the same v1 slice as CSV export.

### 12. In a shared Workspace, who can create/save a Report, and who can see one that's saved?

**Recommended answer**:

Any Member can save one (Reports are read-only aggregations over data the Member can already see — unlike List/Label creation, saving one doesn't restructure anything for anyone else). Private to its creator by default, unlike List/Label's Owner/Admin creation gate.

**User answer**:

Agreed.

**Settled outcome**:

No creation gate on Saved Reports. Any Member can save one; it's private to them by default (a personal bookmark), unlike the List/Label creation-rights pattern.

### 13. Bucket the concrete Dashboard widgets from `brainstorm/Work.md` (Total/Completed/Incomplete/Overdue counts, breakdown by Section or List, breakdown by state, Completion-Over-Time) for v1.

**Recommended answer**:

All of them, core v1 — none need anything beyond Item state/dates, which already exist.

**User answer**:

All of them, core v1.

**Settled outcome**:

All the brainstormed count/breakdown widgets are core v1 on both My Tasks' and a List's Dashboard, scoped to that surface's own Items.

### 14. Should a List Dashboard's contribution map/radar chart default to showing only the viewer's own data, or show every Member's row by default?

**Recommended answer**:

Same guardrail as Q3: default to the viewer's own row only; seeing other Members requires the same explicit peer-comparison opt-in.

**User answer**:

More permissive — charts are fine to show everyone by default, since it's a chart tied to a specific accountability question, not a head-to-head leaderboard/ranking.

**Settled outcome**:

Superseded by Q15's guardrail, which reconciles this with Q3's intent rather than overriding it outright.

### 15. Given Q14's permissive default, what keeps this from becoming the scoreboard dynamic Q3 exists to prevent?

**Recommended answer**:

Two guardrails: the metric plotted still follows Q3's rule (never raw task count — e.g. completed-and-owned Items, resolved-blocked Items, stale-owned Items instead), and visibility defaults to that List's Members only (not Workspace-wide).

**User answer**:

Yes to both.

**Settled outcome**:

A List Dashboard's contribution map and radar chart show every Member's row by default, scoped to that List's Members only, plotting only non-raw-count metrics. This is a chart-visibility default, not the "peer comparison" feature from Q3, which still requires explicit opt-in for anything resembling a ranked comparison.

### 16. Where does a user build an ad-hoc Report, and where do Saved Reports live — a new top-level "Reports" nav item, or scoped inside a List's Dashboard?

**Recommended answer**:

New top-level "Reports" nav item, Workspace-scoped, since a Report's existing definition already spans across Lists/the Workspace.

**User answer**:

Keep it List-scoped for now.

**Settled outcome**:

No new top-level nav item. Ad-hoc Report building, saving, and CSV export live inside a List's Dashboard tab, scoped to that List, for v1. My Tasks keeps only its fixed Dashboard widgets (Q13) — it does not get ad-hoc Report building/saving/export in v1. Cross-List/Workspace-wide ad-hoc reporting is a later-phase idea if real demand emerges.

### 17. Confirm the visualization-to-question mapping and where each appears.

**Recommended answer**:

Heatmap = "when did work get completed" (aggregate, both surfaces, not per-row). Contribution map = "how consistently is each person moving Items forward" (personal-only on My Tasks; per-Member on List, per Q15's guardrail). Progress graph = "is this getting closer to done" (both surfaces, own Items). Radar chart = "where is attention imbalanced across To Do/Blocked/Overdue/Complete" (personal-only on My Tasks; per-Member on List, per Q15's guardrail).

**User answer**:

Confirmed all four as recommended.

**Settled outcome**:

Mapping and placement as recommended. Heatmap and progress graph are aggregate (not per-person) on both My Tasks and List Dashboards. Contribution map and radar chart are personal-only on My Tasks (no "other Members" concept there) and per-Member on List Dashboards, following Q15's guardrails.

### 18. Should the Dashboard View be renamed (e.g. to "Matrix" or "Metrics")?

**Recommended answer**:

Keep `Dashboard` — it's the term end users already expect from this product category (Asana/Todoist/Trello/Linear all use it), it's self-explanatory, and it's already shipped as the settled View name in `#7` and `#8`'s closed sessions.

**User answer**:

Keep Dashboard.

**Settled outcome**:

No rename. `Dashboard` remains the View name.

## Date

2026-09-14

## Follow-Ups

- Glossary updates: `CONTEXT.md` — `Report` redefined (List-scoped in v1, now supports naming/saving and CSV export), new `Dashboard` entry added, new `Workload` entry added.
- ADRs created: [0012 — Reports support saving and export](../ADR/0012-reports-support-saving-and-export.md), reversing the old model's live-view-only rule.
- Specs affected: Unblocks a future Reports/Analytics spec under `docs/Specs-Planned/`. Follow-up comments posted on `#7` (Dashboard content dependency resolved), `#8` (AI Summary re-confirmed later phase; List Dashboard content resolved), and `#10` (Time Tracking confirmed deferred to v2).
