# Todoist Public Feature Set (Baseline Input)

Primary-source inventory of Todoist's publicly documented feature set, for GitHub issue [#3](https://github.com/Dhruvivek/ListItUp/issues/3) ("Research: Todoist's public feature set (baseline input)"), child of wayfinder map issue #1.

**Method:** every claim below is sourced from `todoist.com/help`, `todoist.com` (including the pricing page), or `developer.todoist.com`, fetched directly (not from search snippets or secondary write-ups). Each help article's "Available for" badge and/or the pricing page/FAQ comparison table were used to determine plan-tier gating. Where two official pages disagreed, both are reported rather than silently reconciled. No claim here should be read as a recommendation for ListItUp — this is a factual inventory only.

All pages were fetched on 2026-08-26; most help articles show a "Last updated" date of August 2026.

---

## Plan Tiers (context for every section below)

Per the official pricing page ([todoist.com/pricing](https://www.todoist.com/pricing)) and the plans FAQ ([Todoist plans, pricing, and billing FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6)), Todoist has three plans:

| Plan | Price | Notes |
|---|---|---|
| Beginner (Free) | Free | No trial needed |
| Pro | $7/month billed monthly, or $60/year ($5/month billed yearly) | 7-day free trial |
| Business | $10/user/month billed monthly, or $8/user/month billed yearly ($96/user/year), plus local tax | 14-day free trial; per-seat team plan |

Sources: [Pricing](https://www.todoist.com/pricing), [Plans, pricing, and billing FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6).

Core plan-wide limits (FAQ comparison table):

| Limit | Beginner | Pro | Business |
|---|---|---|---|
| Active personal projects | Up to 5 | Up to 300 | Up to 300 per member |
| Active team projects (incl. sub-projects) | Up to 5 | Up to 5 | Up to 500 |
| Custom filter views | Up to 3 | Up to 150 | Up to 150 per member |
| Team members (incl. guests) | Set by team's plan | Set by team's plan | Up to 1,000 |
| Activity/reporting history | 7 days | Full history | Full history |
| Daily automatic backups | No | Yes | Yes |
| File upload size | 5 MB | 25 MB | 100 MB |

Source: [Plans, pricing, and billing FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6) (Limits table).

**Discrepancy noted:** the pricing page's own comparison table (fetched directly from `todoist.com/pricing`, same day) lists the Pro file-upload limit as **100 MB**, not 25 MB — its table reads 5 MB (Beginner) / 100 MB (Pro) / 100 MB (Business). The FAQ page states 5 MB / 25 MB / 100 MB. Both are official Todoist pages current as of the fetch date; this write-up reports both rather than picking one. Source: [Pricing](https://www.todoist.com/pricing) vs. [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6).

The pricing page's comparison table also marks "SOC2 Certification" as Available on all three plans (Beginner, Pro, and Business alike), even though the Business marketing card separately calls out "SOC2 Type II certification" as a Business-plan highlight. Source: [Pricing](https://www.todoist.com/pricing).

---

## 1. Quick-Add Syntax and Natural-Language Date/Recurrence Parsing

Available for: Beginner, Pro, Business. Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).

Quick Add is opened via the "Add task" button or the `Q` keyboard shortcut, and recognizes the following typed syntax inside the task-name field (all platforms):

| Element | Symbol / method | Example |
|---|---|---|
| Date or due time | natural language | `tomorrow at 4 PM`, `every other Tuesday starting March 3` |
| Deadline | natural language in braces | `{march 30}` |
| Label | `%` immediately followed by label name | `%email` |
| Priority | `p1`, `p2`, or `p3` | — |
| Reminder | `!` immediately followed by a time | `!14:00` or `!30 min before` |
| Assignee | `+` immediately followed by a name (shared projects only) | `+Lucile` |
| Project | `#` immediately followed by project name | `#Work` |
| Section | `/` immediately following a project, after the project name | `#Work /Admin` |

Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).

Notes:
- `@` still works for labels "for now, but is planned to be retired by the end of 2026" — `%` is the current/future syntax. Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).
- Dates in Czech and Turkish are not currently supported by natural-language parsing. Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).
- Smart Quick Add can mis-recognize ordinary words as dates (e.g. "monthly" in "Create monthly report"); the recognized word can be clicked to revert it to plain text, or smart date recognition can be turned off entirely. Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).
- Quick Add can also turn pasted text, images, or documents into multiple tasks at once (this multi-task capture from text/images/documents is gated to Pro/Business — see the AI features table in the [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6): "Capture tasks from text, images, and documents" is unavailable on Beginner).
- A global (system-wide) Quick Add keyboard shortcut is available on the desktop apps only, for capturing tasks without switching out of another app. Source: [Use Task Quick Add in Todoist](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz).

---

## 2. Structure: Projects, Sections, Sub-tasks, Nesting Depth Limits

Available for (projects, sections, sub-tasks all): Beginner, Pro, Business. Sources: [Introduction to projects](https://www.todoist.com/help/articles/introduction-to-projects-TLTjNftLM), [Introduction to sections](https://www.todoist.com/help/articles/introduction-to-sections-rOrK0aEn), [Use sub-tasks in Todoist](https://www.todoist.com/help/articles/use-sub-tasks-in-todoist-kMamDo).

- **Sections:** up to 20 sections per project. Source: [Introduction to sections](https://www.todoist.com/help/articles/introduction-to-sections-rOrK0aEn).
- **Sub-tasks (nesting under a task):** Todoist supports four indent levels — e.g. a sub-task is indent level 1, and a "sub-sub-sub-sub-task" is indent level 4. Source: [Use sub-tasks in Todoist](https://www.todoist.com/help/articles/use-sub-tasks-in-todoist-kMamDo). Both a task and its sub-task must live in the same project; a task from a different project must be moved in first. Source: [Use sub-tasks in Todoist](https://www.todoist.com/help/articles/use-sub-tasks-in-todoist-kMamDo).
- **Sub-projects (nested projects):** Todoist "currently supports sub-projects on three indent levels," and this applies to personal projects only — team projects "all live at the same level" and use folders instead of nesting for grouping. Sources: [Create a sub-project in Todoist](https://www.todoist.com/help/articles/create-a-sub-project-in-todoist-aTA15C70), [Introduction to projects](https://www.todoist.com/help/articles/introduction-to-projects-TLTjNftLM).
- **Task/project limits:** up to 300 tasks per project when importing from CSV (larger CSVs fail to import). Source: [Import or export Todoist project templates](https://www.todoist.com/help/articles/import-or-export-todoist-project-templates-YC8YvN). Active-project caps by plan are covered in the pricing table above.

---

## 3. Labels and Filters

Available for (both): Beginner, Pro, Business. Sources: [Introduction to labels](https://www.todoist.com/help/articles/introduction-to-labels-dSo2eE), [Introduction to filters](https://www.todoist.com/help/articles/introduction-to-filters-V98wIH).

**Labels:** created via `%` followed by a label name in the task field (with `@` still working for now, again slated for retirement by end of 2026); labels can be personal (any color, created by you) or shared (added by collaborators in shared projects, shown in gray). Todoist states you "can add as many labels as needed." Source: [Introduction to labels](https://www.todoist.com/help/articles/introduction-to-labels-dSo2eE). Custom filter view counts are plan-gated (3 on Beginner, 150 on Pro, 150 per member on Business), per the pricing table above — labels themselves are not called out as plan-limited.

**Filters** are custom, saved views defined by a query language ("Filters are custom views of your tasks using specific query syntaxes"). Note: the built-in Today, Upcoming, and Priority views are not filters and cannot be edited with filter queries. Source: [Introduction to filters](https://www.todoist.com/help/articles/introduction-to-filters-V98wIH).

Filter query operators/symbols:

| Symbol | Meaning | Example |
|---|---|---|
| `\|` | OR | `today \| overdue` |
| `&` | AND | `today & p1` |
| `!` | NOT | `! subtask` |
| `()` | group/precedence — combine `&`/`\|` inside and between parens | `(today \| overdue) & #Work` |
| `,` | display results as separate sections in one view | `date: yesterday, today` |
| `\` | escape a special character, or match multi-word names | `#One \& Two`, `#Shopping \ list` |

Source: [Introduction to filters](https://www.todoist.com/help/articles/introduction-to-filters-V98wIH).

Selected supported filter queries (not exhaustive — the help page documents many more combinations):

- **Keywords:** `search: Meeting`, `search: Meeting & today`
- **Sub-tasks:** `subtask` (see all sub-tasks), `! subtask` (parents only)
- **Dates:** `date: Jan 3`, `date before: May 5`, `date after: May 5`, `no date`, `! no date`, `overdue` / `over due` / `od`, `recurring`, `! recurring`
- **Deadlines:** `no deadline`, `! no deadline`, `deadline: today`, `deadline before: today`
- **Due (date-or-deadline union):** `due before:`, `due after:` — "`due` prioritizes the date field if a task has both a date and a deadline"
- **Priority:** `p1`, `p2`, `p3`, `p4` (equivalent to `No priority` in filters — but note `No priority` does *not* work in Quick Add, where `p4` is required instead)
- **Labels:** `%email`, `no labels`
- **Projects/sub-projects/sections:** `#Work`, `##Work` (project + its sub-projects), `##School & !#Science`, `/Meetings` (section across all projects), `!/*` (tasks not in any section)
- **Workspaces/folders:** `workspace: My projects`, `##Design team` (folder)
- **Creation date:** `created: Jan 3 2023`, `created before: -365 days`
- **Assignment/sharing:** `assigned to: Steve Gray`, `assigned by: me`, `assigned`, `shared`, `added by: me`
- **Misc:** `view all`, `uncompletable`

Source: [Introduction to filters](https://www.todoist.com/help/articles/introduction-to-filters-V98wIH).

**Filter Assist** (Pro/Business — see AI features table in [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6)) lets a user describe a desired view in plain language and have Todoist generate the filter query. Note: the FAQ's Beginner/Pro/Business AI table only explicitly excludes "Todoist Assist" and "Email Assist" from Beginner; the pricing page's own comparison table lists "Filter Assist" as available on all three tiers (Beginner included). This is a second discrepancy between the two official pages — reported as-is. Sources: [Pricing](https://www.todoist.com/pricing), [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6).

---

## 4. Priority Levels

Available for: Beginner, Pro, Business. Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).

Four priority levels can be assigned to any task:

| Color | Level | Description (Todoist's own wording) |
|---|---|---|
| Red | 1 | "Most important, urgent, get it done ASAP" |
| Orange | 2 | "Important, schedule it" |
| Blue | 3 | "Less important, can work on it later" |
| White | 4 | "Least important, not urgent" |

Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).

- Priority 4 is the default for new tasks. Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).
- Set via: the task view's Priority field, the task's three-dot menu, or Quick Add keyboard shortcuts `p1`/`p2`/`p3` typed into the task name (there is no `p4` Quick Add shortcut mentioned for setting priority via typing — P4 is reached by leaving priority unset, or by selecting it explicitly in the UI). Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).
- Priority level names/colors are not customizable. Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).
- Projects/views can be sorted by priority. Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).
- In the Today/Upcoming views, higher-priority tasks are pushed toward the top of the list, below any tasks that have a specific time set. Source: [Set a priority in Todoist](https://www.todoist.com/help/articles/set-a-priority-in-todoist-Wy82Jp).

---

## 5. Recurring Due Dates

Available for: Beginner, Pro, Business. Source: [Introduction to recurring dates](https://www.todoist.com/help/articles/introduction-to-recurring-dates-YUYVJJAV).

Set either by typing natural language into Quick Add (e.g. `every Monday`), or via the task view's date scheduler → Repeat → Custom. Source: [Introduction to recurring dates](https://www.todoist.com/help/articles/introduction-to-recurring-dates-YUYVJJAV).

Selected syntax (see the source article for the complete table):

- **Basic:** `every day`/`daily`, `every weekday`/`every workday`, `every week`/`weekly`, `every month`/`monthly`, `every year`/`yearly`
- **Start/end dates:** `everyday starting on aug 3` (or `from aug 3`), `everyday ending aug 3` (or `until aug 3`), `everyday for 3 weeks`, `everyday from 10 May until 20 May`
- **Time:** `every hour`, `every 12 hours starting at 9pm`, `every mon, fri at 20:00`, `every last workday at 3pm` — a single recurrence can't carry different times per weekday (e.g. `every Monday, Friday at 8pm` applies 8pm to both days)
- **Comma lists:** `every mon, fri` (or `ev mon, fri`), `every 2, 15, 27` (2nd/15th/27th of the month), `every 1st wed jan, 3rd thu jul`
- **"Every other":** `every other day` / `week` / `month` / `year` / `fri`
- **Holidays:** `new year day`, `valentine`, `halloween`, `new year eve` (Thanksgiving was removed from the keyword list because celebration dates vary by country)
- **Combining patterns is unsupported:** e.g. `every Monday every 1 hour` is invalid — only one `every`/recurrence pattern per task.

Source: [Introduction to recurring dates](https://www.todoist.com/help/articles/introduction-to-recurring-dates-YUYVJJAV).

**`every` vs `every!`:**
- `every N months` (etc.) recurs from the task's *original scheduled date*, regardless of when it's actually completed — e.g. created Jan 10 with `every 3 months` recurs Jan 10, Apr 10, Jul 10, etc., no matter when each instance is completed.
- `every! N months` recurs relative to the *completion date* — e.g. completing on Jan 20 sets the next occurrence to Apr 20.
- For daily recurrence specifically, both forms behave the same (based on completion date).
- If a recurring task goes overdue past its next scheduled occurrence, Todoist skips ahead to the next *future* occurrence on completion, rather than resuming the missed one(s).

Source: [Introduction to recurring dates](https://www.todoist.com/help/articles/introduction-to-recurring-dates-YUYVJJAV).

Future occurrences of a recurring task are hidden by default; they can be surfaced by switching a project to the calendar layout (Pro/Business) and turning on "Future occurrences." Source: [Introduction to recurring dates](https://www.todoist.com/help/articles/introduction-to-recurring-dates-YUYVJJAV).

---

## 6. Karma, Streaks, and Productivity Trends (Gamification)

Available for: Beginner, Pro, Business. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Karma levels** (points accumulate, never reset except manually):

| Points | Level |
|---|---|
| 0–499 | Beginner |
| 500–2,499 | Novice |
| 2,500–4,999 | Intermediate |
| 5,000–7,499 | Professional |
| 7,500–9,999 | Expert |
| 10,000–19,999 | Master |
| 20,000–49,999 | Grand Master |
| 50,000+ | Enlightened |

Reaching "Enlightened" unlocks a hidden/mystery app theme. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Karma is earned by:** adding tasks; completing tasks on time; using "advanced features" (the article names labels, recurring dates, and reminders as examples); reaching self-set daily/weekly task-completion goals; and maintaining ongoing streaks of hitting those goals (bonus Karma for streaks). Karma points are added throughout the day, and higher levels require progressively more points to advance. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Karma is lost when** a task is 5+ days overdue. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Karma Trend:** a 7-day line graph shown below the current level, updating automatically, with symbols marking when tasks were added, tasks were completed, advanced features were used, and daily/weekly goals were reached. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Settings (Settings → Productivity):** set daily and/or weekly task-completion goals (set both to 0 to effectively disable goals — they'll always read as "complete"); toggle goal celebrations; choose specific days of the week to treat as days off; toggle Vacation mode. Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

**Vacation mode:** "lets you put your Todoist Karma on hold for as long as you need" — while on, there's no pressure to hit the daily goal and streaks won't break. Available for Beginner, Pro, and Business. Source: [Turn on or off vacation mode in Todoist](https://www.todoist.com/help/articles/turn-on-or-off-vacation-mode-in-todoist-pAQmRp).

**Distinct from core Karma:** Todoist also offers a separate opt-in **"Habit Tracker" extension/integration** (Beginner/Pro/Business, web/macOS/Windows/Linux) that tracks a per-task streak (shown in that task's comments) for tasks with a daily or specific recurring due date; the streak for that task resets if the task becomes overdue, is postponed, or is rescheduled. This is a different mechanism from the account-level Karma daily/weekly goal streak described above. Source: [Use the Habit Tracker extension with Todoist](https://www.todoist.com/help/articles/use-the-habit-tracker-extension-with-todoist-A0r7wtPfk).

Karma progress, level, and trend are viewed via the "Productivity view" (also referred to as "Reporting" elsewhere in Todoist's help docs — see Collaboration section below). Source: [Introduction to Karma](https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy).

---

## 7. Templates

Available for: Beginner, Pro, Business. Source: [Introduction to templates in Todoist](https://www.todoist.com/help/articles/introduction-to-templates-in-todoist-uofJ8i40M).

- A **template gallery** ("vast library of pre-made templates," described elsewhere as "60+ pre-made Todoist templates" across work/personal/creative categories — via web search summary of the templates library page, not independently re-verified against raw HTML in this pass) can be browsed and searched; opening a template and clicking "Import to project" (personal) or "Copy setup" (team workspace) creates a new project from it. Source: [Introduction to templates in Todoist](https://www.todoist.com/help/articles/introduction-to-templates-in-todoist-uofJ8i40M).
- **Custom templates:** an existing project can be saved as a template; templates can also be **uploaded** from a CSV file (desktop/web only) into the template gallery, where they become available on any device. Source: [Introduction to templates in Todoist](https://www.todoist.com/help/articles/introduction-to-templates-in-todoist-uofJ8i40M).
- **CSV import:** New/existing project → three-dot menu → "Manage data" → "Import from CSV." A project supports up to 300 tasks — a CSV with more than 300 task rows cannot be imported. Source: [Import or export Todoist project templates](https://www.todoist.com/help/articles/import-or-export-todoist-project-templates-YC8YvN).
- **Export as CSV** is also supported, including for re-uploading a project as a reusable template later. Source: [Import or export Todoist project templates](https://www.todoist.com/help/articles/import-or-export-todoist-project-templates-YC8YvN).
- **Shared templates** (templates a team can share internally, on top of the public gallery) are called out specifically as a **Business**-plan feature on the pricing page's comparison table ("Shared templates, too" appears only in the Business column). Source: [Pricing](https://www.todoist.com/pricing).

---

## 8. Board (Kanban) View vs. List View

Available for (both layouts): Beginner, Pro, Business. Source: [Use the board layout in Todoist](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI).

- **List layout:** tasks and sections are presented as a vertical list, first task at top.
- **Board layout:** each section becomes a column; tasks become cards within columns; tasks with no section land in a default "No Section" column. Sections/columns can be added and reordered; tasks can be dragged between columns; completed tasks can be viewed. Board-layout state syncs across web, iOS, and Android. Source: [Use the board layout in Todoist](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI).
- **Switching:** choose "Board" from the View menu when creating a project, or via the view icon (or `Shift+V` shortcut on web) for an existing project/Today/Upcoming/label/filter view. Source: [Use the board layout in Todoist](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI).
- A third layout, **Calendar**, also exists (week/month grid) but is Pro/Business only, per both the board-layout article's own shortcut note and the pricing comparison table. Sources: [Use the board layout in Todoist](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI), [Pricing](https://www.todoist.com/pricing).

---

## 9. Reminders

Available for (the reminders feature overall): Beginner, Pro, Business — but most reminder *types* beyond the automatic default are Pro/Business only (see table below). Source: [Introduction to reminders](https://www.todoist.com/help/articles/introduction-to-reminders-9PezfU).

Four reminder types are described:

| Type | Description | Tier |
|---|---|---|
| Automatic reminders | Added by default whenever a task gets a date+time, per the user's Reminders settings | Beginner, Pro, Business |
| Custom reminders | A specific date/time, or an offset before the task's due time | Pro, Business only |
| Recurring reminders | Notifies on a recurring basis (e.g. `ev Tuesday 7:00`) | Pro, Business only |
| Location reminders | Notifies on arrival at (or leaving) a specific place | Pro, Business only |

Sources: [Introduction to reminders](https://www.todoist.com/help/articles/introduction-to-reminders-9PezfU) (types/behavior), [Plans, pricing, and billing FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6) (tier gating — "Custom reminders," "Time-based reminders," "Location-based reminders," and "Recurring reminders" are each explicitly marked unavailable on Beginner).

- Automatic-reminder timing (e.g. "15 minutes before") and notification channel (desktop, mobile, email) are configured in Settings → Reminders. Source: [Introduction to reminders](https://www.todoist.com/help/articles/introduction-to-reminders-9PezfU).
- **Location reminders** are mobile-only (iOS/Android — not web/desktop) and require the device's location-services permission to be granted to Todoist. Source: [Use location reminders in Todoist](https://www.todoist.com/help/articles/use-location-reminders-in-todoist-uGcwH2AJ6).
- A related but distinct capability, **"Add an urgent reminder,"** exists on iOS specifically (found via search, not independently fetched in this pass — flagged as unverified in detail beyond its existence).

---

## 10. Collaboration

Available for: Beginner, Pro, Business. Source: [Collaborate with friends or family in Todoist](https://www.todoist.com/help/articles/collaborate-with-friends-or-family-in-todoist-tzkGUy).

- **Shared projects:** a project can be shared by inviting people by name/email, or via a shareable invite link; invitees who don't have a Todoist account can sign up for free from the invite email. Anyone invited to a shared project gets full access to its tasks, comments, and file attachments, and can add tasks, assign tasks, complete tasks, comment, and upload files — invitees "always have the Can Edit permission." Source: [Collaborate with friends or family in Todoist](https://www.todoist.com/help/articles/collaborate-with-friends-or-family-in-todoist-tzkGUy).
- **Collaborator limits:** 5 people per personal project on all three plans (Beginner, Pro, and Business all show "5" in the pricing page's own comparison table); Business separately supports up to 250 people per *team* project. Source: [Pricing](https://www.todoist.com/pricing).
- **Task comments:** available in the task view's Comments field on all plans; file uploads are allowed in comments too, subject to the plan's file-size limit. Sources: [Pricing](https://www.todoist.com/pricing), [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6).
- **Assigning tasks:** in a shared project, a task can be assigned to exactly one collaborator (Todoist does not support multi-person assignment of a single task) via the task view's Assignee control, or via Quick Add's `+name` syntax. Assignees are notified by email or push notification. Source: search-result summary of [Manage team tasks in Todoist](https://www.todoist.com/help/articles/manage-team-tasks-in-todoist-S99543QzY) — page fetched but this specific claim traces to the search summary rather than a directly quoted line, flagged for lower confidence.
- **Activity log / Reporting:** now labeled "Reporting" in the help center; shows a chronological log of activity, filterable by project, person (collaborator), event type, workspace, and date range (workspace/date-range filtering is web/desktop only, not yet on iOS). Available for Beginner, Pro, Business, though retention differs by plan (7 days on Beginner vs. full history on Pro/Business, per the pricing tables above). Source: [View Reporting in Todoist](https://www.todoist.com/help/articles/view-reporting-in-todoist-oOra6D).
- **Business-only team collaboration extras** (per the pricing page/FAQ): a shared team workspace, team project folders, restricted projects, team-wide custom filters, team roles (admin/member/guest), centralized/consolidated billing, and "Project Insights" (Pro/Business only, per the FAQ's Collaboration table — not available on Beginner). Sources: [Pricing](https://www.todoist.com/pricing), [Plans FAQ](https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6).

---

## Developer API (supporting context)

Not one of the ten required feature areas, but included since `developer.todoist.com` was named as an in-scope primary source.

- Current API: **v1**, base URL `https://api.todoist.com/api/v1/`, described by Todoist as "a unified, (mostly) RESTful API for tasks, projects, sections, comments, and more," with a published OpenAPI specification. It unifies what were previously separate Sync and REST APIs. Source: [Todoist Developers](https://developer.todoist.com/).
- Official SDKs: Python (PyPI) and TypeScript (npm), both offering "typed access to the full API." Source: [Todoist Developers](https://developer.todoist.com/).
- An official CLI (`td`) and a hosted MCP server (`https://ai.todoist.net/mcp`) are also offered for agent/AI-tool integration. Source: [Todoist Developers](https://developer.todoist.com/).
- Authentication: personal API tokens (from account Settings) or OAuth for multi-user apps. Source: [Todoist Developers](https://developer.todoist.com/).
- Resources explicitly named: tasks, projects, sections, comments, reminders, plus webhooks for real-time events and a sync endpoint for batch operations. Source: [Todoist Developers](https://developer.todoist.com/).

---

## Coverage Gaps / Unverified Items

- **Template gallery size** ("60+ templates") and the specific "urgent reminder" iOS feature are reported from search-result summaries rather than independently confirmed against the raw HTML of their source pages — flagged inline above.
- **Task assignment being single-assignee-only** is sourced from a search summary of the "Manage team tasks" article rather than a directly quoted sentence from that page.
- Two direct conflicts between official Todoist pages were found and reported rather than resolved: (1) Pro-tier file upload size (100 MB per the pricing page vs. 25 MB per the plans FAQ), and (2) whether "Filter Assist" is Beginner-inclusive (pricing page says yes) or Pro/Business-only (implied by the FAQ's AI-features framing, though Filter Assist itself isn't listed as a row in that specific FAQ table).
- Karma point values for each "advanced feature" used were only generally described ("labels, recurring dates, and reminders" as examples), not given as an exhaustive or per-action point value — Todoist's help docs do not appear to publish exact per-action Karma point amounts.
