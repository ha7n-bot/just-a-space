"""Exercise a running staging deployment. Never creates accounts or changes CMS data."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

# A deterministic sample is useful on a private preview with no visitor telemetry.
def inspect_reflow(page):
    return page.evaluate("""() => {
        const out = [];
        for (const node of document.querySelectorAll('main h1, main h2, main p, main a, main button')) {
            if (!node.getClientRects().length) continue;
            const style = getComputedStyle(node);
            if (style.overflowX === 'hidden' && node.scrollWidth > node.clientWidth + 2)
                out.push(node.tagName + ': ' + node.textContent.trim().slice(0, 45));
        }
        return out;
    }""")


ROUTES = ("", "menu", "about", "experience", "gallery", "location", "contact", "privacy", "terms")
WIDTHS = (320, 375, 390, 430, 768, 1024, 1440, 1920)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Origin of the running application")
    parser.add_argument("--browser", choices=("chromium", "firefox", "webkit"), default="chromium")
    parser.add_argument("--executable", help="Optional system browser binary")
    parser.add_argument("--output", default="qa-output")
    parser.add_argument("--axe", help="Local axe-core distribution file")
    args = parser.parse_args()
    base = args.url.rstrip("/")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    checks, times, errors = [], [], []

    def check(name, condition, **context):
        checks.append({"check": name, "pass": bool(condition), **context})

    with sync_playwright() as p:
        browser = getattr(p, args.browser).launch(executable_path=args.executable)
        context = browser.new_context(bypass_csp=bool(args.axe), reduced_motion="reduce", viewport={"width": 1440, "height": 960})
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        for lang in ("ar", "en"):
            for route in ROUTES:
                path = f"/{lang}" + (f"/{route}" if route else "")
                response = page.goto(base + path, wait_until="load")
                page.evaluate("document.fonts.ready")
                check("HTTP 200", response.status == 200, path=path, actual=response.status)
                check("language", page.locator("html").get_attribute("lang") == lang, path=path)
                check("direction", page.locator("html").get_attribute("dir") == ("rtl" if lang == "ar" else "ltr"), path=path)
                check("one visible h1", page.locator("h1:visible").count() == 1, path=path)
                check("skip link target", page.locator('a[href^="#"]').evaluate_all("""anchors=>anchors.some(a=> {const t=document.getElementById(a.hash.slice(1));return t && (t.matches('main') || t.contains(document.querySelector('main')));})"""), path=path)
                check("one main landmark", page.locator("main").count() == 1, path=path)
                check("nonempty page title", bool(page.title().strip()), path=path)
                check("complete images", page.locator("img").evaluate_all(
                    "(images)=>images.every(i=>i.hasAttribute('alt') && (i.loading==='lazy'||i.naturalWidth>0))"), path=path)
                for width in WIDTHS:
                    page.set_viewport_size({"width": width, "height": 900 if width >= 768 else 844})
                    overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
                    check("horizontal overflow", overflow <= 1, path=path, width=width, overflow=overflow)
                    clipped = inspect_reflow(page)
                    check("text clipping", not clipped, path=path, width=width, clipped=clipped)
                    if width in (390, 768, 1440):
                        page.screenshot(path=output / f"{lang}-{route or 'home'}-{width}.png", full_page=True, animations="disabled")
                page.set_viewport_size({"width": 390, "height": 844})
                page.evaluate("document.documentElement.style.setProperty('font-size','200%','important')")
                check("enlarged text overflow", page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), path=path)
                page.evaluate("document.documentElement.style.removeProperty('font-size')")
                page.set_viewport_size({"width": 1440, "height": 960})
                if route == "":
                    page.set_viewport_size({"width": 375, "height": 812})
                    drawer = page.locator("details.mobile-nav:visible")
                    if drawer.count():
                        summary = drawer.locator("summary")
                        summary.focus()
                        page.keyboard.press("Enter")
                        check("keyboard opens mobile navigation", drawer.evaluate("el=>el.open"), path=path)
                        check("mobile menu destination visible", drawer.locator(f'a[href="/{lang}/menu"]:visible').count() > 0, path=path)
                        summary.focus()
                        page.keyboard.press("Enter")
                        check("keyboard closes navigation", not drawer.evaluate("el=>el.open"), path=path)
                    page.set_viewport_size({"width": 1440, "height": 960})
                if args.axe:
                    page.add_script_tag(path=args.axe)
                    result = page.evaluate("""async()=>{let r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))}""")
                    check("axe WCAG tagged rules", not result, path=path, violations=result)
                times.append({"path": path, **page.evaluate("""()=>{let n=performance.getEntriesByType('navigation')[0];return {ttfb_ms:n.responseStart,dom_loaded_ms:n.domContentLoadedEventEnd,bytes:n.transferSize}}""")})
                other = "en" if lang == "ar" else "ar"
                alternate = path.replace("/" + lang, "/" + other, 1)
                switch = page.locator('[data-lang-switch]').filter(visible=True)
                # A navigation link to another locale must be actionable.
                check("language counterpart", switch.count() > 0, path=path, target=alternate)
                if switch.count():
                    switch.first.click()
                    check("language switch destination", urlparse(page.url).path.rstrip("/") == alternate.rstrip("/"), path=path)
            missing = page.goto(base + f"/{lang}/not-a-real-page")
            check("localized 404", missing.status == 404 and page.locator("html").get_attribute("lang") == lang, lang=lang)
        check("uncaught browser errors", not errors, errors=errors)
        summary = {"version": browser.version, "engine": args.browser, "checks": checks, "navigation_samples": times}
        (output / "results.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False))
        browser.close()
    failures = [entry for entry in checks if not entry["pass"]]
    print(json.dumps({"passed": len(checks) - len(failures), "failed": len(failures), "failures": failures}, ensure_ascii=False))
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())
