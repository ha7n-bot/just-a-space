# Application architecture

The deliverable is a server-rendered bilingual website backed by an authenticated CMS on the same origin. The runtime uses Node 24 ESM, built-in HTTP, SQLite, Intl, cryptography and filesystem APIs. The application has no third-party runtime npm dependencies. The pinned project lockfile and the CI/browser toolchain are distinct. GitHub Pages or a static export can show the public design, but owner login, dynamic publication and secure media management require the Node process and a persistent database.

## Request and content flow

| Layer | Responsibility |
| --- | --- |
| server.mjs | Security headers, static allowlist, public GET/HEAD routing, localization, sitemap and robots, admin dispatch |
| config/business.mjs | Project defaults, timezone, currency, localized route names and research-seeded business details |
| lib/hours.mjs | Compute open/closed/unknown using Riyadh dates, cross-midnight intervals and date-specific overrides |
| web/render.mjs, web/copy.mjs, web/assets | Locale-aware semantic HTML, localized text, styles, interaction scripts, artwork and packaged font |
| cms/index.mjs, views.mjs, labels.mjs | Same-origin forms, authentication, role checks, bilingual admin views and action handling |
| cms/schema.mjs | Field kinds and bilingual payload, monetary, schedule, image path and link validation |
| cms/db.mjs, cms/001.sql | SQLite schema initialization, transactional updates, revision and audit records, published read model |
| cms/media.mjs | Bounded validation and re-encoding for supported owner-uploaded PNGs |
| scripts/build.mjs | Render offline staging output under dist using a temporary empty database. This export is an independent snapshot |
| ops/snapshot.mjs | Integrity-checked backup and restore to fresh paths |
| data/research.json, RESEARCH_SOURCES.md | Internal research leads, evidence and ownership questions kept apart from the public catalog |

1. The request router validates the path and locale. / routes to the stored language preference or Arabic. Named pages and published product details are rendered server-side.
2. The CMS reads only live record copies for the public model. A product must have a published category, a price and current availability. Admin writes run in a transaction and check the submitted revision.
3. A record may retain a previously approved live copy during draft editing. Submission and owner attestation promote a reviewed copy. Archival removes the public copy. Archived data can return to draft for review.
4. Only approved content should determine public channels, hours, prices and images. Internal research leads are insufficient authorization to publish. Replacing the café requires updating configuration, copy, approved artwork, current evidence and CMS records. Review brand-specific text throughout the theme before reuse.
5. Operational rollback, TLS and restricted staging access belong to the host. PUBLIC_LAUNCH is an indexing switch. The operator and final reviewer remain responsible for verifying business permission and outstanding launch criteria.

## Engineering reference decisions

| Reference | Evaluation and decision |
| --- | --- |
| [Next.js](https://github.com/vercel/next.js) and [hosting guide](https://nextjs.org/docs/app/guides/self-hosting) | Maintained MIT React framework supports server rendering and multi-instance deployment patterns. This project implements a native Node HTTP server with a single persistent database, so Next.js and its build dependencies were not introduced |
| [next-intl](https://github.com/amannn/next-intl) and [localized routing](https://next-intl.dev/docs/routing) | MIT library for Next.js. Locale-prefixed equivalent URLs and per-locale UI dictionaries suit the route design. It has no runtime role in this framework-independent implementation |
| [Playwright](https://github.com/microsoft/playwright) and [browser documentation](https://playwright.dev/docs/browsers) | Apache-2.0 browser automation with Chromium, Firefox and WebKit support. Pin the test package and install matching engines in CI. Actual executed configurations are listed in QA_RESULTS.md |
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) and [AutoGen](https://github.com/microsoft/autogen) | External automation frameworks were reviewed for relevance. The OpenAI Python SDK is MIT. AutoGen upstream directs new users to Microsoft Agent Framework. Project coordination happened in the build environment; neither belongs in the café's application runtime |
| [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) | A native outbound Maps link avoids importing reviews or images, exfiltrating visitor data into an embedded feed and requiring a paid API key |
| [Google localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions) and [local business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business) | Separate language paths, reciprocal alternates and truthful business data. Record missing owner confirmation rather than inferring rich-result fields |

Reference review was selective. No code from the inspiration repositories was vendored or executed. Maintenance state is time-sensitive. Before adopting new dependencies, review their current license, advisories, version and lockfile changes. The retail site does not make model calls or run autonomous agents for visitors.
