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

## Review status

Independent inspection pending implementation. Public release has no approval.
