// screens.js — the adventure list, the roll log, the rules library, the session
// record and settings.

import { el, add, formatDate, formatTime, plural, truncate, $, APP } from "./core.js";
import {
  explain, actionBar, card, citeLink, diePill, emptyState, confirmModal,
  showToast, modal, promptModal, checkRow, inlineRow
} from "./ui.js";
import { libraryGroups, searchLibrary, libraryEntry, examples, arcStage, source } from "./rules.js";
import { headerStats, phaseCount } from "./derived.js";
import * as store from "./store.js";
import { Settings, apply as applySettings } from "./settings.js";
import { NOT_IN_SOURCE, LOG_CAP } from "../data.js";
import { stillNotInSource, mythicSource, crafterSource, elementsSource, scenesSource, notSupplied } from "./rules.js";
import { chartsCard } from "./oracle.js";
import { refresh, go } from "./router.js";

const PAGE = 25;   // lists page rather than grow without bound (§6.5)

// ------------------------------------------------------------------ adventures
export function renderAdventures() {
  const content = el("div", {});
  add(content, el("h1", { text: "Adventures" }),
    explain("Every villain you have run, newest first. Concluded adventures stay here as records - the dossier reads back exactly as you left it. Tap one to make it the adventure the rest of the app is about."));

  const list = store.adventures();
  const activeId = store.activeId();
  if (!list.length) {
    add(content, emptyState("Nothing here yet.", "Start an adventure", "#/new"));
  } else {
    for (const adv of list) {
      const stats = headerStats(adv);
      const box = el("article", { class: `card adventure-row ${adv.id === activeId ? "current" : ""}` });
      const head = el("div", { class: "adventure-head" });
      add(head,
        el("h2", { class: "adventure-name", text: adv.name }),
        adv.id === activeId ? el("span", { class: "badge", text: "current" }) : null);
      add(box, head);
      add(box, el("p", { class: "adventure-meta", text: [
        adv.villain.name || "villain unnamed",
        arcStage(stats.stage).label,
        plural(stats.phases, "phase", "phases"),
        stats.endGoalRevealed ? "End Goal known" : "End Goal unknown",
        `started ${formatDate(adv.createdAt)}`
      ].join(" · ") }));
      const actions = el("div", { class: "row-actions" });
      add(actions,
        adv.id === activeId
          ? el("a", { class: "btn btn-primary", href: "#/dossier" }, "Open the dossier")
          : el("button", { class: "btn btn-primary", type: "button", onclick: () => { store.setActive(adv.id); showToast(`"${adv.name}" is now current.`); go("#/dossier"); } }, "Make current"),
        el("button", { class: "btn btn-quiet", type: "button", onclick: () => renameAdventure(adv) }, "Rename"),
        el("button", { class: "btn btn-quiet", type: "button", onclick: () => exportOne(adv) }, "Export"),
        el("button", { class: "btn btn-danger-quiet", type: "button", onclick: () => removeAdventure(adv) }, "Delete"));
      add(box, actions);
      add(content, box);
    }
  }

  const action = actionBar({ label: "New adventure", context: plural(list.length, "adventure", "adventures"), onClick: () => go("#/new") });
  return { content, action };
}

function renameAdventure(adv) {
  promptModal({
    title: "Rename the adventure",
    label: "Name",
    value: adv.name,
    confirmLabel: "Rename",
    onConfirm: (name) => {
      if (!String(name || "").trim()) { showToast("A name is needed.", "warn"); return; }
      store.updateAdventure(adv.id, { name: name.trim() });
      refresh();
      showToast("Renamed.");
    }
  });
}

function exportOne(adv) {
  const body = el("div", {});
  const text = store.exportText(adv.id);
  const area = el("textarea", { class: "export-area", rows: 14, readonly: true, "aria-label": "Readable dossier" });
  area.value = text;
  add(body, el("p", { text: "A readable copy of the dossier - select it and copy, or use Settings to export every adventure as JSON." }), area);
  modal({ title: adv.name, body, size: "modal-wide", actions: [
    { label: "Copy", onClick: () => { area.select(); try { document.execCommand("copy"); showToast("Copied."); } catch { showToast("Select the text and copy it."); } return true; } },
    { label: "Close" }
  ] });
}

function removeAdventure(adv) {
  confirmModal({
    title: `Delete "${adv.name}"?`,
    message: "This removes the adventure from this browser.",
    loss: `Its ${plural(phaseCount(adv), "phase", "phases")}, every reading you wrote, its leads and its roll-log entries go with it. One step of undo is kept, but export it first if you want it back later.`,
    confirmLabel: "Delete",
    onConfirm: () => { store.deleteAdventure(adv.id); refresh(); showToast(`"${adv.name}" deleted.`); }
  });
}

// ------------------------------------------------------------------ session record
let recordPage = 1;

export function renderRecord() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Session record" }),
    explain("What happened, in order: reveals earned, arcs crossed, pivots rolled. The roll log answers what you rolled; this answers how the adventure went, which is the thing you need when you come back to it in three weeks."));

  if (!adv) { add(content, emptyState("No adventure yet.", "Start an adventure", "#/new")); return { content }; }

  const rows = store.sessionRecord(adv.id);
  if (!rows.length) { add(content, emptyState("Nothing recorded yet. It fills itself as you play.")); return { content }; }

  const shown = rows.slice(0, recordPage * PAGE);
  const list = el("ol", { class: "record-list" });
  for (const row of shown) {
    const item = el("li", { class: `record-row kind-${row.kind}` });
    add(item, el("span", { class: "record-time", text: `${formatDate(row.ts)} ${formatTime(row.ts)}` }), el("span", { class: "record-text", text: row.text }));
    add(list, item);
  }
  add(content, list);
  if (rows.length > shown.length) {
    add(content, el("button", {
      class: "btn btn-quiet", type: "button", onclick: () => { recordPage += 1; refresh(); }
    }, `Show ${Math.min(PAGE, rows.length - shown.length)} more of ${rows.length}`));
  }
  return { content };
}

// ------------------------------------------------------------------ roll log
let logFilter = { adventureOnly: true, kind: "" };
let logPage = 1;

export function renderLog() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Roll log" }),
    explain("Every die this app has rolled, with the table it was read on and what it produced, newest first. It is here so a suspicious table can check the app instead of arguing about it - the distribution view counts faces across the campaign. Rolls happen once and are stored; nothing re-rolls behind your back."));

  const controls = el("div", { class: "log-controls" });
  add(controls,
    checkRow({
      label: "This adventure only",
      checked: logFilter.adventureOnly,
      onChange: (v) => { logFilter.adventureOnly = v; logPage = 1; refresh(); }
    }));
  const kinds = [["", "Everything"], ["phase", "Phases"], ["endgoal", "End Goals"], ["pivot", "Pivots"], ["keywords", "Keyword re-rolls"]];
  const kindRow = el("div", { class: "chip-row" });
  for (const [key, label] of kinds) {
    add(kindRow, el("button", {
      class: `chip ${logFilter.kind === key ? "on" : ""}`, type: "button",
      "aria-pressed": logFilter.kind === key ? "true" : "false",
      onclick: () => { logFilter.kind = key; logPage = 1; refresh(); }
    }, label));
  }
  add(controls, kindRow);
  add(content, controls);

  const filter = {};
  if (logFilter.adventureOnly && adv) filter.adventureId = adv.id;
  if (logFilter.kind) filter.kind = logFilter.kind;
  const rows = store.rollLog(filter);

  add(content, distributionCard(filter));

  if (!rows.length) {
    add(content, emptyState("No rolls yet.", adv ? "Earn a reveal" : "Start an adventure", adv ? "#/reveal" : "#/new"));
    return { content };
  }

  const shown = rows.slice(0, logPage * PAGE);
  const list = el("ol", { class: "log-list" });
  for (const row of shown) {
    const item = el("li", { class: `log-row kind-${row.kind}` });
    const dice = el("div", { class: "dice-row" });
    for (const die of row.dice || []) add(dice, diePill(die));
    add(item,
      el("div", { class: "log-head" },
        el("span", { class: "log-outcome", text: row.outcome || row.kind }),
        el("span", { class: "log-time", text: `${formatDate(row.ts)} ${formatTime(row.ts)}` })),
      dice,
      row.summary ? el("p", { class: "log-summary", text: row.summary }) : null);
    add(list, item);
  }
  add(content, list);

  if (rows.length > shown.length) {
    add(content, el("button", {
      class: "btn btn-quiet", type: "button", onclick: () => { logPage += 1; refresh(); }
    }, `Show ${Math.min(PAGE, rows.length - shown.length)} more of ${rows.length}`));
  }
  add(content, el("p", { class: "block-note", text: `The log keeps the most recent ${LOG_CAP} rolls.` }));
  add(content, el("button", {
    class: "btn btn-danger-quiet", type: "button",
    onclick: () => confirmModal({
      title: "Clear the roll log?",
      message: "This empties the log for every adventure.",
      loss: `All ${store.rollLog().length} recorded rolls and the distribution built from them are lost. Dossiers keep their own dice, so the reveals themselves survive. One step of undo is kept.`,
      confirmLabel: "Clear the log",
      onConfirm: () => { store.clearLog(); refresh(); showToast("Roll log cleared."); }
    })
  }, "Clear the log"));
  return { content };
}

function distributionCard(filter) {
  const dist = store.logDistribution(filter);
  const box = el("details", { class: "card fold" });
  add(box, el("summary", { text: `Distribution (${plural(dist.rolls, "roll", "rolls")})` }));
  if (!dist.rolls) { add(box, el("p", { class: "block-note", text: "Nothing rolled yet." })); return box; }

  const bars = (counts, total, label, labeller) => {
    const wrap = el("div", { class: "dist" });
    add(wrap, el("h4", { class: "block-title", text: label }));
    const max = Math.max(1, ...counts);
    counts.forEach((count, i) => {
      const row = el("div", { class: "dist-row" });
      add(row,
        el("span", { class: "dist-face", text: labeller(i) }),
        el("span", { class: "dist-bar", style: `width:${Math.round((count / max) * 100)}%` }),
        el("span", { class: "dist-count", text: String(count) }));
      add(wrap, row);
    });
    add(wrap, el("p", { class: "block-note", text: `${total} d${label.includes("d10") ? "10" : "100"} rolls, expected ${Math.round(total / counts.length)} per row.` }));
    return wrap;
  };

  if (dist.d10Total) add(box, bars(dist.d10, dist.d10Total, "d10 faces (End Goal Roll)", (i) => String(i + 1)));
  if (dist.d100Total) add(box, bars(dist.d100Deciles, dist.d100Total, "d100 in tens (tables)", (i) => `${i * 10 + 1}-${(i + 1) * 10}`));
  return box;
}

// ------------------------------------------------------------------ rules library
let librarySearch = "";

export function renderLibrary(params = {}) {
  const content = el("div", {});
  add(content, el("h1", { text: "Rules" }),
    explain("One entry per rule the app runs, in the app's own words, with the page it came from. Search opens the matches. Everything automated on another screen links back here, and the last group is an honest list of what this app deliberately does not do."));

  const search = el("input", { type: "search", placeholder: "Search the rules", "aria-label": "Search the rules", class: "search" });
  search.value = librarySearch;
  search.addEventListener("input", () => { librarySearch = search.value; renderLibraryBody(body, params); });
  add(content, search);

  const body = el("div", { class: "library" });
  add(content, body);
  renderLibraryBody(body, params);

  add(content, chartsCard(), notInSourceCard(), examplesCard(), sourceCard());
  return { content, afterMount: () => focusEntry(params.entry) };
}

function renderLibraryBody(mount, params) {
  mount.textContent = "";
  const matches = librarySearch ? searchLibrary(librarySearch) : null;
  if (matches && !matches.length) {
    add(mount, el("p", { class: "block-note", text: `Nothing matches "${librarySearch}".` }));
    return;
  }
  for (const group of libraryGroups()) {
    const entries = matches ? group.entries.filter((e) => matches.includes(e)) : group.entries;
    if (!entries.length) continue;
    // each group is a fold: open while searching, or when it holds the entry a citation
    // pointed at. The library was 4.7 viewports under stress with every group flat.
    const holdsTarget = entries.some((e) => e.id === params.entry);
    const groupBox = el("details", { class: "library-group", open: matches || holdsTarget ? true : undefined });
    add(groupBox, el("summary", { class: "group-title", text: `${group.label} (${entries.length})` }));
    for (const entry of entries) {
      const item = el("details", { class: "library-entry", id: `entry-${entry.id}` });
      if (matches || params.entry === entry.id) item.open = true;
      add(item, el("summary", { text: entry.title }), el("p", { text: entry.body }),
        entry.cite ? el("p", { class: "source-cite", text: entry.cite }) : null);
      add(groupBox, item);
    }
    add(mount, groupBox);
  }
}

function focusEntry(id) {
  if (!id) return;
  const node = $(`#entry-${id}`);
  if (!node) return;
  const group = node.closest("details.library-group");
  if (group) group.open = true;
  node.open = true;
  node.scrollIntoView({ block: "center", behavior: "auto" });
  node.classList.add("flash");
  setTimeout(() => node.classList.remove("flash"), 1600);
}

function notInSourceCard() {
  const box = el("details", { class: "card fold not-in-source" });
  add(box, el("summary", { text: "What this app does not do" }));
  const gaps = stillNotInSource();
  if (gaps.length) {
    add(box, el("p", { text: "These parts of Mythic are in none of the sources here, so the app does not roll them and does not approximate them:" }));
    const list = el("ul", {});
    for (const item of gaps) add(list, el("li", { text: item }));
    add(box, list);
  } else {
    add(box, el("p", { text: "Everything One-Page Mythic left out has since been supplied from the Second Edition pages and is built: the Fate Chart, the Event Focus table, the Scene Adjustment Table, the Thread Progress Track and the chaos variants." }));
  }
  add(box, el("p", { class: "block-note", text: NOT_IN_SOURCE.fateQuestion.text }));
  const more = el("ul", {});
  for (const item of notSupplied()) add(more, el("li", { text: item }));
  add(box, el("p", { class: "block-note", text: "Two things are named in the book but never specified, so they are not built:" }), more);
  return box;
}

function examplesCard() {
  const box = el("details", { class: "card fold" });
  add(box, el("summary", { text: "The article's two worked examples" }),
    el("p", { class: "block-note", text: "Summarised, to show what a reading looks like. Neither is playable content - they are illustrations." }));
  for (const ex of examples()) {
    const item = el("article", { class: "example" });
    add(item, el("h3", { text: ex.title }), el("p", { class: "example-genre", text: ex.genre }), el("p", { text: ex.setup }));
    const list = el("ol", { class: "example-reveals" });
    for (const r of ex.reveals) {
      add(list, el("li", {}, el("span", { class: "example-roll", text: r.roll }), el("span", { class: "example-read", text: r.reading })));
    }
    add(item, list, el("p", {}, el("strong", { text: "Outcome: " }), ex.outcome), el("p", {}, el("strong", { text: "Pivot: " }), ex.pivot),
      el("p", { class: "source-cite", text: ex.cite }));
    add(box, item);
  }
  return box;
}

function sourceCard() {
  const s = source();
  const m = mythicSource();
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title", text: "Sources" }),
    el("p", { text: `${s.title}, ${s.publication} volume ${s.volume}, pages ${s.pages} - the reveal system, cited ${s.cite}:p followed by the page.` }),
    el("p", { text: `${m.title}, ${m.publisher} - Ask The Game Master, Random Events and Discover Meaning, cited ${m.cite}.` }),
    el("p", { text: `${crafterSource().title}, ${crafterSource().publication} volume ${crafterSource().volume}, pages ${crafterSource().pages} - the villain, their organization and their underlings, cited ${crafterSource().cite}.` }),
    el("p", { text: `${elementsSource().title}: ${elementsSource().section} - the twelve detail tables, cited ${elementsSource().cite}.` }),
    el("p", { text: `${scenesSource().title}: ${scenesSource().section} - supplied as a written summary, so those values ship marked provisional.` }),
    el("p", { class: "block-note", text: "Every number and table comes from those four; every wording here is the app's own." }));
  return box;
}

// ------------------------------------------------------------------ settings
export function renderSettings() {
  const content = el("div", {});
  add(content, el("h1", { text: "Settings" }),
    explain("Display, backup and data repair. Everything lives in this browser: the export is plain readable JSON, it imports back, and it is how you move to another device. Nothing is sent anywhere."));

  add(content, card([
    el("h2", { class: "card-title", text: "Appearance" }),
    themeRow(),
    textSizeRow(),
    checkRow({
      label: "Show the article's guidance on reveal cards",
      hint: "The interpretation advice that comes with each kind of reveal.",
      checked: Settings.showGuidance(),
      onChange: (v) => { Settings.set("showGuidance", v); refresh(); }
    })
  ]));

  add(content, card([
    el("h2", { class: "card-title", text: "The Mythic oracle" }),
    el("p", { class: "block-note", text: "Ask The Game Master, Random Events and Discover Meaning, from One-Page Mythic. On by default, because the reveal system asks Fate Questions of its own. Turn it off if you run the oracle with physical dice or another emulator - the Oracle tab disappears and the app stops offering to roll." }),
    checkRow({
      label: "Roll the Mythic oracle in the app",
      checked: Settings.mythicOracle(),
      onChange: (v) => { Settings.set("mythicOracle", v); refresh(); }
    })
  ]));

  add(content, card([
    el("h2", { class: "card-title", text: "Backup" }),
    el("p", { class: "block-note", text: "Export before you delete anything. The file is readable JSON: adventures, reveals, leads and the roll log." }),
    el("div", { class: "row-actions" },
      el("button", { class: "btn btn-primary", type: "button", onclick: exportAll }, "Export everything"),
      el("button", { class: "btn btn-quiet", type: "button", onclick: importAll }, "Import a backup"))
  ]));

  add(content, card([
    el("h2", { class: "card-title", text: "Check my data" }),
    el("p", { class: "block-note", text: "Re-runs the app's own normalisation over what is stored and reports anything it repaired. Migrations otherwise run silently at load." }),
    el("button", { class: "btn btn-quiet", type: "button", onclick: () => {
      const repairs = store.checkIntegrity();
      modal({
        title: "Data check",
        body: repairs.length
          ? el("div", {}, el("p", { text: "Repaired:" }), el("ul", {}, ...repairs.map((r) => el("li", { text: r }))))
          : el("p", { text: "Nothing needed repairing." }),
        actions: [{ label: "Close" }]
      });
      refresh();
    } }, "Run the check")
  ]));

  add(content, card([
    el("h2", { class: "card-title", text: "Learning the system" }),
    el("p", { class: "block-note", text: "A first session, step by step, and the rules in full." }),
    el("div", { class: "row-actions" },
      el("a", { class: "btn btn-quiet", href: "#/tutorial" }, "Tutorial"),
      el("a", { class: "btn btn-quiet", href: "#/rules" }, "Rules library"))
  ]));

  add(content, backupsCard());

  add(content, card([
    el("h2", { class: "card-title", text: "This build" }),
    inlineRow("Version", APP.build),
    el("p", { class: "block-note", text: "The app caches itself so it works offline, which means a new version only arrives when the cached copy is replaced. If something you were told is fixed still looks broken, check this number first - and if a reload does not change it, close every copy of the app and open it again." }),
    el("button", { class: "btn btn-quiet", type: "button", onclick: () => {
      if (!("serviceWorker" in navigator)) { showToast("No offline cache in this browser - you are always on the newest code."); return; }
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) { showToast("Nothing cached yet - you are on the newest code."); return; }
        reg.update()
          .then(() => showToast("Checked. If a new version was waiting you will be offered a reload."))
          .catch(() => showToast("Could not reach the network to check.", "warn"));
      });
    } }, "Check for a new version")
  ]));

  add(content, card([
    el("h2", { class: "card-title", text: "Start over" }),
    el("p", { class: "block-note", text: "Removes every adventure and the roll log from this browser." }),
    el("button", { class: "btn btn-danger", type: "button", onclick: () => confirmModal({
      title: "Delete everything?",
      message: "Every adventure, reveal, reading, lead and roll in this browser.",
      loss: `${plural(store.adventures().length, "adventure", "adventures")} and ${plural(store.rollLog().length, "roll", "rolls")} are removed. Export first if you might want any of it back. One step of undo is kept until you close the app.`,
      confirmLabel: "Delete everything",
      onConfirm: () => {
        store.snapshot("deleting everything");
        for (const adv of store.adventures()) store.deleteAdventure(adv.id);
        store.clearLog();
        refresh();
        showToast("Everything deleted.");
      }
    }) }, "Delete everything")
  ], "danger-zone"));

  return { content };
}

/**
 * The backup ring. Taken automatically before every arc boundary, before a delete and
 * before an import; restorable here, and each one can be saved to a file - which is the
 * only thing that survives a cleared site, and the note says so.
 */
function backupsCard() {
  const list = store.backups();
  const body = [
    el("h2", { class: "card-title", text: "Backups" }),
    el("p", { class: "block-note", text: `The app keeps its last ${store.BACKUP_KEEP} backups here, taken before anything irreversible - an arc boundary, a delete, an import. They live in this same browser, so clearing its site data removes them too: save one to a file for anything you would hate to lose.` }),
    el("div", { class: "row-actions" },
      el("button", { class: "btn btn-quiet", type: "button", onclick: () => {
        const entry = store.backup("taken by hand");
        refresh();
        showToast(entry ? "Backed up." : "Could not write a backup - storage is full. Save to a file instead.", entry ? "" : "warn");
      } }, "Back up now"))
  ];
  if (!list.length) body.push(el("p", { class: "block-note", text: "No backups yet." }));
  for (const entry of list) {
    const row = el("div", { class: "def-row backup-row" });
    add(row,
      el("span", { class: "def-label" }, el("strong", { text: entry.label }), el("br"),
        el("small", { text: `${formatDate(entry.at)} ${formatTime(entry.at)} · ${plural(entry.adventures, "adventure", "adventures")}` })),
      el("span", { class: "def-value row-actions" },
        el("button", { class: "btn btn-quiet", type: "button", onclick: () => confirmModal({
          title: "Restore this backup?",
          message: `Everything goes back to how it was ${entry.label}.`,
          loss: "Every change since then is replaced. One step of undo is kept until you close the app.",
          confirmLabel: "Restore",
          onConfirm: () => {
            const result = store.restoreBackup(entry.id);
            refresh();
            showToast(result.ok ? `Restored: ${plural(result.adventures, "adventure", "adventures")}.` : result.error, result.ok ? "" : "warn");
          }
        }) }, "Restore"),
        el("button", { class: "btn btn-quiet", type: "button", onclick: () => {
          download(`schemer-backup-${new Date(entry.at).toISOString().slice(0, 10)}.json`, store.backupJSON(entry.id));
        } }, "Save to file"),
        el("button", { class: "btn-icon", type: "button", "aria-label": `Delete the backup ${entry.label}`,
          onclick: () => { store.deleteBackup(entry.id); refresh(); showToast("Backup deleted."); } }, "\u00d7")));
    body.push(row);
  }
  return card(body);
}

function themeRow() {
  const row = el("div", { class: "chip-row" });
  for (const [key, label] of [["system", "Follow system"], ["light", "Light"], ["dark", "Dark"]]) {
    add(row, el("button", {
      class: `chip ${Settings.theme() === key ? "on" : ""}`, type: "button",
      "aria-pressed": Settings.theme() === key ? "true" : "false",
      onclick: () => { Settings.set("theme", key); applySettings(); refresh(); }
    }, label));
  }
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Theme" }), row);
  return wrap;
}

function textSizeRow() {
  const row = el("div", { class: "chip-row" });
  for (const [scale, label] of [[0.95, "Small"], [1, "Normal"], [1.15, "Large"], [1.3, "Larger"]]) {
    add(row, el("button", {
      class: `chip ${Number(Settings.textScale()) === scale ? "on" : ""}`, type: "button",
      "aria-pressed": Number(Settings.textScale()) === scale ? "true" : "false",
      onclick: () => { Settings.set("textScale", scale); applySettings(); refresh(); }
    }, label));
  }
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Text size" }),
    el("small", { class: "field-hint", text: "Pinch-zoom is locked so a stray pinch mid-roll cannot shift the page; this scales the app's own type instead." }), row);
  return wrap;
}

function exportAll() {
  const json = store.exportJSON();
  const body = el("div", {});
  const area = el("textarea", { class: "export-area", rows: 12, readonly: true, "aria-label": "Backup JSON" });
  area.value = json;
  add(body, el("p", { text: "Copy this, or download it. It imports back on any device." }), area);
  modal({
    title: "Backup",
    body,
    size: "modal-wide",
    actions: [
      { label: "Copy", onClick: () => { area.select(); try { document.execCommand("copy"); showToast("Copied."); } catch { showToast("Select the text and copy it."); } return true; } },
      { label: "Download", onClick: () => { download(store.exportFilename(), json); return true; } },
      { label: "Close" }
    ]
  });
}

function download(filename, text) {
  try {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("Downloaded.");
  } catch {
    showToast("This browser blocked the download - copy the text instead.", "warn");
  }
}

function importAll() {
  const area = el("textarea", { rows: 10, class: "export-area", "aria-label": "Paste a backup" });
  const file = el("input", { type: "file", accept: "application/json,.json", "aria-label": "Choose a backup file" });
  file.addEventListener("change", () => {
    const f = file.files && file.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { area.value = String(reader.result || ""); };
    reader.readAsText(f);
  });
  const body = el("div", {});
  add(body, el("p", { text: "Importing replaces everything in this browser. One step of undo is kept." }), file, area);
  modal({
    title: "Import a backup",
    body,
    size: "modal-wide",
    actions: [
      { label: "Import", onClick: () => {
        const result = store.importJSON(area.value);
        if (!result.ok) { showToast(result.error, "warn"); return true; }
        showToast(`Imported ${plural(result.adventures, "adventure", "adventures")}.`);
        refresh();
      } },
      { label: "Cancel" }
    ]
  });
}
