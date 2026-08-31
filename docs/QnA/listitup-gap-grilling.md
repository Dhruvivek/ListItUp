# Grill Session: ListItUp Gap Review

> **Superseded 2026-08-26**: the small-Workspace-only scope this session assumed (2-8 person Workspaces, no multi-team org) is discarded under a bigger "medium fish" product scope. See [Wayfinder Map: ListItUp v1+ feature roadmap](https://github.com/Dhruvivek/ListItUp/issues/1) and `docs/QnA/listitup-scope-redefinition.md`. Kept here for historical reasoning only — do not treat its settled outcomes as current. (The Attachment-storage ADR this session produced, `docs/ADR/0002-s3-compatible-attachment-storage.md`, is unaffected and still stands.)

## Context

Second grilling pass to find gaps in the collaborative accountability model before turning it into a PRD.

## Questions

### 1. What is the smallest group project scenario the MVP must support?

**Recommended answer**:

Support a small team of 2-8 Users working in one Workspace on one shared List. One Admin creates the Workspace, Members join, Items are assigned to one Owner each, and everyone can see the Report. Avoid multi-team departments, cross-workspace reporting, and complex organization structures in the first slice.

**User answer**:

Recommendation is good, and that is the only model. No multi-team organization model.

**Settled outcome**:

ListItUp supports small shared Workspaces, not multi-team organization structures. Multi-team departments and cross-workspace organization reporting are out of scope.

### 2. How should a User join a Workspace in the MVP?

**Recommended answer**:

Use invite links controlled by Admins. An Admin creates a Workspace invite, shares the link, and the joining User becomes a Member by default. Avoid email invitation flows, domain restrictions, approval queues, and role selection during join for the first slice. Admins can change a User to Viewer after they join.

**User answer**:

Use SMTP-backed email invitations with providers such as Google SMTP, Mailgun, or another transactional email provider.

**Settled outcome**:

Workspace joining should use email invitations from day one. Provider choice should be kept behind an email-sending adapter so the app can start with one provider and switch later if needed.

### 3. Should Workspace invitations be open links anyone can use, or tied to a specific email address?

**Recommended answer**:

Tie each invitation to a specific email address. An Admin invites `person@example.com`; only that email can accept and join. This prevents invite links from being forwarded into a group project Workspace. Later controls can include bulk invite, resend invite, and revoke invite.

**User answer**:

Recommendation is good. The small shared Workspace model remains the only model; no multi-team organization structure.

**Settled outcome**:

Workspace invitations are tied to a specific email address. Open reusable join links are out of scope.

### 4. When someone is invited to a Workspace, what role should they get by default?

**Recommended answer**:

Invited Users join as `Member` by default. Admins can downgrade them to `Viewer` or promote another User to `Admin` after they join. Avoid choosing a role during invitation for the first slice; it adds invite-management complexity before it is proven necessary.

**User answer**:

Recommendation is good.

**Settled outcome**:

Workspace invitees join as `Member` by default. Role changes happen after joining.

### 5. Can an Item Owner be someone who is not a Member of the Workspace?

**Recommended answer**:

No. An Item Owner must be an `Admin` or `Member` of the same Workspace. `Viewer` cannot own Items because they cannot change work, and external people cannot own Items because reports and accountability would point to someone who cannot act inside the Workspace. If external dependency tracking is needed later, use `Blocked` plus a short reason.

**User answer**:

Recommendation is good.

**Settled outcome**:

Only `Admin` and `Member` Users in the same Workspace can own Items. `Viewer` and external people cannot own Items.

### 6. When an Item is `Blocked`, should the app require a reason?

**Recommended answer**:

Yes. `Blocked` should require a short blocker reason. Without that, reports will say work is blocked but not explain what needs to happen. Keep it lightweight: one plain-text reason, editable by Admins, Members, and the Item Owner. Avoid separate dependency objects or blocker workflows in the MVP.

**User answer**:

Recommendation is good.

**Settled outcome**:

Blocked Items require a short Blocker. The MVP does not include separate dependency objects or blocker workflows.

### 7. Should Items have priority in the MVP?

**Recommended answer**:

Yes, but keep it coarse: `Low`, `Normal`, `High`. Default to `Normal`. Avoid urgent/critical labels for now because they become noisy unless escalation rules are defined. Priority should help Owners decide what to handle first; it should not affect accountability metrics by itself.

**User answer**:

Recommendation is good.

**Settled outcome**:

Items have Priority with `Low`, `Normal`, and `High` values. Priority defaults to `Normal` and does not directly affect accountability metrics.

### 8. Should Items support comments in the MVP?

**Recommended answer**:

Yes, but only lightweight `Notes` on an Item, not threaded comments. Group projects need a place to capture context, decisions, and quick updates without jumping to another tool. Keep it simple: a chronological note stream, author, timestamp, and text. Avoid replies, reactions, mentions, attachments, and rich formatting in the first slice.

**User answer**:

Recommendation is good, but comments are not expected to be used extensively for the time being.

**Settled outcome**:

Items may support lightweight Notes for context, but Notes are not a core accountability requirement. Threaded comments and social discussion features are out of scope.

### 9. Should Items support attachments in the MVP?

**Recommended answer**:

No. Attachments add storage, security, preview, virus scanning, size limits, and retention questions. For the first slice, let an Item include a plain URL in its text or Note if users need to reference external docs. Add real attachments later only if group projects clearly need files inside ListItUp.

**User answer**:

Yes. A MinIO S3-compatible instance is already running, so the app should use it properly.

**Settled outcome**:

Attachments are in scope. Items can have file Attachments backed by an S3-compatible storage service such as MinIO. Storage rules, file limits, and access controls still need to be defined.

### 10. For Attachments, what files should be allowed in the MVP?

**Recommended answer**:

Allow common project-support files only: images, PDFs, plain text/markdown, and common office documents. Set a conservative per-file size limit, for example 25 MB. Do not allow executable files, archives, or arbitrary binary uploads in the MVP. Store files privately and serve them only to Users who can view the Workspace Item.

**User answer**:

Allow ZIP files, images, PDFs, docs, and similar project-support files.

**Settled outcome**:

Attachments should support ZIP files, images, PDFs, and common document formats. Broad arbitrary uploads remain out of scope until specific file types are deliberately added.

### 11. Since ZIP files are allowed, what safety limits should apply?

**Recommended answer**:

Allow ZIP uploads but do not preview or unpack them in the app. Treat ZIP as download-only. Set a per-file limit, for example 50 MB, and block executables as direct uploads. If virus scanning is not available in the first slice, make that explicit in the spec and keep Attachments private to Workspace members who can view the Item.

**User answer**:

Use a 1 GB per-file limit.

**Settled outcome**:

Attachments can be up to 1 GB per file. Large-file upload support implies direct-to-object-storage uploads, progress feedback, private storage, and download-only ZIP handling unless a later spec adds preview or scanning.

### 12. Should we create an ADR that ListItUp uses S3-compatible object storage, initially MinIO, for Attachments?

**Recommended answer**:

Yes. This meets the ADR bar: it is hard to reverse once files exist, a future engineer will need to know why object storage is part of the app, and there is a real trade-off versus database blobs, local disk, or third-party file services. The ADR should say Attachments are private object-storage files, initially backed by the existing MinIO/S3-compatible instance, with app-mediated access control.

**User answer**:

Recommendation is good.

**Settled outcome**:

ListItUp will use S3-compatible object storage, initially MinIO, for private Item Attachments.

## Date

2026-07-08

## Follow-Ups

- Glossary updates: `Blocker`, `Priority`, `Note`, `Attachment`
- ADRs created: `docs/ADR/0002-s3-compatible-attachment-storage.md`
- Specs affected: Future PRD for `Collaborative Workspace Accountability Loop`
