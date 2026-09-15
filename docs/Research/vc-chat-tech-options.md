# Chat + VC System: Technical Options

This document resolves [issue #4, "Research: Chat + VC system technical approaches"](https://github.com/Dhruvivek/ListItUp/issues/4) (a child of the wayfinder map, issue #1). It is **options-comparison research only** — it does not pick a winner. A separate grilling/decision ticket will make the product call, informed by the findings here.

Scope: a Discord-style voice-channel (VC) system, audio-only, and a Google-Meet-style text chat, both scoped per-project and personal 1:1. **Video calls and screen share are explicitly out of scope** for this research and are not evaluated below; they are noted only as deferred where relevant.

Context this research weighs every option against:
- ListItUp already self-hosts Postgres, MinIO (S3-compatible object storage — [ADR-0002](../ADR/0002-s3-compatible-attachment-storage.md)), and Redis (currently backing auth rate limits — [ADR-0005](../ADR/0005-redis-for-authentication-rate-limits.md)).
- ListItUp is MIT-licensed and must remain self-hostable by third parties via `docker-compose.yml` or a Dokploy-managed Dockerfile — no feature may be reserved as paid-only or dependent on a proprietary service the self-hoster cannot run themselves ([ADR-0004](../ADR/0004-open-source-licensing-and-self-hosting.md)).
- The whole app is one deployable Next.js (App Router, Turbopack, React 19) process — there is no separate backend service (`Architecture.md`).

---

## Voice/VC Section

### LiveKit (self-hosted)

**What it is**: An open-source, distributed WebRTC SFU (Selective Forwarding Unit) written in Go, for real-time audio/video/data. Source: [github.com/livekit/livekit](https://github.com/livekit/livekit).

**Self-host vs managed**: Self-hostable via three official paths — binary install, official Docker images, or official Helm charts for Kubernetes. Source: [github.com/livekit/livekit](https://github.com/livekit/livekit).

**License**: Apache License 2.0, confirmed by reading the actual LICENSE file. Source: [github.com/livekit/livekit/blob/master/LICENSE](https://github.com/livekit/livekit/blob/master/LICENSE).

**Resource requirements**: LiveKit's own docs avoid fixed CPU/RAM numbers, instead stating scalability "is bound by CPU and bandwidth," recommending "10Gbps ethernet or faster" for production nodes and compute-optimized instance types; Docker deployments need host networking for correct WebRTC behavior; a domain, TLS cert, and reverse proxy for signaling are required, with a built-in TURN server for NAT traversal. Source: [docs.livekit.io/home/self-hosting/deployment](https://docs.livekit.io/home/self-hosting/deployment/).

**Redis dependency**: Multi-node distributed deployments require Redis "as shared data store and message bus" (a single room must still fit on one node); single-node deployments don't need Redis at all. Source: [docs.livekit.io/home/self-hosting/distributed](https://docs.livekit.io/home/self-hosting/distributed/). Since ListItUp already self-hosts Redis, a multi-node LiveKit deployment would not add a new infra dependency.

**Audio-only as a natural mode**: Not a first-class, named concept in the docs — a participant simply doesn't publish a video track. Audio-only appears only incidentally in AI-voice-agent examples, not as documented "audio-only room" guidance. Source: [docs.livekit.io/home/client/tracks](https://docs.livekit.io/home/client/tracks/).

**Self-hosting fit (ADR-0004)**: No tension — Apache-2.0, fully installable by a third party with no mandatory hosted dependency for single-node use.

**Next.js/Node integration**: Official `livekit/node-sdks` monorepo provides a server SDK (`livekit-server-sdk`, Apache-2.0 per npm registry) for room management and token minting, a Node "realtime" SDK (`livekit-rtc`) for server-side participants, and a browser client SDK (`livekit-client`). An official Next.js webhook example lives at `/examples/webhooks-nextjs` in that monorepo, alongside a general JavaScript quickstart. Source: [github.com/livekit/node-sdks](https://github.com/livekit/node-sdks), [docs.livekit.io/home/quickstarts/javascript](https://docs.livekit.io/home/quickstarts/javascript/).

### mediasoup

**What it is**: Per its own docs, "a powerful WebRTC SFU server built on Node and C++." Source: [mediasoup.org](https://mediasoup.org), npm registry.

**Library vs turnkey server**: mediasoup's own design docs state explicitly: "mediasoup is not a standalone server but an unopinionated Node.js module which can be integrated into a larger application." Source: [mediasoup.org/documentation/v3/mediasoup/design](https://mediasoup.org/documentation/v3/mediasoup/design/). It provides only media-plane primitives (a JS API layer plus C/C++ worker subprocesses for ICE/DTLS/RTP/RTCP); signaling, room/participant state, and auth are entirely the integrator's responsibility — mediasoup ships no rooms concept, no signaling protocol, and no persistence layer.

**License**: ISC License, confirmed by reading the actual LICENSE file. Source: [github.com/versatica/mediasoup/blob/master/LICENSE](https://github.com/versatica/mediasoup/blob/master/LICENSE).

**Resource requirements**: No self-hosting sizing guidance comparable to LiveKit's or Jitsi's exists, consistent with mediasoup being a library rather than a deployable product with its own ops docs.

**Audio-only as a natural mode**: Not applicable as a product concept — audio-only vs. audio+video is purely a matter of which producers/consumers the integrator's own code creates.

**Self-hosting fit (ADR-0004)**: No licensing/hosting tension (ISC, runs entirely as self-hosted Node code) — but the practical tension is ownership: since it's a library, ListItUp itself would become the maintainer of the SFU application/server logic (signaling, room lifecycle, reconnection), a materially larger ongoing maintenance surface than a turnkey server.

**Next.js/Node integration**: mediasoup is a Node.js module (npm package `mediasoup`, current latest 3.26.0 per npm registry) that can run inside a custom Node process alongside Next.js, but there is no official "Next.js SDK" or quickstart — a signaling server (typically WebSocket-based) and client wiring via `mediasoup-client` must be built from scratch.

### Jitsi (Videobridge)

**What it is**: Per the official repo, "a WebRTC-compatible Selective Forwarding Unit (SFU)... enabling highly scalable video conferencing infrastructure." Source: [github.com/jitsi/jitsi-videobridge](https://github.com/jitsi/jitsi-videobridge).

**Self-hosting story**: Videobridge (JVB) is a backend SFU component that in practice is deployed as part of a larger stack — a central Jitsi Meet server (nginx + Prosody XMPP server + Jicofo conference focus) plus one or more JVB instances coordinated over XMPP. It is not documented as a fully independent product usable without also standing up Prosody/Jicofo (or a custom XMPP-based signaling layer). Source: [jitsi.github.io/handbook — DevOps guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-scalable/). Deployment is via official Debian/Ubuntu packages or a Maven source build. Source: [github.com/jitsi/jitsi-videobridge](https://github.com/jitsi/jitsi-videobridge).

**License**: Apache License 2.0, confirmed by reading the actual LICENSE file. Source: [github.com/jitsi/jitsi-videobridge/blob/master/LICENSE](https://github.com/jitsi/jitsi-videobridge/blob/master/LICENSE).

**Resource requirements**: Official DevOps guide: "4 or 8 CPU with 8 GB RAM seems to be a good configuration" per videobridge instance; the central server (nginx/Prosody/Jicofo) needs less ("a 4 CPU, 8 GB machine will probably be fine"). Videobridges use UDP port 10000 for media. The guide explicitly frames scalable self-hosting as "not a beginner-level task." Source: [jitsi.github.io/handbook — DevOps guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-scalable/).

**Audio-only as a natural mode**: A documented, named mode — but it lives at the Jitsi Meet client-config layer (`startAudioOnly` flag: "Start the conference in audio only mode (no video is being received nor sent)"), not inside Videobridge itself. Source: [jitsi.github.io/handbook — dev-guide configuration](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration/). Videobridge's own `CONFIG.md` has no audio-only-specific settings. Source: [github.com/jitsi/jitsi-videobridge/blob/master/CONFIG.md](https://github.com/jitsi/jitsi-videobridge/blob/master/CONFIG.md).

**Self-hosting fit (ADR-0004)**: No licensing tension (Apache-2.0, official Debian packages/source build). The real tension is operational scope: adopting Jitsi for an audio-only channel feature means taking on a multi-component stack (Prosody + Jicofo + JVB, XMPP signaling) sized for full video conferencing, not a minimal audio-channel addition.

**Next.js/Node integration**: No lightweight official Next.js SDK/quickstart was found; integration means adopting Jitsi's own XMPP-based signaling stack rather than a simple server+client SDK pair.

### LiveKit Cloud

**What it is**: The managed-hosting counterpart to the same open-source LiveKit server. LiveKit's own site: "The LiveKit Agents framework and LiveKit media server are both completely open source," while LiveKit Cloud is "the best way to run LiveKit in production, with fully managed agent deployments, built-in observability and dashboards, and ultra low-latency global media transport." Source: [livekit.com/pricing](https://livekit.com/pricing) (canonical `livekit.io/pricing` redirects here).

**Pricing** (exact figures from the official pricing page):

| Plan | Price | WebRTC participant-minutes included | Overage |
|---|---|---|---|
| Build (free) | $0/mo | 5,000 min | — |
| Ship | $50/mo minimum | 150,000 min | $0.0005/min |
| Scale | $500/mo minimum | 1,500,000 min | $0.0004/min |
| Enterprise | custom | custom | — |

Other billed dimensions: agent-session-minute overage flat at $0.0100/min; data egress $0.12/GB (Ship) or $0.10/GB (Scale); recording/transcoding overage $0.005/min. Source: [livekit.com/pricing](https://livekit.com/pricing). Note the pricing page is now heavily oriented around LiveKit's AI-agent product line (agent-session-minutes, inference credits) layered on top of the same underlying WebRTC participant-minute metric that would apply to a plain human-to-human audio channel.

**Comparison to self-hosting**: Same open-source server underneath, but LiveKit Cloud is a proprietary hosted service — the server codebase is Apache-2.0 and self-hostable, but the cloud offering itself is not open-source or self-hostable.

**Self-hosting fit (ADR-0004)**: Direct tension — this is the one LiveKit-related option a third-party self-hoster of ListItUp could not stand up themselves; using it would make the voice-channel feature depend on a proprietary hosted backend rather than infrastructure the self-hoster controls, unless kept strictly as an optional alternative to the self-hosted OSS server.

**Next.js/Node integration**: Same SDKs as the OSS server (`livekit-server-sdk`, `livekit-rtc`, `livekit-client`).

### Daily.co

**What it is**: A managed cloud WebRTC platform (pay-as-you-go SaaS).

**Pricing**: Free tier of 10,000 participant-minutes/month; graduated per-participant-minute pricing beyond that (e.g. $0.0040/min at 10,001–100,000 min, scaling down to $0.0015/min at 50M+ min). Recording: $0.01349/min (video), billed by wall-clock time. Source: [daily.co/pricing](https://www.daily.co/pricing/), [daily.co/pricing/video-sdk](https://www.daily.co/pricing/video-sdk/).

**Audio-only support**: Explicitly supported and separately priced, with a dedicated docs page: "Accounts are automatically billed at the lower audio-only rate when no video tracks are present in a call" — enforced via room-level permissions (e.g. `{"properties": {"permissions": {"canSend": ["audio"]}}}`) that block camera/screenshare activation outright. Source: [docs.daily.co/guides/products/audio-only](https://docs.daily.co/guides/products/audio-only). The audio-only rate is roughly 4x cheaper than video at every tier ($0.00099/participant-minute down to $0.00036 at the highest volume tier). Source: [daily.co/pricing/video-sdk](https://www.daily.co/pricing/video-sdk/). For more than ~5 participants in an audio-only call, Daily's docs recommend limiting who can unmute and subscribing only to the active speaker to control bandwidth (same docs page).

**Self-hosting fit (ADR-0004)**: No self-hosted/on-prem option found on Daily's pricing or docs pages — it is a managed cloud platform only. A self-hoster of ListItUp would need their own Daily account/API key, which conflicts with the "no dependency the self-hoster can't run themselves" bar in ADR-0004.

**Next.js/Node integration**: No official Next.js-specific quickstart. Official SDKs are `daily-js` (vanilla JS) and `daily-react` (React hooks), documented generically for React rather than Next.js. Source: [docs.daily.co/get-started](https://docs.daily.co/get-started). Community/demo Next.js examples exist but are not first-party documentation.

### Twilio

**What it is**: A managed communications platform with separate Programmable Voice and Programmable Video products.

**Programmable Voice pricing**: Outbound to US numbers $0.0140/min; inbound to US local numbers $0.0085/min (+$1.15/mo number rental) or toll-free $0.0220/min (+$2.15/mo rental); pay-as-you-go with automatic volume discounts. Source: [twilio.com/en-us/voice/pricing/us](https://www.twilio.com/en-us/voice/pricing/us).

**Programmable Video pricing**: Group Rooms $0.004/participant-minute (same rate for track recordings); composed recordings $0.01/composed-minute; media storage $0.00167/GB/day (first 10GB free); real-time transcription $0.027/room/minute regardless of participant count. Source: [twilio.com/en-us/video/pricing](https://www.twilio.com/en-us/video/pricing).

**Notable finding — Programmable Video's status and audio-only path**: Twilio announced Programmable Video end-of-life in 2023/2024 (EOL date pushed to December 5, 2026), then reversed the decision — an official changelog entry dated October 21, 2024 states: "we've reversed our earlier decision to retire Twilio Video in 2026... Twilio Video will remain a standalone product." Source: [twilio.com/en-us/changelog — Twilio Video will remain a standalone product](https://www.twilio.com/en-us/changelog/-twilio-video-will-remain-a-standalone-product). However, Twilio's own docs restrict the legacy audio-only Group Room flag to existing customers only: "Given the renewed focus on video use cases this feature is only available to existing customers... For developers who are interested in developing audio only use cases we recommend using the Twilio Voice SDKs." Source: [twilio.com/docs/video/legacy-room-types](https://www.twilio.com/docs/video/legacy-room-types). In practice, Twilio's own current guidance for a new integration is to build an audio-only channel feature on Programmable Voice, not Video.

**Self-hosting fit (ADR-0004)**: No self-hosted/on-prem option — Twilio's own architecture docs describe Twilio Cloud as the SFU/media relay for Video. Source: [twilio.com/docs/video/overview](https://www.twilio.com/docs/video/overview). Both Voice and Video require a Twilio account, conflicting with ADR-0004's bar for self-hoster-runnable infrastructure.

**Next.js/Node integration**: Official Node.js server-side quickstart for Programmable Voice at [twilio.com/docs/quickstart/node/programmable-voice](https://www.twilio.com/docs/quickstart/node/programmable-voice), and a framework-agnostic browser JS SDK quickstart at [twilio.com/docs/voice/sdks/javascript/get-started](https://www.twilio.com/docs/voice/sdks/javascript/get-started) (built around Twilio Functions for the backend). No Next.js-specific quickstart found for either product.

### Agora

**What it is**: A managed real-time communication platform built on Agora's own Software Defined Real-time Network (SD-RTN).

**Pricing**: Unified RTC (voice + video) rate of $0.59 per 1,000 minutes, with the first 10,000 combined RTC minutes free every month; no separate voice-only vs. video-only rate is broken out on the primary pricing page. Source: [agora.io/en/pricing](https://www.agora.io/en/pricing/). (Third-party aggregator snippets suggested a voice/video price split, but this was not corroborated on Agora's own page as fetched — treat any voice/video price differential as unconfirmed until checked directly against the live pricing page.) Other add-ons on the same page: recording $0.99/1,000 min, AI noise suppression $0.59/1,000 min, cloud transcoding $1.99/1,000 min.

**Audio-only support**: Not priced as a distinct line item — RTC pricing is unified for voice and video under one per-minute rate rather than a separately discounted audio-only tier, unlike Daily.co.

**Self-hosting fit (ADR-0004)**: The core transport runs on Agora's managed SD-RTN with no on-prem replacement documented. Agora does offer an "On-Premise Recording" component self-deployed on the customer's own Linux servers, but per Agora's own docs this "works with RTC SDK" — i.e., it self-hosts only the recording/composition step, while live audio/video transport still depends on Agora's cloud network. Source: [docs.agora.io/en/on-premise-recording/overview/product-overview](https://docs.agora.io/en/on-premise-recording/overview/product-overview). This is not a self-hosted alternative to the core service, which conflicts with ADR-0004's bar.

**Next.js/Node integration**: No first-party Next.js quickstart for the core RTC SDK. The community org `AgoraIO-Community` hosts a React wrapper with a bundled Next.js example (`Agora-RTC-React`) and a Web UIKit with a Next.js example branch. Official quickstart docs at [docs.agora.io/en/video-calling/get-started/get-started-sdk](https://docs.agora.io/en/video-calling/get-started/get-started-sdk) are Web/JS-generic, not Next.js-specific. Agora's separate Conversational AI product line does have an official Next.js CLI scaffold (`agora init my-nextjs-demo --template nextjs`), but that targets AI voice agents, not the core RTC/voice-channel use case.

---

## Text Chat Section

### Self-built (Postgres + WebSocket/SSE + Redis)

Given ListItUp's existing stack, a self-built text chat would store messages in Postgres (via Prisma, following the existing schema-as-source-of-truth convention) and deliver them in near-real-time to connected clients via WebSocket or Server-Sent Events, with Redis's pub/sub used to fan messages out across multiple app instances (a single instance can simply push to its own in-memory connection list; Redis pub/sub is needed only once there is more than one Next.js instance, which is the same shape of problem the distributed LiveKit deployment described above already needs Redis for — see [ADR-0005](../ADR/0005-redis-for-authentication-rate-limits.md)).

**Operational complexity**: Requires a persistent connection layer, which is architecturally distinct from Next.js's default per-request Route Handler model — see the "Next.js WebSocket support" findings below for what this specifically requires. Reconnection handling, presence, and backfill (loading message history on reconnect/join) all need to be built and maintained in-house; there is no vendor absorbing this operational surface.

**Realtime delivery guarantees**: A naive WebSocket/SSE push is best-effort — if a client is disconnected when a message is sent, it must re-fetch on reconnect rather than relying on the push itself. Because messages are durably stored in Postgres before/as they're broadcast, an at-least-once-from-storage model is achievable in principle (client reconnects, queries for messages since its last-seen cursor/timestamp, backfills the gap) even though the live push itself is best-effort. This requires deliberate design (a per-channel/per-client cursor, an explicit backfill query path) rather than coming for free.

**Fit with the single-deployable-app model**: Consistent with `Architecture.md`'s "no separate backend service" model as long as the app remains a long-running Node process (see below) rather than deployed as serverless functions — the connection-holding piece runs inside the same process as the rest of the app, with Postgres and Redis as the only additional infra dependencies, both already self-hosted per ADR-0002/ADR-0005.

### Stream Chat (getstream.io)

**What it is**: A dedicated hosted chat API/SDK product.

**Pricing**: Free "Build" tier — 1,000 MAU, 100 concurrent connections, community support only. Paid tiers: "Start" ($399/mo annual or $499/mo monthly) — 10,000 MAU, 500 concurrent connections; "Elevate" ($599/mo annual or $675/mo monthly) — same MAU/connection caps plus multi-tenancy, advanced search, HIPAA compliance; "Enterprise" (custom) — 1M+ MAU, 750,000+ concurrent connections, 99.999% SLA. Overages: $6.00 per 1M messages stored, $0.05 per 1K channels, plus API-call/bandwidth/CDN fees. Source: [getstream.io/chat/pricing](https://getstream.io/chat/pricing/).

**Self-hosting story**: No mention of self-hosted, on-premise, or BYOC options anywhere on Stream's own pricing page. The only non-standard deployment variant referenced is "dedicated servers" under the Enterprise tier, which reads as Stream-hosted dedicated infrastructure rather than customer self-hosting — no Stream-authored page (docs or pricing) was found stating an on-prem/self-hostable mode exists. This is not a confirmed absolute negative, but no primary-source evidence of self-hosting surfaced despite searching Stream's own materials — flag as **apparently SaaS-only**, in tension with ADR-0004.

**Next.js/Node integration**: React SDK (`stream-chat` + `stream-chat-react`), with an official React Chat Tutorial ([getstream.io/chat/docs/react](https://getstream.io/chat/docs/react/), [getstream.io/chat/sdk/react/tutorial](https://getstream.io/chat/sdk/react/tutorial/)) and official Next.js example repos on GitHub (e.g. [GetStream/fullstack-nextjs-whatsapp-clone](https://github.com/GetStream/fullstack-nextjs-whatsapp-clone), [GetStream/nextjs-ai-chat-app](https://github.com/GetStream/nextjs-ai-chat-app)) — Next.js support comes via these example repos rather than a distinct "Next.js SDK."

### PubNub (pubnub.com)

**What it is**: A managed pub/sub messaging network for realtime chat and data.

**Pricing**: Free tier — 200 MAU or 1M transactions, 1GB storage (7-day retention), 5 serverless Functions. "Starter" — $98/mo, 1,000 MAU, up to 6 months storage, 30 Functions. "Pro" — custom volume-based pricing (e.g. ~$370/mo at 5,000 MAU, ~$550/mo at 10,000 MAU, ~$1,130/mo at 25,000 MAU) with unlimited storage and up to 99.999% SLA. Pricing is based on MAU alone; messages/API calls/bandwidth are unlimited at every tier. Source: [pubnub.com/pricing](https://pubnub.com/pricing/).

**Self-hosting story**: PubNub's own support article states directly: "PubNub does not offer a self-hosted solution and offers a hosted network solution only." Source: [support.pubnub.com — "Does PubNub offer a self-hosted solution?"](https://support.pubnub.com/hc/en-us/articles/360051974631-Does-PubNub-offer-a-self-hosted-solution-). A one-off exception exists: a fully decoupled, on-premise deployment was built for In-Q-Tel-affiliated customers requiring disconnected/private networks, described as a proof-of-concept rather than a general product offering (source: [iqt.org press release](https://www.iqt.org/library/pubnub-announces-delivery-of-private-on-premise-deployment-for-in-q-tel-customers), corroborated by the support article above). **SaaS-only** for all standard plans — direct tension with ADR-0004.

**Next.js/Node integration**: No distinct "Next.js SDK" — integration uses the general JavaScript SDK (`pubnub` npm package) or the newer TypeScript Chat SDK (`@pubnub/chat`), both framework-agnostic. PubNub publishes its own tutorial, "Creating a Real-Time Chat Application with Next.js," on its blog ([pubnub.com/blog/how-to-build-a-next-js-real-time-chat-application](https://www.pubnub.com/blog/how-to-build-a-next-js-real-time-chat-application/)) — first-party but blog content rather than versioned docs.

### Ably (ably.com)

**What it is**: A managed realtime messaging platform (pub/sub + presence + chat primitives).

**Pricing**: Free — 200 concurrent connections, 500 messages/sec, 6M messages/mo, best-effort support. "Standard" — $29/mo + usage, 10k concurrent channels/connections, 2.5k messages/sec, 1-day email SLA. "Pro" — $399/mo + usage, 50k concurrent channels/connections, 10k messages/sec, 4-hour email SLA. "Enterprise" — custom, unlimited channels/connections/messages/sec, 99.999% SLA. Usage overages scale down with volume (e.g. messages from $2.50/M to $0.50/M). Source: [ably.com/pricing](https://ably.com/pricing).

**Self-hosting story**: Ably's own enterprise-customization docs describe dedicated, isolated clusters for Enterprise customers: "Customers who require isolation from our global cluster for security, governance or guaranteed capacity reasons are able to run the Ably platform on their own EC2 dedicated environments," restricted to "Amazon EC2 environments (within Virtual Private Networks)," with "Ably... responsible for pro-actively managing and updating dedicated clusters." Source: [ably.com/docs/platform/account/enterprise-customization](https://ably.com/docs/platform/account/enterprise-customization). This is Ably-hosted dedicated infrastructure on Ably-managed AWS, not customer self-hosting — Ably retains operational control, and no true on-premise (customer-datacenter) option is documented. **SaaS-only in practice**, even at the dedicated Enterprise tier — in tension with ADR-0004.

**Next.js/Node integration**: Official `ably-chat-js` SDK ([github.com/ably/ably-chat-js](https://github.com/ably/ably-chat-js)) includes React hooks built for Client Components. Ably publishes official blog tutorials for Next.js + Vercel and Next.js + Netlify integration, and Vercel hosts an official "Ably + Next.js Starter Kit" template ([vercel.com/templates/next.js/ably-nextjs-starter-kit](https://vercel.com/templates/next.js/ably-nextjs-starter-kit)).

### Next.js's official position on WebSockets

This directly affects the self-built option and is worth stating precisely, per Next.js's own docs (fetched directly from nextjs.org):

- **Serverless/lambda deployments cannot hold WebSocket connections.** Next.js's own docs state: "Some hosts deploy Route Handlers as lambda functions. This means: ... WebSockets won't work because the connection closes on timeout, or after the response is generated." Source: [nextjs.org/docs/app/guides/backend-for-frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) (Next.js 16.3.3 docs, last updated 2026-06-25).
- **The documented escape hatch is a custom server** — replacing `next start` with a hand-rolled Node `http.createServer` wrapping Next's request handler. Next.js frames this as a last resort: "A custom Next.js server allows you to programmatically start a server for custom patterns. The majority of the time, you will not need this approach... it should only be used when the integrated router of Next.js can't meet your app requirements." A custom server is also explicitly incompatible with standalone output tracing: "When using standalone output mode, it does not trace custom server files... These cannot be used together." Source: [nextjs.org/docs/pages/guides/custom-server](https://nextjs.org/docs/pages/guides/custom-server) (updated 2025-04-24).
- **Self-hosting via `next start` (Node server, Docker, or VM) is fully supported with no WebSocket caveat** — the self-hosting docs frame "self-host your Next.js application on a Node.js server, Docker image, or static HTML files" as one of exactly three supported deployment shapes, and the serverless-specific WebSocket limitation above does not apply to this long-running-process shape. Source: [nextjs.org/docs/app/guides/self-hosting](https://nextjs.org/docs/app/guides/self-hosting) (updated 2026-08-25).

**Net takeaway**: Next.js's own docs draw the line exactly where ListItUp's architecture already sits. A Route Handler on a serverless/lambda host cannot hold a WebSocket connection open; a long-running Node.js process — which is what `Architecture.md` already describes ListItUp as, self-hosted via `next start`/Docker rather than serverless functions — can. Reaching for a custom server to attach a WebSocket layer is the documented path for this, with the caveat (per Next.js's own docs) that it's presented as something to use "only when the integrated router... can't meet your app requirements," and it forfeits standalone-output file tracing.

---

## Open Tensions for the Decision Ticket

- **Self-hosting requirement (ADR-0004) vs. managed-API convenience/reliability.** Every third-party managed API researched here — LiveKit Cloud, Daily.co, Twilio, Agora for voice; Stream Chat, PubNub, Ably for chat — is SaaS-only with no true customer-self-hostable deployment mode (Ably's "dedicated cluster" and Agora's "on-premise recording" are the closest exceptions, and both still leave the core managed service in the vendor's hands). Any of these would mean a third-party self-hoster of ListItUp needs an account/API key with an external vendor, which the rest of the self-hosted stack (Postgres, MinIO, Redis, Better Auth) does not require.
- **Turnkey server vs. build-your-own-signaling effort for voice.** LiveKit (turnkey, Apache-2.0) and Jitsi (turnkey but heavier multi-component stack) are ready-to-deploy servers; mediasoup is explicitly a library, not a server, per its own docs — choosing it means ListItUp takes on ongoing ownership of the signaling/room-lifecycle layer that a turnkey server would otherwise absorb.
- **Jitsi's operational weight vs. its audio-only support being real.** Jitsi is the only self-hosted SFU option with a documented, named audio-only mode (`startAudioOnly`), but using it means standing up the full Prosody + Jicofo + JVB + XMPP stack sized for full video conferencing — a heavier footprint than LiveKit or mediasoup for a voice-only feature.
- **Twilio Video's narrowing audio-only path.** Twilio's own docs now restrict the legacy audio-only Group Room flag to pre-existing customers and explicitly redirect new audio-only use cases to Programmable Voice instead of Video — a real constraint if Twilio Video is considered.
- **Self-built chat's WebSocket requirement vs. Next.js's documented serverless limitation.** A self-built Postgres+WebSocket chat is architecturally sound for ListItUp's single-long-running-process deployment model, per Next.js's own docs, but requires either a custom server (which Next.js frames as a last resort and which loses standalone-output tracing) or an SSE-based alternative — this is a real design constraint, not just an implementation detail.
- **Self-built chat's realtime guarantee is best-effort by default.** At-least-once delivery is achievable by treating Postgres as the source of truth and having clients backfill via a last-seen cursor on reconnect, but this must be deliberately designed — a naive WebSocket/SSE broadcast alone offers no delivery guarantee.
- **Managed chat vendor pricing models differ in what they charge for** (Stream Chat: MAU + concurrent connections + messages stored; PubNub: MAU only, unlimited messages; Ably: concurrent connections/channels + messages/sec, with usage overages) — these don't map onto the same cost curve as ListItUp's usage pattern (per-project and 1:1 channels rather than large broadcast audiences), so a cost comparison would need real usage projections, not just list pricing.
- **Agora's voice/video pricing split could not be confirmed on its own live pricing page** during this research (third-party sources suggested a split rate not corroborated on agora.io/en/pricing/ as fetched) — this should be re-verified directly against Agora's current pricing page before being relied on in a decision.
