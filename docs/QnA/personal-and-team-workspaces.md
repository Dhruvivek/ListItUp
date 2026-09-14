# Grill Session: Personal and Team Workspaces

> **Superseded 2026-08-26**: this session's personal/shared Workspace model may be revisited under a bigger "medium fish" product scope — see [Wayfinder Map: ListItUp v1+ feature roadmap](https://github.com/Dhruvivek/ListItUp/issues/1) (ticket: "Redefine ListItUp's core domain model & entity hierarchy") and `docs/QnA/listitup-scope-redefinition.md`. Kept here for historical reasoning only — treat its settled outcomes as provisional pending that ticket, not current.

## Context

Clarifying how ListItUp supports both private personal task management and collaborative project work without splitting the product into separate modes.

## Questions

### 1. Can a User have both personal and team Workspaces?

**Recommended answer**:

Yes. Create a private, single-member personal Workspace for a User after verified first sign-in. The User may also create or join shared Workspaces. Workspace boundaries keep personal Lists invisible to teammates.

**User answer**:

Yes.

**Settled outcome**:

A User may belong to multiple Workspaces, including an automatically provisioned personal Workspace after verified first sign-in and shared team Workspaces.

### 2. Should personal and shared Workspaces use the same List and Item capabilities?

**Recommended answer**:

Yes. Both use Lists, Items, states, priorities, due dates, Reports, Notes, and Attachments. In a personal Workspace, its sole User is the only possible Item Owner. Shared Workspaces add membership, invitations, roles, and Owner reassignment.

**User answer**:

Yes.

**Settled outcome**:

Personal use has the same core List and Item capabilities as team use. Collaboration controls are layered onto shared Workspaces rather than implemented as a separate product mode.

### 3. Where should a User keep private planning while participating in a team Workspace?

**Recommended answer**:

Keep it in the User's personal Workspace. Lists inside a shared Workspace remain visible to everyone in that Workspace; do not introduce private Lists there.

**User answer**:

Yes. This makes total sense.

**Settled outcome**:

Private planning belongs in the personal Workspace. Lists in a shared Workspace remain shared, avoiding per-List visibility rules.

### 4. Which product slice should be built first?

**Recommended answer**:

Build the personal Workspace first, then layer collaborative Workspaces over the same core List and Item model.

**User answer**:

Build the personal Workspace first, then collaboration.

**Settled outcome**:

The personal Workspace is the first implementation slice. Shared Workspace collaboration is built afterward as an extension of the personal core.

### 5. How should a User plan shared work in their personal Workspace?

**Recommended answer**:

Create a private linked Item with its own state, referencing a specific shared Item the User can access.

**User answer**:

That would create duplicate completion steps: a User could complete the personal Item and forget to complete the shared Item. Instead, a shared Item should appear in the User's personal planning context without becoming a separate Item.

**Settled outcome**:

A shared Item can appear in the current User's personal planning context as the same canonical Item. It has no independent state, so completing it from personal planning completes it in the shared Workspace.

### 6. Which shared Items should appear in personal planning?

**Recommended answer**:

Use a `My Tasks` view for Items assigned to the current User. This makes personal planning actionable while avoiding a second task copy or a mixed list of every team Item.

**User answer**:

Assigned to me or My Tasks sounds good.

**Settled outcome**:

`My Tasks` is the personal planning view for Items owned by the current User, including Items from shared Workspaces.

### 7. How do owned shared Items enter My Tasks?

**Recommended answer**:

Show them automatically when they are assigned to the current User. This removes a manual “bring to personal Workspace” action while preserving the shared Item as the single source of truth.

**User answer**:

Automatically.

**Settled outcome**:

An Item assigned to the current User in a shared Workspace appears automatically in My Tasks. No manual copy, import, or second completion step is required.

### 8. How should My Tasks present personal and shared work?

**Recommended answer**:

Use one unified list, with each Item showing its source Workspace and with filters available when needed. This supports personal prioritization across all work without losing project context.

**User answer**:

One unified list looks good.

**Settled outcome**:

My Tasks is a unified list across personal and shared Workspaces. Each Item retains a visible source-Workspace label and can be filtered by source when needed.

### 9. What happens when a shared Item is reassigned away from the current User?

**Recommended answer**:

Remove it automatically from the current User's active My Tasks list. The Item remains in its shared Workspace; a future history view can show past involvement separately.

**User answer**:

Yes.

**Settled outcome**:

My Tasks reflects current responsibility. A shared Item disappears from a User's active My Tasks when it is reassigned to someone else.

### 10. Which Items are visible in My Tasks by default?

**Recommended answer**:

Show Open and Blocked Items by default. Make Complete and Archived Items available through filters or history rather than keeping them in the everyday queue.

**User answer**:

Yes.

**Settled outcome**:

My Tasks shows active Open and Blocked Items by default. Complete and Archived Items are available through filtering or history.

### 11. What is the default order in My Tasks?

**Recommended answer**:

Order overdue Items first, then High-priority Items, then Items with the nearest due date, then undated Items.

**User answer**:

Recommendation is good.

**Settled outcome**:

My Tasks defaults to overdue first, then High priority, then nearest due date, then undated Items.

### 12. Can a User keep private planning context for an assigned shared Item?

**Recommended answer**:

Yes. Allow one simple private planning note per User per shared Item in the first version. It is separate from the team-visible Note stream and does not create a second Item state.

**User answer**:

Recommendation is good.

**Settled outcome**:

A User may attach one Personal Note to a shared Item they own. The Personal Note is visible only to that User and is separate from team-visible Notes.

### 13. Should private planning include personal checklists or sub-Items in the first version?

**Recommended answer**:

No. Defer them. A Personal Note provides adequate private planning without introducing nested completion states, ownership rules, and reporting ambiguity.

**User answer**:

Recommendation is good.

**Settled outcome**:

Private checklists and sub-Items are out of scope for the first version. Personal Notes are the private planning mechanism.

### 14. Where do quickly captured personal Items go?

**Recommended answer**:

Place them in a default personal Inbox List. This allows capture without requiring the User to choose or create a List first; the User can organize the Item later.

**User answer**:

Recommendation is good.

**Settled outcome**:

Each personal Workspace has a default Inbox List. Quick capture from My Tasks places a new personal Item in that Inbox List.

### 15. Which personal Lists should contribute Items to My Tasks?

**Recommended answer**:

Include active Items from all personal Lists, alongside active Items assigned to the User in shared Workspaces.

**User answer**:

Discuss this later when implementing task and Workspace flows.

**Settled outcome**:

Deferred. The precise relationship between personal Lists and My Tasks will be decided during task and Workspace design.

## Date

2026-07-11

## Follow-Ups

- Glossary updates: `User`, `Workspace`, `Item`, `My Tasks`, `Personal Note`, `Inbox List`
- ADRs created: None
- Specs affected: Future PRDs for `Personal Workspace Accountability Loop` and `Collaborative Workspace Accountability Loop`
