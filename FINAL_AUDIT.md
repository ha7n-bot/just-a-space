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
