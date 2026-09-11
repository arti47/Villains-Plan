// Harness C — the interaction audit. Visits every route and clicks every visible
// control in isolation, resetting between clicks, and flags three things: a JS error,
// a control that cannot be clicked, and a control that changes nothing (§11.1 C).

import { launch, openPage } from "./browser.mjs";
import { results, report } from "./harness.mjs";

const ROUTES = ["#/dossier", "#/villain", "#/adventures", "#/record", "#/reveal", "#/arc", "#/ask", "#/meaning", "#/log", "#/rules", "#/tutorial", "#/settings", "#/new"];
const SEED = "mid-session";

// Controls that are meant to do nothing where they are: the current tab, the current
// section pill, and the skip link (it only moves focus).
const EXPECTED_NOOP = (info) => info.current;   // the current tab, pill or pressed chip

const { url, browser, close } = await launch();

const SELECTOR = "button, a[href], summary, input[type=checkbox], .chip, .pill";

function visibleControls() {
  // Defined here and injected, so the probe pass and the click pass enumerate
  // identically. Off-canvas controls (the skip link) are not visible controls.
  const nodes = Array.from(document.querySelectorAll("button, a[href], summary, input[type=checkbox], .chip, .pill"));
  return nodes.filter((n) => {
    const r = n.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (r.right <= 0 || r.left >= document.documentElement.clientWidth) return false;
    if (n.closest("details:not([open])") && n.tagName !== "SUMMARY") return false;
    return true;
  });
}

async function controlsOn(page) {
  return page.evaluate((fnBody) => {
    const visibleControls = new Function(`return (${fnBody})`)();
    return visibleControls().map((n, i) => ({
      index: i,
      tag: n.tagName.toLowerCase(),
      label: (n.getAttribute("aria-label") || n.textContent || n.value || "").trim().slice(0, 44),
      classes: (n.className || "").toString(),
      current: n.getAttribute("aria-current") === "page" || n.getAttribute("aria-pressed") === "true",
      disabled: !!n.disabled
    }));
  }, visibleControls.toString());
}

/** Mark the nth visible control so the click pass hits exactly what the probe saw. */
async function markControl(page, index) {
  return page.evaluate(({ fnBody, index }) => {
    const visibleControls = new Function(`return (${fnBody})`)();
    const node = visibleControls()[index];
    if (!node) return false;
    node.setAttribute("data-audit-target", "1");
    return true;
  }, { fnBody: visibleControls.toString(), index });
}

async function snapshot(page) {
  return page.evaluate(() => ({
    screen: document.querySelector("#screen").innerHTML.replace(/ data-audit-target="1"/g, "").length + ":" + document.querySelector("#screen").textContent.slice(0, 400),
    hash: location.hash,
    store: window.localStorage.getItem("schemer.v1") || "",
    settings: window.localStorage.getItem("schemer.settings.v1") || "",
    modal: !!document.querySelector(".modal-overlay"),
    toast: !!document.querySelector(".toast"),
    theme: document.documentElement.getAttribute("data-theme") || "",
    open: Array.from(document.querySelectorAll("details")).map((d) => (d.open ? 1 : 0)).join("")
  }));
}

const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

for (const route of ROUTES) {
  const probe = await openPage(browser, url, { seed: SEED, route });
  const controls = await controlsOn(probe.page);
  await probe.context.close();

  for (const info of controls) {
    const name = `${route} [${info.index}] ${info.tag} "${info.label}"`;
    const { page, context, errors } = await openPage(browser, url, { seed: SEED, route });
    try {
      const marked = await markControl(page, info.index);
      if (!marked) throw new Error("the control vanished between passes");
      const handle = await page.$('[data-audit-target="1"]');
      const before = await snapshot(page);
      if (info.disabled) {
        // a disabled control must explain itself somewhere on the screen
        const reason = await page.$(".action-reason, .refusal");
        if (!reason) throw new Error("disabled with no reason on screen");
        results.pass += 1;
        await context.close();
        continue;
      }
      await handle.click({ timeout: 2000 });

      // poll for a change rather than waiting a fixed interval (§13 D-15)
      let after = before; let same = true;
      for (let i = 0; i < 20 && same; i += 1) {
        after = await snapshot(page);
        same = !changed(before, after);
        if (same) await page.waitForTimeout(40);
      }

      if (errors.length) throw new Error(`JS error: ${errors.join(" | ")}`);
      if (same && !EXPECTED_NOOP(info)) throw new Error("clicking it changed nothing");
      results.pass += 1;
    } catch (err) {
      results.fail += 1;
      results.failures.push({ name, message: err.message });
    }
    await context.close();
  }
}

await close();
process.exit(report("interaction") ? 0 : 1);
