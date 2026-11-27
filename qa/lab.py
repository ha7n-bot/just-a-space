"""Cold-context mobile lab sample. Timing numbers depend on hardware and runner load."""
import argparse
import json
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("url")
parser.add_argument("--executable")
parser.add_argument("--output", default="qa-output/lab.json")
args=parser.parse_args()
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.executable)
    result = {"browser":browser.version,"viewport":"390x844, device scale 1","network":"no throttling, loopback","samples":{}}
    for lang in ("ar", "en"):
        samples = []
        for _ in range(5):
            ctx = browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
            pg = ctx.new_page()
            pg.add_init_script("""window.sampleCLS=0;window.sampleLCP=null;
new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.sampleCLS+=e.value})).observe({type:'layout-shift',buffered:true});
new PerformanceObserver(l=>l.getEntries().forEach(e=>window.sampleLCP=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});""")
            pg.goto(f"{args.url.rstrip('/')}/{lang}",wait_until="networkidle")
            pg.evaluate("document.fonts.ready")
            pg.wait_for_function("window.sampleLCP !== null")
            samples.append(pg.evaluate("""()=>({LCP:sampleLCP,CLS:sampleCLS,TTFB:performance.getEntriesByType('navigation')[0].responseStart,decodedResourceBytes:performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.decodedBodySize,0)})"""))
            ctx.close()
        result["samples"][lang] = {"runs":samples,"median":{k:statistics.median(r[k] for r in samples) for k in samples[0]}}
    browser.close()
path=Path(args.output)
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(result,indent=2))
print(json.dumps({lang:d["median"] for lang,d in result["samples"].items()}))
