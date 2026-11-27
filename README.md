# JUST A SPACE · جست أ سبيس

A bilingual café website and server-rendered editorial dashboard for owner review. The Arabic and English sites run at /ar and /en. The legacy index.html on the GitHub branch is preserved from the original repository. Launch this application through Node instead of opening that file.

## Run locally

Requires Node 24 and a writable volume. All runtime modules ship with the project or Node. From the project root:

~~~sh
npm ci --ignore-scripts
npm run lint
npm test
npm run build
node --env-file=.env.example server.mjs
~~~

Visit http://localhost:3000/ar or http://localhost:3000/en. The default SQLite database is created in var/. /admin is separate from visitor navigation. Follow [owner setup](OWNER_HANDOVER.md) to create the first owner using a secure prompt. There is no pre-created account. Use an exact SITE_ORIGIN for the administration interface.

## Customer and owner journeys

- Nine visitor pages per language, including the HTML menu, location and contact channels. Menu details, variant selection and search become available when approved products are published.
- Draft/review/publish workflow, server-enforced permissions, change log, archive and restoration, bilingual content, gallery, schedules, prices and availability.
- Public messages, external analytics, live ratings and ordering services are inactive. The application does not collect visitor inquiries.
- Empty menu data is intentional. [Verification register](DATA_VERIFICATION.md) and [source register](RESEARCH_SOURCES.md) document branch-level evidence, unresolved prices, conflicting hours and image rights.
- The staging build uses new, labelled visual studies. The owner must supply and approve permanent imagery and identity assets.

## Review and operations

[Project plan](PROJECT_PLAN.md) · [Architecture](ARCHITECTURE.md) · [Menu model](MENU_DATA_SCHEMA.md) · [Security review](SECURITY_REVIEW.md) · [Test results](QA_RESULTS.md) · [Independent decision](FINAL_AUDIT.md) · [Deployment](DEPLOYMENT_GUIDE.md) · [Domain setup](DOMAIN_SETUP.md)

To generate a print-ready menu QR after domain approval, use Python with ReportLab and run `python scripts/menu-qr.py https://YOUR-APPROVED-DOMAIN menu-qr.pdf`. It encodes /ar/menu by default. Use --language en for the English menu. Scan a proof from the final print stock before printing at scale.

A private public-page preview, where available, uses the static build. The full editable CMS needs the persistent Node server. Staging content is excluded from indexing. Public launch requires the approval gates in the audit and an HTTPS origin.
