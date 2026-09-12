// Harness B — browser smoke. Boots the app and asserts the measurement contract
// (§6.7) on every route, in the fresh, mid-session and stress states.

import { launch, openPage, strayText, horizontalOverflow, tapTargets, primaryAction,
  buriedControls, explainNote, smallInputs, fixedBarFit, headerFit, WIDTHS, PHONE } from "./browser.mjs";
import { results, report } from "./harness.mjs";

const { routes } = await import("../src/router.js").catch(() => ({ routes: null }));

function check(name, fn) {
  return fn().then(
    () => { results.pass += 1; },
    (err) => { results.fail += 1; results.failures.push({ name, message: err.message }); }
  );
}
function assert(cond, message) { if (!cond) throw new Error(message); }

const ROUTES = [
  "#/dossier", "#/villain", "#/adventures", "#/record", "#/scene", "#/reveal", "#/lists", "#/arc",
  "#/ask", "#/meaning", "#/log", "#/rules", "#/tutorial", "#/settings", "#/new"
];

const { url, browser, close } = await launch();

for (const seed of ["fresh", "mid-session", "stress"]) {
  for (const route of ROUTES) {
    const { page, context, errors } = await openPage(browser, url, { seed, route });
    const label = `${seed} ${route}`;

    await check(`${label}: renders a heading with no console errors`, async () => {
      const heading = await page.textContent("#screen h1");
      assert(heading && heading.trim().length > 0, "no heading");
      assert(errors.length === 0, `console errors: ${errors.join(" | ")}`);
    });

    await check(`${label}: no stray null/undefined/NaN text`, async () => {
      const stray = await strayText(page);
      assert(stray.length === 0, `stray text: ${stray.join(" | ")}`);
    });

    await check(`${label}: an explain() note, collapsed`, async () => {
      const note = await explainNote(page);
      assert(note.present, "no explain() note on this screen");
      assert(!note.open, "the explain note is open by default");
      assert(note.text.trim().split(/\s+/).length > 12, "the explain note is too thin to teach anything");
    });

    await check(`${label}: inputs are at least 16px`, async () => {
      const small = await smallInputs(page);
      assert(small.length === 0, `mobile browsers will zoom on: ${small.join(", ")}`);
    });

    await check(`${label}: no tap target under 40px`, async () => {
      const small = (await tapTargets(page)).filter((t) => t.h < 40);
      assert(small.length === 0, `small targets: ${small.map((t) => `${t.label} ${t.w}x${t.h}`).join(" | ")}`);
    });

    await check(`${label}: the primary action is on screen`, async () => {
      const action = await primaryAction(page);
      if (!action) return;                        // screens without one are allowed
      assert(action.visible, `"${action.label}" is off screen (top ${action.top})`);
    });

    await check(`${label}: nothing is buried under the fixed bars`, async () => {
      const buried = await buriedControls(page);
      assert(buried.length === 0, `buried: ${buried.join(" | ")}`);
    });

    await check(`${label}: the persistent header shows every cell at 360px`, async () => {
      await page.setViewportSize({ width: 360, height: PHONE.height });
      const fit = await headerFit(page);
      assert(fit.clipped.length === 0, `header cells clipped: ${fit.clipped.join(" | ")}`);
      await page.setViewportSize(PHONE);
    });

    await check(`${label}: the tab bar fits its labels at 320px`, async () => {
      await page.setViewportSize({ width: 320, height: PHONE.height });
      const fit = await fixedBarFit(page);
      assert(fit.tight.length === 0, `tabs collide: ${fit.tight.join(" | ")}`);
      await page.setViewportSize(PHONE);
    });

    for (const width of WIDTHS) {
      await check(`${label}: no horizontal overflow at ${width}px`, async () => {
        await page.setViewportSize({ width, height: PHONE.height });
        const overflow = await horizontalOverflow(page);
        assert(overflow.scrollWidth <= overflow.docWidth + 1,
          `scrollWidth ${overflow.scrollWidth} > ${overflow.docWidth}: ${overflow.offenders.join(" | ")}`);
      });
    }
    await context.close();
  }
}

// ------------------------------------------------------------------ the walk
await check("walk: new adventure -> reveal -> dossier -> lead -> arc", async () => {
  const { page, context, errors } = await openPage(browser, url, { seed: "fresh", route: "#/new" });

  await page.fill('input[aria-label="Adventure name"]', "The Dormant Temple");
  await page.fill('input[aria-label="Villain"]', "The Dark Shaman");
  await page.click(".btn-action");                                  // Next
  await page.fill('textarea[aria-label="What your character already knows"]', "The temple in the mountains is active again.");
  await page.click(".btn-action");                                  // Start
  // Poll rather than wait a fixed interval: the hashchange render lands a tick later
  // and a fixed wait manufactures findings (§13 D-15).
  await page.waitForFunction(() => document.querySelector("#screen h1").textContent.includes("Reveal"), null, { timeout: 5000 });

  const headerBefore = await page.textContent(".resource-header");
  assert(/0/.test(headerBefore), "the header starts at zero phases");

  await page.click(".btn-action");                                  // Earn a reveal
  await page.click(".modal-actions .btn-primary");                  // Roll the reveal
  await page.waitForSelector(".modal-card .phase-card");

  const card = await page.textContent(".modal-card .phase-card");
  assert(/End Goal Roll/.test(card), "the result card shows the check");
  assert(/d10/.test(card), "it shows the individual dice");
  assert(/Phase 1/.test(await page.textContent(".modal-title")), "the first reveal is a phase, never the End Goal");

  await page.click(".modal-actions .btn-primary");                  // Write what it means -> dossier
  await page.waitForSelector("#screen .phase-card");

  await page.fill("#screen .phase-card textarea", "The diggers are being paid by someone who is not the shaman.");
  await page.click("#screen .phase-card .leads-block .btn-quiet");  // Add a lead
  await page.fill("#prompt-field", "Who pays the diggers?");
  await page.click(".modal-actions .btn-primary");
  await page.waitForSelector("#screen .lead");

  const header = await page.textContent(".resource-header");
  assert(/1/.test(header), "the header counts the phase");
  const badge = await page.textContent(".tab-bar .tab-badge");
  assert(badge.trim() === "1", "and the open lead is the Dossier tab's badge, not a second header cell");

  await page.goto(`${url}#/arc`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen h1");
  const reason = await page.textContent(".action-reason");
  assert(/End Goal/.test(reason), "the arc refuses to advance and says why");

  assert(errors.length === 0, `console errors during the walk: ${errors.join(" | ")}`);
  await context.close();
});

await check("walk: a reload keeps everything", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/dossier" });
  const before = await page.$$eval("#screen .phase-card", (n) => n.length);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen .phase-card");
  const after = await page.$$eval("#screen .phase-card", (n) => n.length);
  assert(before === after && after >= 3, `phases before ${before}, after ${after}`);
  await context.close();
});

await check("walk: a re-render never re-rolls (the stored dice are the dice)", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/dossier" });
  const first = await page.textContent("#screen .phase-card .dice-row");
  await page.goto(`${url}#/log`, { waitUntil: "domcontentloaded" });
  await page.goto(`${url}#/dossier`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen .phase-card");
  const second = await page.textContent("#screen .phase-card .dice-row");
  assert(first === second, `dice changed on re-render: "${first}" then "${second}"`);
  await context.close();
});

await check("walk: ask the Game Master, and the answer shows its die and its odds", async () => {
  const { page, context, errors } = await openPage(browser, url, { seed: "mid-session", route: "#/ask" });
  await page.fill('input[aria-label="Your question"]', "Is the mine still guarded?");
  await page.click(".odds-row .chip >> nth=3");                 // Likely
  await page.click(".btn-action");
  await page.waitForSelector(".ask-card");
  const card = await page.textContent(".ask-card");
  assert(/Is the mine still guarded\?/.test(card), "the question is on the answer");
  assert(/(Yes|No)/.test(card), "an answer landed");
  assert(/d100/.test(card), "the die is shown");
  assert(/Likely/.test(card), "so are the odds it was read against");
  assert(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await context.close();
});

await check("walk: Discover Meaning rolls one word at a time", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/meaning" });
  await page.click(".btn-action");
  await page.waitForSelector(".reading-card .keyword");
  assert((await page.$$(".reading-card .keyword")).length === 1, "one word after one roll");
  await page.click(".btn-action");
  await page.waitForFunction(() => document.querySelectorAll(".reading-card .keyword").length === 2, null, { timeout: 4000 });
  await context.close();
});

await check("walk: the details step rolls every table picked, each on its own d100", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/villain" });
  const pills = () => page.$$eval(".detail-pill", (n) => n.map((p) => p.textContent.trim()));
  const before = (await pills()).length;

  // one table by default
  await page.click(".crafter-card .btn-primary");
  await page.waitForFunction((n) => document.querySelectorAll(".detail-pill").length === n + 1, before, { timeout: 4000 });

  // pick all seven the Villain Crafter names, and roll them in one press
  const all = await page.$$eval("#screen button", (n) =>
    n.findIndex((b) => /All seven/i.test(b.textContent)));
  assert(all >= 0, "the bulk control is on screen");
  await page.$$eval("#screen button", (n, i) => n[i].click(), all);
  await page.waitForSelector(".crafter-card .btn-primary");
  const label = await page.$eval(".crafter-card .btn-primary", (b) => b.textContent.trim());
  assert(/7 tables/.test(label), `the button says what it will roll, got "${label}"`);

  const now = (await pills()).length;
  await page.click(".crafter-card .btn-primary");
  await page.waitForFunction((n) => document.querySelectorAll(".detail-pill").length === n + 7, now, { timeout: 6000 });

  // seven separate rolls, on seven different tables - not one roll reused
  const tables = await page.$$eval(".detail-pill", (n) => n.slice(-7).map((p) => p.getAttribute("title")));
  assert(new Set(tables).size === 7, `seven distinct tables, got ${tables.join(" | ")}`);
  await context.close();
});

await check("walk: Settings keeps a backup ring you can take, restore and save from", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/settings" });
  const body = await page.textContent("#screen");
  assert(/Backups/.test(body) && /No backups yet/.test(body), "the card is there and empty on a fresh seed");
  const idx = await page.$$eval("#screen button", (n) => n.findIndex((b) => /Back up now/.test(b.textContent)));
  assert(idx >= 0, "there is a Back up now control");
  await page.$$eval("#screen button", (n, i) => n[i].click(), idx);
  await page.waitForSelector(".backup-row", { timeout: 4000 });
  const rows = await page.$$(".backup-row");
  assert(rows.length === 1, "one backup row after one press");
  const labels = await page.$$eval(".backup-row button", (n) => n.map((b) => (b.getAttribute("aria-label") || b.textContent).trim()));
  assert(labels.some((l) => /Restore/.test(l)) && labels.some((l) => /Save to file/.test(l)) && labels.some((l) => /Delete/.test(l)),
    `restore, save and delete are offered: ${labels.join(" | ")}`);
  await context.close();
});

await check("the oracle toggle hides its tab and its routes explain themselves", async () => {
  const settings = { theme: "system", textScale: 1, showGuidance: true, mythicOracle: false };
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/dossier", settings });
  const tabs = await page.$$eval(".tab-bar .tab", (n) => n.map((t) => t.textContent.trim()));
  assert(!tabs.some((t) => /Oracle/i.test(t)), `Oracle tab still shown: ${tabs.join(",")}`);
  await page.goto(`${url}#/ask`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen h1");
  const body = await page.textContent("#screen");
  assert(/switched off/i.test(body), "a gated route reached directly explains itself");
  assert(await page.$("#screen .btn-primary"), "and offers to turn it on in place");
  await context.close();
});

await check("the rules library opens the entry a citation points at", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/rules?entry=end-goal-roll" });
  const open = await page.$eval("#entry-end-goal-roll", (n) => n.open);
  assert(open, "the linked entry is not expanded");
  await context.close();
});

await close();
process.exit(report("smoke") ? 0 : 1);
