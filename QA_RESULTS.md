# Executed quality checks

On November 26–27, 2026 the managed Chrome preview rendered each of the nine public routes in Arabic and English. Playwright DOM observations across all 18 pages found a unique localized title, correct document language/direction, one main element, one H1, image alt attributes where images appeared, and a noindex directive. Document scrolling width equalled the available width in every case (1,348 CSS px, 1,363 px for English contact). The Arabic homepage hero and detail image decoded at intrinsic widths 1,250 and 950 px. The visual check used the preview artwork, with the caption visible.

The local Node 24 test suite passed all 16 tests at the time of this review. Tests exercised disposable SQLite state and HTTP CMS workflows, roles and sessions, private and published revisions, stale edits, media validation, archival, opening times and special closures, restored snapshots, cross-locale product search, output escaping, uploaded image mapping, coordinates and contacts.

## First GitHub browser run

On an Ubuntu 24.04 runner, commit `33ef990fea75313132e8f735c57c68f77c63171a` completed the public-site Playwright 1.55.0 matrix with axe-core 4.10.3. All three jobs found layout regressions. Each saved 54 full-page images at 390, 768 and 1440 px. The two desktop homepage review captures are also retained in `qa/evidence`. [Actions result and screenshot archives](https://github.com/ha7n-bot/just-a-space/actions/runs/45933701483)

| Engine | Passed | Failed | Failures |
| --- | ---: | ---: | --- |
| Chromium | 495 | 18 | Enlarged text caused horizontal overflow on all 18 routes at 390 px |
| WebKit | 495 | 18 | Same enlarged-text overflow |
| Firefox | 456 | 57 | 39 normal-width horizontal-overflow failures and 18 at enlarged text |

The 54 desktop axe scans reported zero tagged-rule violations. The fixture browser step was skipped because the preceding checks failed. `qa/evidence/ci-first-run.json` holds the original per-engine failure lists. Re-run on the fixed revision before clearing the gate.

## Local runner limitations

The standalone Python Playwright 1.62 browser matrix was attempted. The Chromium wrapper failed to launch because its executable target was absent. Firefox and WebKit binaries, axe-core and Lighthouse were unavailable. The standalone local launcher therefore produced no server-independent browser matrix. The GitHub run above provides the separate viewport, screenshot and axe results. The desktop browser observations above came from the separate managed Chrome UI. No mobile/cross-browser certification or 95+ score is issued.

Reproduce the full isolated suite with `python qa/run-browser.py --browser chromium --axe /absolute/path/to/axe.min.js` after installing Python Playwright and its browser. Run the Firefox and WebKit variants as well. The GitHub browser workflow contains separate jobs for each engine and retains review artifacts. The managed Chrome language switch successfully navigated from the Arabic to the English homepage.
