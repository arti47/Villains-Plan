// Harness B — browser smoke. Boots the app and asserts the measurement contract
// (§6.7) on every route, in the fresh, mid-session and stress states.

import { launch, openPage, strayText, horizontalOverflow, tapTargets, primaryAction,
  buriedControls, explainNote, smallInputs, WIDTHS, PHONE } from "./browser.mjs";
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
  "#/dossier", "#/adventures", "#/record", "#/reveal", "#/arc",
  "#/log", "#/rules", "#/tutorial", "#/settings", "#/new"
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
  assert(/1/.test(header), "the header counts the phase and the lead");

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

await check("the rules library opens the entry a citation points at", async () => {
  const { page, context } = await openPage(browser, url, { seed: "mid-session", route: "#/rules?entry=end-goal-roll" });
  const open = await page.$eval("#entry-end-goal-roll", (n) => n.open);
  assert(open, "the linked entry is not expanded");
  await context.close();
});

await close();
process.exit(report("smoke") ? 0 : 1);
