# Grill Session: Inbox/Notifications Feature Surface

## Context

Resolving [wayfinder ticket #6](https://github.com/Dhruvivek/ListItUp/issues/6), "Decide the Inbox/notifications feature surface" — a child of the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its only blocker, [#2](https://github.com/Dhruvivek/ListItUp/issues/2) (core domain model), was already settled. Mines the Inbox section of `brainstorm/Work.md` (Activity/Bookmarks/Archive/@Mentioned tabs, custom tabs, filtering/sorting/density, bookmark-and-archive semantics) for ListItUp's v1 feature surface, deciding core v1 / later phase / rejected for each brainstormed feature, and resolving a naming collision the ticket flagged up front: `CONTEXT.md` already uses `Inbox List` for the default capture List in a personal Workspace.

## Questions

### 1. Does an Inbox/notification surface belong in v1 at all?

**Recommended answer**:

A trimmed v1 — a single chronological Activity feed covering events the domain model can already produce (Assignee added/removed on an Item you're on, a Note added to an Item you're Assignee of, an Item's state changing). No tabs, bookmarks, mentions, or custom tabs, since those lean on capabilities (mentions, threaded replies) that don't exist anywhere else in the product.

**User answer**:

Trimmed v1 (option b).

**Settled outcome**:

Superseded by Q8 — the full tabbed surface ships in v1 instead of the trimmed feed.

### 2. Naming collision: "Inbox" vs. "Inbox List"

**Recommended answer**:

Rename the notification surface — e.g. `Activity` — and leave `Inbox List` untouched, since `Inbox List` is already an established, glossaried term.

**User answer**:

Go with `Activity`.

**Settled outcome**:

Superseded by Q9 — the page itself is named `Updates` once it grew tabs (one of which is `Activity`), to avoid the page and one of its own tabs sharing a name.

### 3. "Archive" collision inside the notification surface

**Recommended answer**:

Reuse "Archive" — the brainstormed semantics (remove from active view, keep for later reference) match the existing glossary definition for List/Item archiving, just applied to a notification instead.

**User answer**:

Reuse it, because archive should also show all archived Lists and Items.

**Settled outcome**:

The word is reused, but scoped to archived *notifications* only (see Q7) — the User's reasoning about archived Lists/Items surfaced a real, separate gap that was routed to #8 instead of folded into this tab.

### 4. Does `@Mentioned` require inventing @mentions elsewhere first?

**Recommended answer**:

Bucket `@Mentioned` as later phase, consistent with the prior (superseded) reasoning that excluded mentions from `Note`'s v1 scope — don't touch `Note` in this ticket.

**User answer**:

Go with later phase for now, but the mentioned feature will be implemented in v1.

**Settled outcome**:

Superseded by Q6/Q8 — @mention support on `Note`, and the `@Mentioned` tab itself, both ship in v1.

### 5. Clarifying Q3 (Archive)

**Recommended answer**:

Confirm whether "reuse Archive" meant a unified view of archived Lists/Items/notifications together, or just reusing the word for notifications specifically.

**User answer**:

Wants a place to restore an archived List if someone archives it — i.e. a unified archived view.

**Settled outcome**:

See Q7 — restoring archived Lists/Items is a real gap, but belongs to a different ticket, not this tab.

### 6. Clarifying Q4 (@Mentioned)

**Recommended answer**:

Confirm whether "mentioned feature in v1" meant adding @mention support to `Note` as a v1 capability while the dedicated tab stays later phase (since Q1's trimmed surface had no tabs at all).

**User answer**:

Build the whole tab UI in v1 — it's a basic necessity.

**Settled outcome**:

See Q8 — this reopened Q1's trimmed-v1 decision in favor of the full tabbed surface.

### 7. Where does "restore an archived List/Item" actually belong?

**Recommended answer**:

Keep #6 scoped to notifications only. Flag "browse/restore archived Lists & Items" as a gap for [#8](https://github.com/Dhruvivek/ListItUp/issues/8) ("Decide the Project feature surface & views") — the open ticket that already owns List-level surface decisions — since archived Lists/Items are first-class objects, not notifications.

**User answer**:

Agreed (option b).

**Settled outcome**:

Restoring archived Lists/Items is out of scope for #6. Flagged as an explicit open item on #8 via issue comment.

### 8. Reconciling Q6 with Q1

**Recommended answer**:

Get an explicit answer on whether Q1's trimmed v1 (single Activity feed) still holds, or whether it's now the full tabbed surface (Activity, Bookmarks, Archive, @Mentioned tabs, plus @mention support on `Note`) — a materially bigger v1 slice.

**User answer**:

Full tabbed surface ships in v1 (option a).

**Settled outcome**:

v1 ships the full tab set: `Activity`, `Bookmarks`, `Archive`, `@Mentioned`, plus @mention support on `Note`. This replaces Q1's original trimmed-feed answer.

### 9. Page-level name, now that it has tabs

**Recommended answer**:

Name the page `Updates` — concrete, on-brand (per `Brand.md`'s preference for direct labels over system jargon), and keeps `Activity` free as a tab name without renaming anything downstream.

**User answer**:

Agreed — `Updates`.

**Settled outcome**:

The page is named `Updates`. Its default tab keeps the name `Activity`.

### 10. Custom tabs (Add Tab, rename, set-as-default, duplicate, remove)

**Recommended answer**:

Later phase — the four built-in tabs cover the real v1 need; full custom-tab management is meaningfully more surface area.

**User answer**:

Keep the default 4 tabs only.

**Settled outcome**:

v1 ships only the four built-in tabs (`Activity`/`Bookmarks`/`Archive`/`@Mentioned`). Custom-tab management (Add Tab, rename, set-as-default, duplicate, remove) is later phase.

### 11. Filtering, sorting, density views

**Recommended answer**:

Core v1, trimmed — basic filter and Newest-only sort; skip Relevance sort and multiple density modes (Detailed/Compact) for v1.

**User answer**:

Core v1, trimmed now — full set (Relevance sort, density modes) in v2.

**Settled outcome**:

v1 ships basic filter + Newest sort, single default density. Relevance sort and Detailed/Compact density modes are v2.

### 12. "Manage Notifications" preferences page

**Recommended answer**:

Later phase — v1 can ship with a fixed, sensible notification set; a full preferences UI is separate, non-blocking work.

**User answer**:

Core v1.

**Settled outcome**:

`Manage Notifications` ships in v1.

### 13. Mark-as-read / unread state, and an unread nav badge

**Recommended answer**:

Core v1 — a notification surface that can't distinguish seen from unseen isn't really usable; this is cheap and basic necessity in the same sense as the tabs.

**User answer**:

Core v1.

**Settled outcome**:

Per-notification read/unread state and an unread badge on the `Updates` nav item ship in v1.

### 14. Who can be @mentioned on a `Note`

**Recommended answer**:

Only Users who already have access to that List/Item (Assignees, List Members/Leads/Viewers, Guests scoped to it) — mentioning shouldn't function as a backdoor grant of visibility.

**User answer**:

Agreed — only Users who already have access.

**Settled outcome**:

A Mention can only target a User who already has access to the Note's Item (see `CONTEXT.md`'s new `Mention` entry).

### 15. Where does `Updates` live in navigation?

**Recommended answer**:

Top-level nav item, same tier as `Home` and `My Tasks` — matches `brainstorm/Work.md`'s existing sidebar, and pairs with the unread badge from Q13.

**User answer**:

Yes, keep it top-level.

**Settled outcome**:

`Updates` is a top-level nav item, alongside `Home` and `My Tasks`.

### 16. Does `Updates` get a preview widget on `Home`?

**Recommended answer**:

Leave `Home` alone — its v1 widget list is already settled and closed via #5; the nav badge from Q13 already covers the "something needs my attention" signal without duplicating it.

**User answer**:

Leave Home alone.

**Settled outcome**:

No `Updates` preview widget on `Home`. `Home`'s widget list from #5 is unchanged.

## Date

2026-08-28

## Follow-Ups

- Glossary updates: `CONTEXT.md` — added `Updates` (page-level term) and `Mention` (new capability on `Note`).
- ADRs created: None — this session bucketed feature scope (core v1 / later / rejected); it didn't make a hard-to-reverse architectural call.
- Specs affected: Unblocks a future `Updates` spec under `docs/Specs-Planned/` (to be written via `to-prd`/`to-issues`). Restoring archived Lists/Items is flagged as an open item on [#8](https://github.com/Dhruvivek/ListItUp/issues/8), not resolved here.
