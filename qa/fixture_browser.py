"""Exercise the isolated qa/menu-fixture.mjs dataset. Never edits data."""
import argparse
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("url")
parser.add_argument("--browser", default="chromium", choices=("chromium", "firefox", "webkit"))
parser.add_argument("--executable")
args = parser.parse_args()
with sync_playwright() as playwright:
    browser = getattr(playwright, args.browser).launch(executable_path=args.executable)
    page = browser.new_page()
    for lang, term in (("en","QA sample"),("ar","صنف تجريبي")):
        route = f"{args.url.rstrip('/')}/{lang}/menu"
        page.goto(route)
        cards = page.locator("[data-product]:visible")
        assert cards.count() == 2, "Only available, published-priced fixtures appear"
        search = page.locator("[data-search]")
        search.fill(term)
        search.press("Enter")
        expect(cards).to_have_count(1)
        assert cards.count() == 1
        cards.first.click()
        page.wait_for_url("**/menu/qa-sample")
        assert page.locator("h1").inner_text().strip() == term
        sizes = page.locator("[data-size]")
        if sizes.count():
            sizes.select_option(index=1)
        page.goto(route)
        page.locator("[data-category]").select_option("qa-other")
        expect(cards).to_have_count(1)
        assert cards.first.get_attribute("href").endswith("/qa-other-product")
        page.goto(route)
        search.fill("no-such-fixture")
        search.press("Enter")
        expect(cards).to_have_count(0)
        for slug in ("qa-hidden","qa-unpriced"):
            assert page.goto(route + "/" + slug).status == 404
    browser.close()
print("Localized fixture search, category, detail, empty and withdrawal journeys passed.")
