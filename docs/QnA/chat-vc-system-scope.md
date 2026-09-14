# Grill Session: Chat + VC System Scope

## Context

Resolving [wayfinder ticket #12](https://github.com/Dhruvivek/ListItUp/issues/12), "Design the v1 Chat + VC system scope" — the last open grilling ticket under the [v1+ feature roadmap map](https://github.com/Dhruvivek/ListItUp/issues/1). Its blocker, [#4](https://github.com/Dhruvivek/ListItUp/issues/4) ("Research: Chat + VC system technical approaches"), was already closed with a options comparison but no winner picked — that pick was left to this session.

Research (`docs/Research/vc-chat-tech-options.md`) found: self-hosted LiveKit is the strongest self-hosting fit for voice (Apache-2.0, turnkey server, no new infra for a single node), while mediasoup is a library rather than a server (bigger build) and Jitsi drags in a heavy multi-component stack (Prosody + Jicofo + JVB) even though it has real audio-only support. Every managed voice API (LiveKit Cloud, Daily, Twilio, Agora) is SaaS-only, in tension with `docs/ADR/0004`'s self-hosting requirement. For text, a self-built Postgres + WebSocket/SSE + Redis pub/sub layer fits the existing self-hosted stack and works under `next start`/Docker (a long-running process), which is how ListItUp is already deployed; every managed chat API (Stream Chat, PubNub, Ably) is likewise SaaS-only.

Relevant settled domain model going in: `Workspace -> List -> Section -> Item` with no separate Project entity ([#2](https://github.com/Dhruvivek/ListItUp/issues/2), [#8](https://github.com/Dhruvivek/ListItUp/issues/8)); Workspace roles `Owner`/`Admin`/`Member`/`Viewer`; List roles `Lead`/`Member`/`Viewer`; List-scoped external `Guest` (read-only, no Workspace identity); `Viewer` as a hard read-only ceiling everywhere ([#2](https://github.com/Dhruvivek/ListItUp/issues/2), `docs/ADR/0009`). `#8` had already reserved a "Messages" tab in a List's view list, with content entirely deferred to this ticket.

The session's outcome changed twice over the course of grilling: it started as "design v1's Chat + VC scope," narrowed to "VC moves to v2, chat ships in v1," then widened again to "the entire Chat + VC system — including chat — moves to v2." The product/domain design below is the settled v2 baseline regardless; only the chat delivery *technology* is left open for a future implementation ticket.

## Questions

### 1. Does Voice Channel (VC) ship in v1, given the real infrastructure cost self-hosted LiveKit carries (dedicated TURN server, host networking, TLS, reverse proxy — none of which ListItUp's current deploy story needs)?

**Recommended answer**:

Ship VC in v1 scoped to a single-node LiveKit deployment (no multi-node/Redis coordination yet) — it's the product's named differentiator and the research found no lighter self-hosting-compliant path. Text-only-for-v1 is the fallback if the deployment lift is unwanted right now.

**User answer**:

v1 only contains the chat system; voice will not be introduced in v1, it ships in v2.

**Settled outcome**:

Superseded by Q15 — VC's v1/v2 split stopped mattering once the whole Chat + VC system (including chat) moved to v2. VC's actual behavior (join/mute/moderation) is still undesigned; only its scope placement (v2, later than or alongside chat, ADR-0004-driven) is settled.

### 2. Confirm both surfaces are in scope: per-List channels AND a personal 1:1 DM system.

**Recommended answer**:

Yes to both — List-scoped chat for team/project communication, plus a separate personal DM system for 1:1s unrelated to any specific List, per the ticket's own framing of the original ask.

**User answer**:

Yes.

**Settled outcome**:

Confirmed — both a List-scoped Channel system and a personal Direct Message system are part of the design (see Q3, Q11), even though neither ships before v2 per Q15.

### 3. Within a List, is chat a single continuous thread, or multiple named channels (Discord-style)?

**Recommended answer**:

Single thread per List, matching the singular "Messages" tab `#8` already reserved — avoids building channel management (create/rename/delete/order) before it's proven wanted.

**User answer**:

Discord-style, multiple channels.

**Settled outcome**:

A List's Messages tab holds multiple named `Channel`s (e.g. `#general`, `#bugs`), not a single thread. This unlocked new questions about who manages the channel list itself (Q8) and whether a List starts with one automatically (Q9).

### 4. Update the wayfinder map's "Not yet specified" section to add Voice Channels themselves (not just video/screen-share) as an explicit later-phase item.

**Recommended answer**:

Add: "Voice Channels (VC) — real-time audio chat, likely self-hosted LiveKit per research #4 — deferred to v2. v1 ships chat (text) only. Video calling and screen share remain deferred further still, as already noted."

**User answer**:

(Not directly answered — overtaken by Q15, which required a broader map update than this question anticipated.)

**Settled outcome**:

Superseded by Q15. The map (`#1`) is updated to reflect that the *entire* Chat+VC system is v2, not just VC — see the Follow-Ups section for the actual wording applied.

### 5. Who can read and post in a List's chat (Channel)?

**Recommended answer**:

Mirror the List role ladder exactly: List Lead and List Member can post, List Viewer can read but not post — no new role just for chat.

**User answer**:

Everyone in the List.

**Settled outcome**:

Superseded by Q6/Q7 — "everyone in the List" turned out to mean everyone including Viewer and Guest, at full read/post/attach, not just Lead/Member. See Q7 for the explicit confirmation and its consequence for the settled `Viewer` invariant.

### 6. Can a Guest (external, read-only access to one specific List) see that List's chat at all?

**Recommended answer**:

Include Guests as read-only, same as Viewer — consistent with "Guest sees whatever read-only access to that List already means," no chat-specific carve-out.

**User answer**:

No — everyone, including Guests, can post text and send files in chat, not just read it.

**Settled outcome**:

Guests get full read/post/attach access to a List's Channels, same as every other role. This, combined with Q5's answer, meant the recommended read-only defaults for both Viewer and Guest were rejected in favor of a flat "anyone with List access can fully participate in chat" rule — confirmed explicitly in Q7.

### 7. Confirm: the Viewer/Guest read-only ceiling applies to Items, but chat is an explicit, deliberate carve-out where everyone with List access (Lead, Member, Viewer, Guest) can post and send files.

**Recommended answer**:

Yes, confirm as a deliberate exception — chat is conversation, not editing the List's work record, so the ceiling that protects Item data doesn't need to protect chat messages. `CONTEXT.md`'s `Viewer`/`Guest` entries get a note scoping the read-only ceiling to Items specifically.

**User answer**:

Agreed.

**Settled outcome**:

Confirmed as a deliberate, narrow exception, not an accidental loosening of `docs/ADR/0009`'s ceiling rule. Recorded as [ADR 0013](../ADR/0013-chat-channels-bypass-viewer-guest-read-only-ceiling.md) since it revises a previously stated blanket invariant and needs to be visible to future features that might assume the ceiling applies everywhere.

### 8. Who can create, rename, delete, or reorder Channels within a List (structural management, not posting)?

**Recommended answer**:

List Lead or Workspace Admin only — matches how other List-structural actions (Sections, List settings) are already gated.

**User answer**:

Agreed.

**Settled outcome**:

Channel management is gated to List Lead or Workspace Admin, independent of who can post (Q7 settled that as "everyone with List access").

### 9. Does every List get a default Channel automatically when the List is created?

**Recommended answer**:

Yes — every List gets one un-deletable default Channel (e.g. `#general`) on creation; more can be added.

**User answer**:

Agreed.

**Settled outcome**:

Every List ships with one un-deletable default Channel on creation. Additional Channels can be added by List Lead/Workspace Admin per Q8.

### 10. Can anyone besides the message's author delete it?

**Recommended answer**:

Sender can always delete their own message; List Lead or Workspace Admin can also delete any message in that List for moderation. No edit-by-others, only delete.

**User answer**:

Agreed.

**Settled outcome**:

Message deletion: sender, or List Lead/Workspace Admin. No other User (including a co-Member) can delete someone else's message. Messages cannot be edited by anyone but the author.

### 11. Does the personal DM system allow messaging any User on the platform, or only Users you share a Workspace with?

**Recommended answer**:

Only Users who share at least one Workspace with you — reuses existing membership/discovery; no new "find anyone" directory needed.

**User answer**:

Agreed.

**Settled outcome**:

Direct Messages are scoped to Users who share at least one Workspace. There is no cross-platform "message any User" capability and no new user-discovery/search surface.

### 12. Pick the actual chat delivery technology: self-built Postgres + Redis pub/sub is the only ADR-0004-compliant option, but should delivery use WebSocket or Server-Sent Events (SSE)?

**Recommended answer**:

SSE, not WebSocket — WebSocket needs a custom Node server in front of Next.js (which Next.js's own docs call a last resort and which loses "standalone output" build tracing), while SSE can run inside a normal Route Handler (client sends via a normal POST/Server Action, receives new messages via a one-way stream).

**User answer**:

Don't lock this in now — the technical pick should be asked again when this is actually implemented; the whole thing will be revisited once more at that point.

**Settled outcome**:

Deliberately left open. Neither the WebSocket-vs-SSE choice nor "self-built vs. any newly-available option at that time" is settled here — a future implementation ticket, closer to v2, re-asks this question fresh. No ADR is written for the technology today; only the product/permission design in this session is treated as settled (confirmed explicitly — see Q16).

### 13. Where does the personal DM surface live in navigation?

**Recommended answer**:

A new top-level nav item (e.g. "Messages"), separate from `Updates` (notifications) and `Profile` (identity-only, no work widgets).

**User answer**:

Agreed.

**Settled outcome**:

Direct Messages get a new top-level nav item, distinct from `Updates` and `Profile`.

### 14. Do chat file attachments reuse the existing Attachment infrastructure (S3/MinIO, same type/size limits per `docs/ADR/0002`), or get their own separate limits?

**Recommended answer**:

Reuse the same Attachment mechanism and limits (ZIP/images/PDFs/docs, 1GB/file) — no reason for chat to have a different ceiling than Item attachments.

**User answer**:

Agreed.

**Settled outcome**:

Channel and DM file attachments reuse the existing Attachment infrastructure and limits; no separate chat-specific storage or size rules.

### 15. Does the entire Chat + VC system — not just VC — move to v2, so v1 ships neither chat nor voice?

**Recommended answer**:

(No default recommendation given — this was a direct scope reversal proposed by the user, clarified via a direct question rather than an agent recommendation.)

**User answer**:

Yes — defer all of Chat + VC to v2. The design work done in this session still stands; it's just not built until v2.

**Settled outcome**:

v1 ships no Chat + VC surface at all. The full product/domain design in this session (Q2, Q3, Q5-Q11, Q13, Q14) is the settled v2 baseline, recorded now so v2 can build directly from it rather than re-grilling the whole thing from scratch.

### 16. How provisional is today's design — does only the technology pick (Q12) stay open for later, or does the whole design (channels, roles, moderation, DM scope) get re-opened before implementation too?

**Recommended answer**:

Only the technology pick stays open; product/domain decisions are settled now as the v2 baseline.

**User answer**:

Only the technical pick stays open.

**Settled outcome**:

Confirmed: the product/domain design in this session (Channel model, permission carve-out, moderation, DM scope, nav placement, attachment reuse) is settled and recorded in `CONTEXT.md`/`docs/ADR/0013`. Only the chat delivery technology (Q12) and VC's own undesigned behavior (join/mute/moderation, and its technical approach) are left for a future ticket closer to v2 implementation.

## Date

2026-09-14

## Follow-Ups

- Glossary updates: `CONTEXT.md` — new `Channel` and `Direct Message` entries added; `Viewer`, `List Viewer`, and `Guest` entries updated to note the Channel read/post exception to the read-only ceiling (see ADR 0013).
- ADRs created: [0013 — Chat Channels bypass the Viewer/Guest read-only ceiling](../ADR/0013-chat-channels-bypass-viewer-guest-read-only-ceiling.md). No ADR was written for chat delivery technology — that choice was deliberately left open (Q12).
- Specs affected: None yet — this is a v2 feature. A future implementation ticket must resolve Q12 (chat delivery technology) and design VC's own product behavior (creation/join/mute/moderation) before either can move to `to-prd`/`to-issues`.
- Map updated: [#1](https://github.com/Dhruvivek/ListItUp/issues/1)'s Destination, "Decisions so far," and "Not yet specified" sections all updated to reflect the entire Chat+VC system moving to v2.
