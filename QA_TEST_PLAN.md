# Test plan

Use an isolated preview with disposable credentials and content for workflow tests. Never submit synthetic customer messages to live channels. Record the version under test, actual results, viewport, language and engine. Evidence that could reveal credentials or real messages stays out of version control.

1. Run the repository unit/integration suite for publishing, current schedule calculation, menu data and server routing.
2. Start a preview and inspect both language homepages. Run `python tests/browser_qa.py http://127.0.0.1:3000 --output qa-output` against a locally running checkout, or provide a permitted staging URL. Install Python Playwright and its browser first. Select `--browser firefox` or `--browser webkit` for the other engines. For system Chromium, pass `--executable /usr/bin/chromium`.
3. Inspect each public route in both languages at 320, 375, 390, 430, 768, 1024, 1440 and 1920 CSS px. The harness records 54 full-page screenshots at 390, 768 and 1440 px and reports document overflow, missing alternate routes, language, landmarks, obvious image failures and runtime errors. Human review is required for clipping and composition.
4. Test menu search and categories with verified publication fixtures in a disposable database, and check removal after withdrawal. Check form success only when a delivery or storage path exists. Check copy/share fallbacks, mobile drawer focus, Escape and return focus, keyboard navigation, enlarged text and reduced motion.
5. For an authorized axe-core installation pass `--axe /absolute/path/to/axe.min.js` to the browser harness. Test with screen reader users in Arabic and English on real devices before claiming conformance.
6. Run Lighthouse on a freshly provisioned public-like origin under documented mobile throttling, using a fresh profile for every run. Record medians, engine, throttling and build. Report real-user data separately after launch and consent review.
7. Verify protected CMS access, role boundaries, server validation, workflow transitions, soft archival, audit entries, and owner setup against disposable data. Tag blocking findings and retest after corrections.
