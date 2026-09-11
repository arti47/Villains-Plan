// Shared browser scaffolding for the smoke, interaction and probe harnesses.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { serve } from "./serve.mjs";

export const WIDTHS = [320, 360, 390];
export const PHONE = { width: 390, height: 780 };

export function fixture(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
}

export async function launch() {
  const { server, url } = await serve(0);
  const browser = await chromium.launch();
  return {
    url, browser,
    async close() { await browser.close(); server.close(); }
  };
}

/** A page with a seeded store, the app booted, and console errors collected. */
export async function openPage(browser, url, { seed = "fresh", route = "#/dossier", viewport = PHONE, settings = null } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const state = seed === null ? null : fixture(seed);
  await page.addInitScript(({ state, settings }) => {
    try {
      if (state) window.localStorage.setItem("schemer.v1", JSON.stringify({
        version: state.schema || 1,
        activeAdventureId: state.activeAdventureId,
        adventures: state.adventures || [],
        rollLog: state.rollLog || []
      }));
      else window.localStorage.clear();
      if (settings) window.localStorage.setItem("schemer.settings.v1", JSON.stringify(settings));
    } catch { /* ignore */ }
  }, { state, settings });

  await page.goto(`${url}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen h1", { timeout: 5000 });
  page.__errors = errors;
  return { page, context, errors };
}

/** Text nodes that read as a bug: null, undefined, NaN, [object Object] (D-1). */
export async function strayText(page) {
  return page.evaluate(() => {
    const bad = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const re = /(^|\s)(null|undefined|NaN|\[object Object\])(\s|$|[.,)])/;
    while (walker.nextNode()) {
      const text = walker.currentNode.nodeValue || "";
      if (re.test(text)) bad.push(text.trim().slice(0, 80));
    }
    return bad;
  });
}

export async function horizontalOverflow(page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const overflow = [];
    if (document.documentElement.scrollWidth > docWidth + 1) {
      for (const node of document.querySelectorAll("body *")) {
        const r = node.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > docWidth + 1 || r.left < -1) {
          const style = getComputedStyle(node);
          // an element inside its own horizontal scroller is allowed (tables, diagrams)
          let parent = node.parentElement; let scrollable = false;
          while (parent) { if (["auto", "scroll"].includes(getComputedStyle(parent).overflowX)) { scrollable = true; break; } parent = parent.parentElement; }
          if (!scrollable && style.position !== "fixed") {
            overflow.push(`${node.tagName.toLowerCase()}.${(node.className || "").toString().split(" ")[0]} right=${Math.round(r.right)}`);
          }
        }
      }
    }
    return { docWidth, scrollWidth: document.documentElement.scrollWidth, offenders: overflow.slice(0, 6) };
  });
}

/** Effective tap target of every checkbox, measured on the wrapping label (§6.3.10). */
export async function tapTargets(page) {
  return page.evaluate(() => {
    const out = [];
    for (const box of document.querySelectorAll('input[type="checkbox"]')) {
      const target = box.closest("label") || box;
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      out.push({ label: (target.textContent || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out;
  });
}

/** Is the screen's primary action reachable without scrolling? (§6.3.2) */
export async function primaryAction(page) {
  return page.evaluate(() => {
    const bar = document.querySelector("#action-slot .action-bar .btn-action");
    if (!bar) return null;
    const r = bar.getBoundingClientRect();
    return {
      label: bar.textContent.trim(),
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      visible: r.top >= 0 && r.bottom <= window.innerHeight + 1,
      disabled: bar.disabled
    };
  });
}

/** Anything sitting under the fixed tab bar, excluding collapsed panels. */
export async function buriedControls(page) {
  return page.evaluate(() => {
    const tabs = document.querySelector(".tab-bar").getBoundingClientRect();
    const actionBar = document.querySelector("#action-slot .action-bar");
    const actionTop = actionBar ? actionBar.getBoundingClientRect().top : tabs.top;
    const limit = Math.min(tabs.top, actionTop);
    const buried = [];
    for (const node of document.querySelectorAll("#screen button, #screen a, #screen input, #screen textarea, #screen summary")) {
      if (node.closest("details:not([open])") && node.tagName !== "SUMMARY") continue;
      const r = node.getBoundingClientRect();
      if (r.height === 0) continue;
      const docBottom = document.documentElement.scrollHeight;
      const absoluteBottom = r.bottom + window.scrollY;
      // only a control at the very end of the document can be "under" the bars
      if (absoluteBottom > docBottom - 4 && r.top < limit && r.bottom > limit) {
        buried.push(`${node.tagName.toLowerCase()} "${(node.textContent || "").trim().slice(0, 30)}"`);
      }
    }
    return buried;
  });
}

/** The fixed bars are excluded from the document overflow check, so measure them here. */
export async function fixedBarFit(page) {
  return page.evaluate(() => {
    const bar = document.querySelector(".tab-bar");
    const tabs = Array.from(bar.querySelectorAll(".tab"));
    const width = bar.getBoundingClientRect().width;
    let content = 0;
    const tight = [];
    for (const tab of tabs) {
      const label = tab.querySelector(".tab-label");
      const badge = tab.querySelector(".tab-badge");
      const inFlow = badge && getComputedStyle(badge).position !== "absolute";
      const need = label.scrollWidth + (inFlow ? badge.getBoundingClientRect().width + 6 : 0);
      content += need;
      const box = tab.getBoundingClientRect();
      // labels must not touch: at least 4px of slack inside each tab
      if (need > box.width - 4) tight.push(`${label.textContent.trim()} needs ${Math.ceil(need)} in ${Math.floor(box.width)}`);
    }
    return { width: Math.round(width), content: Math.round(content), tabs: tabs.length, tight };
  });
}

/** The persistent header scrolls, but a clipped cell reads as broken. Measure it. */
export async function headerFit(page) {
  return page.evaluate(() => {
    const header = document.querySelector(".resource-header");
    if (!header) return { cells: 0, clipped: [] };
    const box = header.getBoundingClientRect();
    const clipped = [];
    for (const cell of header.querySelectorAll(".stat-link")) {
      const r = cell.getBoundingClientRect();
      if (r.right > box.right + 1 || r.left < box.left - 1) {
        clipped.push((cell.textContent || "").trim().slice(0, 24));
      }
    }
    return { cells: header.querySelectorAll(".stat-link").length, clipped };
  });
}

export async function explainNote(page) {
  return page.evaluate(() => {
    const note = document.querySelector("#screen details.explain");
    if (!note) return { present: false };
    return { present: true, open: note.open, text: (note.querySelector("p") || {}).textContent || "" };
  });
}

export async function smallInputs(page) {
  return page.evaluate(() => {
    const out = [];
    for (const node of document.querySelectorAll("#screen input:not([type=checkbox]), #screen textarea, #screen select")) {
      const size = parseFloat(getComputedStyle(node).fontSize);
      if (size < 16) out.push(`${node.tagName.toLowerCase()} ${size}px`);
    }
    return out;
  });
}
