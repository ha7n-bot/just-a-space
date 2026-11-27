# Performance measurements

Node v24.22.3 on the development Linux runner, empty staging content, 50 warm-up calls and 1,000 measured renders per homepage language. The Arabic home rendered in 0.029 ms median, 0.105 ms p95; English in 0.027 ms median, 0.052 ms p95. These are server template CPU timings only. Reproduce using `node qa/server-lab.mjs`; raw output is in `qa/evidence/server-lab.json`.

| Asset | Bytes on disk |
| --- | ---: |
| Arabic HTML | 6,101 |
| English HTML | 5,513 |
| Public JavaScript | 1,807 |
| CSS | 13,045 |
| Arabic font | 94,572 |
| Hero WebP | 187,092 |
| Detail WebP | 89,412 |

The static byte sizes exclude HTTP overhead and transport compression.

## Lighthouse mobile lab

GitHub Actions completed Lighthouse 12.8.2 on Ubuntu 24.04, with one cold mobile default audit per locale against the Node deployment entry point on loopback. No production domain, CDN, live customers or deployed database was involved. Search indexing remained disabled on these staging pages. Revision `47e8d138ff1d7379e1719bbb305de28cd4df3247`. [Job and settings](https://github.com/ha7n-bot/just-a-space/actions/runs/45934052702) · [Raw audit JSON for both languages](https://github.com/ha7n-bot/just-a-space/actions/runs/45934052702/artifacts/15169791794)

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Arabic home | 99 | 100 | 96 | 66 | 1.879 s | 0.00443 | 0 ms |
| English home | 99 | 100 | 96 | 66 | 1.954 s | 0.000038 | 0 ms |

Both homepages met the 95-point target for the first three categories. SEO missed the target with the staging indexing restrictions in force. The LCP and CLS thresholds were met in these individual lab samples. TBT is a lab diagnostic; no INP or field percentile was measured. After launch authorization, run the same tests against the production domain and confirm canonical/hreflang, crawlability and resource delivery. Verify actual user experience with field data once sufficient traffic exists.
