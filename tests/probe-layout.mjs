// A probe prints; it does not assert (§11.1 D). Read the table and look for outliers;
// once a number is known-good it graduates into the smoke harness.

import { launch, openPage, horizontalOverflow, tapTargets, primaryAction, WIDTHS, PHONE } from "./browser.mjs";

const ROUTES = ["#/dossier", "#/villain", "#/adventures", "#/record", "#/scene", "#/reveal", "#/lists", "#/arc", "#/ask", "#/meaning", "#/log", "#/rules", "#/tutorial", "#/settings", "#/new"];
const { url, browser, close } = await launch();

for (const seed of ["mid-session", "stress"]) {
  console.log(`\n=== ${seed} ===`);
  console.log("route         viewports  controls  action@  smallest-tap  overflow");
  for (const route of ROUTES) {
    const { page, context } = await openPage(browser, url, { seed, route });
    const height = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
    const controls = await page.$$eval("#screen button, #screen a, #screen input, #screen summary", (n) => n.length);
    const action = await primaryAction(page);
    const taps = await tapTargets(page);
    const smallest = taps.length ? Math.min(...taps.map((t) => t.h)) : "-";
    const over = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: PHONE.height });
      const o = await horizontalOverflow(page);
      if (o.scrollWidth > o.docWidth + 1) over.push(`${width}:${o.scrollWidth}`);
    }
    console.log(
      route.padEnd(13),
      height.toFixed(1).padStart(9),
      String(controls).padStart(9),
      String(action ? `${action.top}px` : "-").padStart(8),
      String(smallest).padStart(13),
      over.length ? over.join(" ") : "none"
    );
    await context.close();
  }
}
await close();
