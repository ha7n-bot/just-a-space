# Issue register

| ID | Severity | Component and reproduction | Expected / observed | Owner and correction | Regression |
| --- | --- | --- | --- | --- | --- |
| QA-001 | P2 | Request /assets/arabic.woff via the original server | Arabic font loads / extension omitted from MIME allowlist | Server engineer added WOFF and JPEG MIME entries | Resolved. The asset is permitted and managed Chrome rendered the styled Arabic homepage. |
| QA-002 | P1 | Start managed preview with its supplied --port 4173 | Selected port used / server listened on 3000 and preview timed out | QA added a Node development launcher which validates and forwards host/port | Resolved. Managed launcher started at the selected port; browser visited all 18 pages. |
| QA-003 | P2 | Inspect the accessible Arabic homepage H1 | Natural word boundary / initial accessible name joined both spans | Frontend added literal whitespace | Resolved in source. Confirm with a native screen reader in final review. |
| QA-004 | P1 | Render approved settings with WhatsApp and geographic coordinates in each locale | Verified entries reach pages / initial integration fixture failed | Frontend corrected CMS-to-page mapping | Resolved. Both settings regression tests pass. |
| QA-005 | P1 gate | Run the requested local multi-engine Playwright, axe and Lighthouse checks | Complete result matrix / Chromium wrapper missing executable and no other engine binaries or audit packages | QA supplied local runner and GitHub CI matrix | Open environment dependency. Run on provisioned CI before approval. |
