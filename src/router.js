// router.js — hash routing, the bottom tab bar, the section nav every multi-route tab
// carries (§6.3.1), and the live-state badges (§6.3.8).

import { el, add, clear, $ } from "./core.js";
import { renderDossier, renderReveal, renderArc, renderResourceHeader } from "./sheet.js";
import { renderAdventures, renderRecord, renderLog, renderLibrary, renderSettings } from "./screens.js";
import { renderWizard, resetWizard } from "./wizard.js";
import { renderAsk, renderMeaning } from "./oracle.js";
import { renderTutorial } from "./tutorial.js";
import * as store from "./store.js";
import { openLeads, endGoalRevealed, arcStageKey, pivotPhases, canRevealPivot } from "./derived.js";
import { Settings } from "./settings.js";

const TABS = [
  { key: "dossier", label: "Dossier", href: "#/dossier" },
  { key: "reveal", label: "Reveal", href: "#/reveal" },
  { key: "oracle", label: "Oracle", href: "#/ask", gated: () => Settings.mythicOracle() },
  { key: "log", label: "Log", href: "#/log" },
  { key: "rules", label: "Rules", href: "#/rules" }
];

const ROUTES = [
  { path: "/dossier", tab: "dossier", title: "Dossier", render: renderDossier, inPlay: true, section: "Dossier" },
  { path: "/adventures", tab: "dossier", title: "Adventures", render: renderAdventures, inPlay: true, section: "Adventures" },
  { path: "/record", tab: "dossier", title: "Session record", render: renderRecord, inPlay: true, section: "Session record" },
  { path: "/reveal", tab: "reveal", title: "Reveal", render: renderReveal, inPlay: true, section: "Reveal" },
  { path: "/arc", tab: "reveal", title: "Arc", render: renderArc, inPlay: true, section: "Arc" },
  { path: "/ask", tab: "oracle", title: "Ask the Game Master", render: renderAsk, inPlay: true, section: "Ask" },
  { path: "/meaning", tab: "oracle", title: "Discover Meaning", render: renderMeaning, inPlay: true, section: "Meaning" },
  { path: "/log", tab: "log", title: "Roll log", render: renderLog, inPlay: true },
  { path: "/rules", tab: "rules", title: "Rules", render: renderLibrary, section: "Library" },
  { path: "/tutorial", tab: "rules", title: "A first session", render: renderTutorial, section: "Tutorial" },
  { path: "/settings", tab: "rules", title: "Settings", render: renderSettings, section: "Settings" },
  { path: "/new", tab: "dossier", title: "Start an adventure", render: renderWizard }   // gone into, not flicked between
];

const DEFAULT = "#/dossier";
let current = null;

function parse(hash) {
  const raw = (hash || "").replace(/^#/, "") || "/dossier";
  const [path, query] = raw.split("?");
  const params = {};
  if (query) for (const [k, v] of new URLSearchParams(query)) params[k] = v;
  const route = ROUTES.find((r) => r.path === path) || ROUTES[0];
  return { route, params };
}

export function go(hash, { force = false } = {}) {
  if (force && location.hash === hash) { render(); return; }
  if (location.hash === hash) { render(); return; }
  location.hash = hash;
}

export function refresh() { render(); }

/** Live state that changes what to do next, as badges on the tabs (§6.3.8). */
function badges() {
  const adv = store.active();
  if (!adv) return {};
  const out = {};
  const leads = openLeads(adv).length;
  if (leads) out.dossier = { text: String(leads), title: `${leads} open lead${leads === 1 ? "" : "s"}` };
  const stage = arcStageKey(adv);
  if (stage === "discovery" && endGoalRevealed(adv)) out.reveal = { text: "!", title: "The End Goal is out - move the arc on" };
  else if (stage === "pivot" && pivotPhases(adv).length === 0 && canRevealPivot(adv).ok) out.reveal = { text: "!", title: "A Plan B is available" };
  else if (stage === "foiling") out.reveal = { text: "•", title: "Foiling the plan" };
  return out;
}

function tabBar(activeTab) {
  const nav = $("#tabs");
  clear(nav);
  const marks = badges();
  for (const tab of TABS) {
    if (tab.gated && !tab.gated()) continue;
    const link = el("a", {
      class: `tab ${tab.key === activeTab ? "on" : ""}`,
      href: tab.href,
      "aria-current": tab.key === activeTab ? "page" : null
    });
    add(link, el("span", { class: "tab-label", text: tab.label }),
      marks[tab.key] ? el("span", { class: "tab-badge", text: marks[tab.key].text, title: marks[tab.key].title }) : null);
    add(nav, link);
  }
}

function sectionNav(route) {
  const siblings = ROUTES.filter((r) => r.tab === route.tab && r.section);
  if (siblings.length < 2) return null;
  const nav = el("nav", { class: "section-nav", "aria-label": "Sections" });
  for (const sib of siblings) {
    add(nav, el("a", {
      class: `pill ${sib.path === route.path ? "on" : ""}`,
      href: `#${sib.path}`,
      "aria-current": sib.path === route.path ? "page" : null
    }, sib.section));
  }
  return nav;
}

function markCurrent(selector, isCurrent) {
  const node = document.querySelector(selector);
  if (!node) return;
  if (isCurrent) node.setAttribute("aria-current", "page");
  else node.removeAttribute("aria-current");
}

function render() {
  const { route, params } = parse(location.hash);
  if (current && current.path === "/new" && route.path !== "/new") resetWizard();
  current = route;

  const screen = $("#screen");
  const headerSlot = $("#resource-header");
  const actionSlot = $("#action-slot");
  clear(screen); clear(headerSlot); clear(actionSlot);

  const adv = store.active();
  const result = route.render(params) || {};

  if (route.inPlay && !result.noHeader && adv) {
    const header = renderResourceHeader(adv);
    if (header) add(headerSlot, header);
  }

  const nav = result.noHeader ? null : sectionNav(route);
  add(screen, nav, result.content);

  if (result.action) {
    add(screen, result.action.spacer);
    add(actionSlot, result.action.bar);
  }

  document.title = `${route.title} · Schemer`;
  markCurrent(".brand", route.path === "/dossier");
  markCurrent('.app-header-actions a[href="#/settings"]', route.path === "/settings");
  tabBar(route.tab);
  screen.scrollTop = 0;
  window.scrollTo(0, 0);
  if (result.afterMount) result.afterMount();
}

export function start() {
  if (!location.hash) location.hash = DEFAULT;
  window.addEventListener("hashchange", render);
  store.subscribe(() => { /* storage writes re-render explicitly via refresh() */ });
  render();
}

export function routes() { return ROUTES.map((r) => ({ path: r.path, title: r.title, tab: r.tab, section: r.section || null })); }
