// Tap counts for the sequences a session actually repeats (§11.1 D).

import { launch, openPage } from "./browser.mjs";

const { url, browser, close } = await launch();

async function count(name, seed, route, steps) {
  const { page, context, errors } = await openPage(browser, url, { seed, route });
  let taps = 0;
  const hashes = [route];
  for (const step of steps) {
    await step(page);
    taps += 1;
    const hash = await page.evaluate(() => location.hash);
    if (hash !== hashes[hashes.length - 1]) hashes.push(hash);
  }
  console.log(`${name.padEnd(38)} ${String(taps).padStart(2)} taps   routes: ${hashes.join(" -> ")}${errors.length ? `   ERRORS ${errors.length}` : ""}`);
  await context.close();
}

const click = (sel) => async (page) => { await page.click(sel); await page.waitForTimeout(120); };

console.log("sequence                               taps   route changes");
await count("earn a reveal and read it", "mid-session", "#/reveal", [
  click(".btn-action"),
  click(".modal-actions .btn-primary"),
  click(".modal-actions .btn-primary")
]);

await count("add a lead to the newest reveal", "mid-session", "#/dossier", [
  click("#screen .phase-card .leads-block .btn-quiet"),
  async (page) => { await page.fill("#prompt-field", "Follow the ore"); await page.click(".modal-actions .btn-primary"); }
]);

await count("resolve a lead", "mid-session", "#/dossier", [
  click("#screen .lead .check-row")
]);

await count("start a new adventure", "stress", "#/adventures", [
  click(".btn-action"),
  async (page) => { await page.fill('input[aria-label="Adventure name"]', "New"); await page.click(".btn-action"); },
  click(".btn-action")
]);

await count("switch to another adventure", "stress", "#/adventures", [
  click("#screen .adventure-row:nth-child(3) .btn-primary")
]);

await count("check the roll distribution", "stress", "#/log", [
  click("#screen details.fold summary")
]);

await close();
