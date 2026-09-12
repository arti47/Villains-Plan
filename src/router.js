// router.js — hash routing, the bottom tab bar, the section nav every multi-route tab
// carries (§6.3.1), and the live-state badges (§6.3.8).

import { el, add, clear, $ } from "./core.js";
import { renderDossier, renderReveal, renderArc, renderResourceHeader } from "./sheet.js";
import { renderAdventures, renderRecord, renderLog, renderLibrary, renderSettings } from "./screens.js";
import { renderWizard, resetWizard } from "./wizard.js";
import { renderAsk, renderMeaning } from "./oracle.js";
import { renderVillain } from "./crafter.js";
import { renderScene, renderLists } from "./scenes.js";
import { renderTutorial } from "./tutorial.js";
import * as store from "./store.js";
import { openLeads, endGoalRevealed, arcStageKey, pivotPhases, canRevealPivot, currentScene } from "./derived.js";
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
  { path: "/villain", tab: "dossier", title: "Craft the villain", render: renderVillain, inPlay: true, section: "Villain" },
  { path: "/adventures", tab: "dossier", title: "Adventures", render: renderAdventures, inPlay: true, section: "Adventures" },
  { path: "/record", tab: "dossier", title: "Session record", render: renderRecord, inPlay: true, section: "Session record" },
  { path: "/scene", tab: "reveal", title: "Scene", render: renderScene, inPlay: true, section: "Scene" },
  { path: "/reveal", tab: "reveal", title: "Reveal", render: renderReveal, inPlay: true, section: "Reveal" },
  { path: "/lists", tab: "reveal", title: "Threads & Characters", render: renderLists, inPlay: true, section: "Lists" },
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
let lastHash = null;      // the hash the last render drew, to tell a move from a redraw

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

/**
 * Re-render the current screen in place, after a control has changed something.
 *
 * This is NOT a navigation, and the difference matters: `render()` resets the scroll
 * position, which is right when you arrive at a screen and wrong when you press a button
 * half a page down. Every control in the app calls this, so treating it as a navigation
 * threw the reader back to the top on every roll (docs/AUDIT.md F47).
 */
export function refresh() { render({ inPlace: true }); }

/** Live state that changes what to do next, as badges on the tabs (§6.3.8). */
function badges() {
  const adv = store.active();
  if (!adv) return {};
  const out = {};
  const leads = openLeads(adv).length;
  if (leads) out.dossier = { text: String(leads), title: `${leads} open lead${leads === 1 ? "" : "s"}` };
  const stage = arcStageKey(adv);
  if (currentScene(adv)) out.reveal = { text: "\u25b6", title: "A scene is running" };
  else if (stage === "discovery" && endGoalRevealed(adv)) out.reveal = { text: "!", title: "The End Goal is out - move the arc on" };
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

/**
 * Who the focused control is, in terms that survive a redraw: its tag, its label, and
 * where it sits among controls with the same label (and the same tag, as a fallback for
 * a label that the press itself changed - "Roll Identity" becoming "Roll 7 tables").
 * Every control in this app is rebuilt on refresh(), so without this a keyboard user
 * pressed a chip and landed on <body>, at the top of the tab order (F55).
 */
// Controls live in three slots - the screen, the pinned action bar, the resource header
// - and all three are rebuilt. The slot is part of the identity, so the action bar's
// "Roll a lieutenant" restores to the action bar's copy, not the card's (the first
// version was scoped to #screen and missed every action-bar press).
const SLOTS = "#screen, #action-slot, #resource-header";
function focusSignature() {
  const node = document.activeElement;
  const slot = node && node !== document.body ? node.closest(SLOTS) : null;
  if (!slot) return null;
  const tag = node.tagName.toLowerCase();
  const label = controlLabel(node);
  const sameTag = Array.from(slot.querySelectorAll(tag));
  const sameLabel = sameTag.filter((n) => controlLabel(n) === label);
  return { slot: `#${slot.id}`, tag, label, nthOfTag: sameTag.indexOf(node), nthOfLabel: sameLabel.indexOf(node) };
}
function controlLabel(node) {
  return (node.getAttribute("aria-label") || node.textContent || node.value || "").trim().slice(0, 60);
}
function restoreFocus(sig) {
  if (!sig) return;
  const slot = $(sig.slot);
  if (!slot) return;
  const sameTag = Array.from(slot.querySelectorAll(sig.tag));
  const sameLabel = sameTag.filter((n) => controlLabel(n) === sig.label);
  const target = sameLabel[sig.nthOfLabel] || sameLabel[0] || sameTag[sig.nthOfTag] || null;
  if (target && target.focus) target.focus({ preventScroll: true });   // scroll is restored separately
}

function render({ inPlace = false } = {}) {
  const { route, params } = parse(location.hash);
  // Read the scroll position BEFORE the screen is emptied: clearing it collapses the
  // page height, and the browser clamps scrollY to the new height immediately.
  const keptScroll = inPlace && location.hash === lastHash ? window.scrollY : null;
  const keptFocus = keptScroll === null ? null : focusSignature();
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
  lastHash = location.hash;
  if (keptScroll === null) {
    screen.scrollTop = 0;
    window.scrollTo(0, 0);
  } else {
    // Restore where the reader was. If the re-render made the page shorter the browser
    // clamps this for us, which is the right answer.
    window.scrollTo(0, keptScroll);
    restoreFocus(keptFocus);
  }
  // afterMount runs last so a deliberate scrollIntoView (a citation link opening its
  // library entry) still wins over the restore.
  if (result.afterMount) result.afterMount();
}

export function start() {
  if (!location.hash) location.hash = DEFAULT;
  window.addEventListener("hashchange", render);
  store.subscribe(() => { /* storage writes re-render explicitly via refresh() */ });
  render();
}

export function routes() { return ROUTES.map((r) => ({ path: r.path, title: r.title, tab: r.tab, section: r.section || null })); }
