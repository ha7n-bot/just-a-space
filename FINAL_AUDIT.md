# Independent release audit

Assessment date 2026-11-26. Findings below refer to the exact source and test evidence reviewed. Code review, automated tests, legal or business approval and real-user field data are distinct types of evidence.

## Acceptance gates

1. Functional review: navigate the published routes, switch locale mid-journey, verify contact delivery behavior and approved-menu publication.
2. Visual review: examine rendered Arabic and English pages at phone, tablet and desktop widths with authorized assets.
3. Arabic and English copy: check navigation, missing-data messages, account flows and policy text. Require owner sign-off on original marketing copy.
4. Data release: establish the identity, branch, rights, current menu and price provenance. Hide missing or disputed fields. A Google Maps link is not blanket verification or commercial photo permission.
5. Directionality and mobile use: test logical layout, keyboard focus, zoom and narrow widths.
6. Security: inspect server-side access controls, sessions, mutation validation, request origin/CSRF, escaping, SQL binding, ownership setup, audit trail and deployment boundaries. Any observed unauthorized access blocks release.
7. Accessibility, SEO and performance: evaluate actual automated and manual coverage. Distinguish lab results from post-launch field telemetry.
8. Deployment: require HTTPS, protected staging, persistent database, restore exercise, production domain ownership, authorization and an approved release reference.

## Legal source review

- The Saudi Data & AI Authority's Personal Data Protection Law, articles 11–13, addresses minimization, advance privacy notice and information at collection. Before introducing personal-data intake, the owner must identify the controller, approved channel for exercising rights, processing purposes/legal basis, retention/destruction practice and service providers. Review the final notice in both languages and validate it against actual hosting and collection behavior. [SDAIA law](https://dgp.sdaia.gov.sa/wps/wcm/connect/ce84f976-2fdf-4a76-a8c4-638b7ca9e3ba/Personal%2BData%2BEnglish.pdf?MOD=AJPERES)
- ZATCA's retail-sector guidance §4.2.1 covers publicly displayed retail prices, including online publication. Obtain the owner's final consumer prices including any applicable VAT, and distinguish branch prices from delivery prices. No assumption about this café's VAT registration is warranted. [ZATCA retail guide, p. 14](https://zatca.gov.sa/ar/HelpCenter/guidelines/Documents/Guideline-For-Retail-Sector-under-VAT-Provisions.pdf)

- Saudi Food & Drug Authority guidance includes restaurant websites in calorie-display guidance and identifies rules for caffeine, high salt and activity labeling. Before publishing an operational menu, have the operator determine applicability per item and verify the disclosures in both the digital and printed views against approved records. [SFDA menu requirements](https://sfda.gov.sa/en/news/17639) · [Calorie-display guidance](https://www.sfda.gov.sa/sites/default/files/2025-05/SFDA-CalOutHome.pdf)

## Independent checks and correction round

| ID | Severity | Reproduction and expected outcome | Observed defect and correction | Independent regression |
| --- | --- | --- | --- | --- |
| A01 | P1 | Validate a product with an empty-string price, then read a temporary database containing blank, null, zero and positive prices. Only genuine numeric prices qualify. | Optional typed empties passed validation and the public-data filter used null checks. CMS now rejects blank typed input and filters historical records by finite numeric price. | Direct validator and legacy-row fixture passed. Real zero and 17.25 test prices survive, blank and null rows stay hidden. |
| A02 | P3 | Render the account management page in Arabic. Visible roles should use Arabic labels while the submitted values remain stable. | Raw role identifiers appeared in text and selectors. View now localizes labels independently of role values. | Source inspection of Arabic labels, option values and account-role handling. |
| A03 | P1 | Render a published gallery record using the uploaded PNG path format. Its image should appear in both localized galleries. | The public image allowlist omitted the CMS upload namespace. Renderer now accepts approved hashed paths. | Independent tests in tests/published-settings.test.mjs passed for both locales. CMS tests cover public and draft media access. |
| A04 | P2 | Publish the CMS-shaped business contact/coordinate object and render contact/location in both languages. | Public renderer expected different field names, so WhatsApp and geographic structured data disappeared. Mapping corrected. | Independent contact/schema regression passed in both languages. |
| A05 | P2 | Inspect the last authorization check before a multipart upload commits bytes. A revoked session should lose its ability to upload. | Upload bypassed the shared post-body session check. CMS now repeats the session/role check before synchronous validation and storage. | Independent code-path inspection; ordinary upload and revoked-session integration tests pass. Concurrent revocation during streaming was not simulated. |

An independent HTTP smoke test ran with an isolated database and a fixed loopback origin. All 18 visitor routes plus two localized 404 checks returned the expected statuses, direction, language and single main heading. Five requested static resources returned HTTP 200. An anonymous request for account management redirected to sign-in. The staging responses carried noindex. Source review also verified a 52-field research register covering the 17 candidate menu items and confirmed the design renders use original scene code and a licensed local Noto Sans Arabic font. The two preview WebP files measure 1250×1100 and 950×680 pixels.

Independent local commands passed on Node 24: npm run lint (syntax validation), npm run build (localized staging output), and npm test (16 Node checks at this checkpoint). The implementation is JavaScript, so no TypeScript validation result applies. Later checks and visual evidence are recorded in QA_RESULTS.md and the final release decision below.

## Final assessment and release decision

**STAGING PREVIEW READY. Official public release is withheld.** This decision covers the bilingual review build and the separately runnable Node/SQLite CMS. A static preview demonstrates visitor pages only. The production host, business-controlled domain, owner bootstrap and approved data must be verified on the selected deployment before sign-off.

| Category | Points | Evidence and deduction |
| --- | ---: | --- |
| Visual design and brand identity | 10 / 15 | Original licensed/created assets, architectural compositions and Arabic desktop visual review. Authentic branch photography, logo and operator brand approval outstanding. |
| Arabic and English localization | 12 / 15 | Both sets of routes, differentiated writing, directional markup, corrected Arabic roles and mixed-direction price isolation. Full device and assistive-technology coverage pending. |
| Functional completeness | 11 / 15 | Public workflows, gated contact links, CMS transactions, history, publication and recovery exercised. Authenticated production-host end-to-end journey, including all operational content, still pending. |
| Responsive design | 5 / 10 | Logical CSS, mobile breakpoints, localized browser rendering and desktop reflow checked. Obtain executed eight-width matrix, zoom and full screenshot review. |
| Business data accuracy | 5 / 10 | Disambiguation, per-field evidence and deliberate suppression of unsupported fields. Operator identity, official Arabic spelling, hours, channels and services unconfirmed. |
| Menu and pricing accuracy | 2 / 10 | Historical malformed or missing prices suppressed. Synthetic test prices render correctly. No current approved in-store items or prices qualified for publication. |
| Security and privacy | 7 / 10 | Source review and role, session, origin, upload and publication tests. Controller identity, retention, host access controls and deployed restore drill still require confirmation. |
| Performance | 2 / 5 | Small server-rendered application, optimized stills and local font. No reproducible Lighthouse target results or real-user field measurements. |
| Accessibility | 3 / 5 | Semantic routes, keyboard controls, focus styling and desktop browser checks. Axe and manual assistive-technology checks remain. |
| SEO and deployment readiness | 3 / 5 | Localization metadata, conditional structured data, deployment and recovery tooling. Final domain, DNS/TLS, live crawl and host behavior await verification. |
| **Evidence-supported total** | **60 / 100** | Independent release assessment. The 95-point target has not been established. |

The browser QA agent reported a managed desktop Chrome sweep of all 18 visitor routes, including localized titles, directions, single headings, noindex and desktop document overflow. It also inspected the Arabic home visual with both stills decoded. The standalone browser/axe/Lighthouse toolchain did not supply a complete cross-browser or responsive baseline. See QA_RESULTS.md, ACCESSIBILITY_REPORT.md and PERFORMANCE_REPORT.md for the final measured subset and evidence. No independent claim of WCAG conformance, Lighthouse scores or field Core Web Vitals is made.

### Release blockers and acceptance evidence

1. **Branch owner and editorial approval.** Confirm authority, naming, licensed logo/photography, address/pin, weekly and exceptional hours, social/contact channels, and marketing copy. Maintain durable authorization references.
2. **Operational menu.** Obtain date-stamped branch price/variant/availability and labeling evidence, settle tax presentation and applicable SFDA disclosures, and sign off the digital and print menu. Recheck details after publication through the real CMS.
3. **Privacy implementation.** Establish controller identity, rights channel and actual host/log/backup retention. Approve corresponding Arabic and English notices against the release environment.
4. **Browser and accessibility evidence.** Complete the requested mobile/tablet/desktop matrix, Firefox/WebKit, 200% zoom, assistive-technology and axe review. Re-run checks after substantive changes and close P0/P1 findings.
5. **Production and performance.** Confirm business-controlled domain/host, HTTPS, authenticated preview, secure owner initialization, durable storage and recovery from the real backup service. Benchmark the release URLs using documented mobile Lighthouse settings. Record real-user metrics once adequate traffic exists.
6. **Authorization to go live.** Approve the exact release reference, permissions, indexability, canonical origin and public content. Shipping source to a Git repository and deploying a restricted preview do not constitute official launch authorization.

### Coordinator's post-audit verification · 27 November 2026

The independent score above is the original assessment, before the full browser run. Release classification still limits use to staging. The revision `95fdf5e64e77fe6840bfc378b4a8dfeea9cf980c` passed 513 checks per engine in Chromium, Firefox and WebKit, including eight viewport widths, 200% text, localized error routes, keyboard navigation and the selected desktop axe checks. The separate menu fixture journeys passed in every engine. The browser run retained 162 screenshots. Manual screen-reader checks and production-host testing remain outstanding. [Browser regression run](https://github.com/ha7n-bot/just-a-space/actions/runs/45933864993)

The owner-restricted visitor preview was successfully deployed with the responsive corrections. It uses public-page rendering and synthetic editorial imagery with preview captions. The secure CMS is included in the GitHub source and requires a persistent Node and SQLite host for actual content editing. No production domain or launch was activated.

Mobile Lighthouse 12.8.2 returned 99 performance, 100 accessibility, 96 best practices and 66 SEO for both locales on the staging-configuration homepages. The staging environment is intentionally excluded from indexing. Arabic and English LCP were 1.879 s and 1.954 s, respectively. INP and production SEO remain unmeasured. [Lighthouse job and raw results](https://github.com/ha7n-bot/just-a-space/actions/runs/45934052702)
