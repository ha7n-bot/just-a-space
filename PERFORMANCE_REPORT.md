# Performance measurements

Node v24.22.3 on the development Linux runner, empty staging content, 50 warm-up calls and 1,000 measured renders per homepage language. The Arabic home rendered in 0.030 ms median, 0.131 ms p95; English in 0.027 ms median, 0.110 ms p95. These are server template CPU timings only. Reproduce using `node qa/server-lab.mjs`; raw output is in `qa/evidence/server-lab.json`.

| Asset | Bytes on disk |
| --- | ---: |
| Arabic HTML | 6,101 |
| English HTML | 5,513 |
| Public JavaScript | 1,807 |
| CSS | 12,123 |
| Arabic font | 94,572 |
| Hero WebP | 187,092 |
| Detail WebP | 89,412 |

The static byte sizes exclude HTTP overhead and transport compression. Lighthouse was unavailable locally. No numeric Lighthouse score, Web Vitals or production network latency was established. For mobile lab samples, run `python qa/run-browser.py --browser chromium` with a functioning Chromium installation. The five-run cold-context sample measures LCP, CLS and TTFB without network or CPU throttling. Run Lighthouse separately with its documented mobile preset against protected staging. INP and production percentile verification require actual visitors.
