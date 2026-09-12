// lists.js — the Threads and Characters lists: the screen, the cards, rolling for an
// entry, clean-up. The track card sits at the top of this screen.

import { el, add, die, plural, truncate } from "./core.js";
import { explain, citeLink, diePill, emptyState, showToast, confirmModal, promptModal, inlineRow } from "./ui.js";
import { listsRule, listSelectionRule } from "./rules.js";
import { listItems, listLines, listFull, listNeedsCleanup, plotArmoured } from "./derived.js";
import * as store from "./store.js";
import { refresh, go } from "./router.js";
import { rollFromList } from "./scene-engine.js";
import { trackCard } from "./track.js";

// the last roll on a list, per kind - a toast is not a result (F51)
const lastListRoll = {};

// ------------------------------------------------------------------ lists screen
export function renderLists() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Threads & Characters" }),
    explain("Two lists Mythic keeps: the goals your character is chasing, and the people, places and things that matter. Anything prominent in a scene earns another line, to a maximum of three, so the busiest parts of your story are the likeliest to come back. Twenty-five lines each; when they fill, clean up and the three-line elements come across with two."));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }

  add(content, trackCard(adv));
  for (const kind of listsRule().kinds) add(content, listCard(adv, kind));
  add(content, selectionNote());
  return { content };
}

/**
 * What a list roll came back with. On a blank line the book gives two options - take the
 * element that fits, or roll again until you land on one - and both are offered here,
 * from the data, rather than flashed in a toast (F51).
 */
function listRollResult(adv, kind, picked) {
  const rule = listSelectionRule();
  const box = el("div", { class: "block list-roll" });
  const dice = el("div", { class: "dice-row" });
  for (const d of picked.dice) add(dice, diePill(d));
  add(box, el("h4", { class: "block-title", text: picked.choose ? "Choose" : "The list says" }), dice);
  if (picked.choose) {
    add(box, el("p", { class: "block-text", text: `Section ${picked.section}, line ${picked.line} is blank. ${rule.chooseText}` }),
      el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => { lastListRoll[kind.key] = rollFromList(store.active(), kind.key); refresh(); }
      }, "Roll again"));
  } else {
    add(box, el("p", { class: "block-text" }, el("strong", { text: picked.item.text }),
      ` (section ${picked.section}, line ${picked.line})`));
  }
  return box;
}

function selectionNote() {
  const rule = listSelectionRule();
  const box = el("details", { class: "guidance provisional" });
  add(box, el("summary", { text: "How a random event picks from a list" }),
    el("p", { text: "Sections go active as the lines fill, top to bottom. Roll a die sized to the active sections for which section, then a d10 for the line inside it: 1-2 is the first line, 3-4 the second, and so on. Land on a blank line and the result is Choose - take whichever entry fits, or roll again." }));
  const table = el("table", { class: "ladder" });
  const head = el("thead", {});
  add(head, el("tr", {}, el("th", { text: "Lines" }), el("th", { text: "Sections" }), el("th", { text: "Section die" })));
  const body = el("tbody", {});
  for (const row of rule.sectionDice) {
    add(body, el("tr", {}, el("td", { text: `${(row.sections - 1) * 5 + 1}-${row.sections * 5}` }),
      el("td", { text: String(row.sections) }), el("td", { text: row.die ? `d${row.die}` : "no roll" })));
  }
  add(table, head, body);
  add(box, el("div", { class: "scroll-x" }, table),
    el("p", { class: "block-note", text: rule.inferred }),
    el("p", { class: "source-cite", text: `${rule.cite} (summary)` }));
  return box;
}

function listCard(adv, kind) {
  const rule = listsRule();
  const box = el("section", { class: "card" });
  const used = listLines(adv, kind.key);
  add(box, el("h2", { class: "card-title" }, kind.label, citeLink("threads-characters", "rule")),
    el("p", { class: "block-note", text: kind.text }),
    inlineRow("Lines used", `${used} of ${rule.lines}`));

  const items = listItems(adv, kind.key);
  if (!items.length) {
    add(box, el("p", { class: "block-note", text: `Nothing on the ${kind.label.toLowerCase()} list yet.` }));
  } else {
    const list = el("ul", { class: "mythic-list" });
    for (const item of items) add(list, listRow(adv, kind, item, used));
    add(box, list);
  }

  const actions = el("div", { class: "row-actions" });
  add(actions,
    el("button", {
      class: "btn btn-primary", type: "button",
      onclick: () => (listFull(adv, kind.key)
        ? showToast(`The ${kind.label.toLowerCase()} list is full at ${listsRule().lines} lines. Cross something out, or clean up.`, "warn")
        : promptModal({
        title: `Add a ${kind.singular}`,
        message: kind.text,
        label: kind.label,
        placeholder: kind.placeholder,
        confirmLabel: "Add",
        onConfirm: (text) => { if (store.addListItem(adv.id, kind.key, text)) { refresh(); showToast("Added."); } }
      }))
    }, `Add a ${kind.singular}`),
    items.length ? el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => {
        lastListRoll[kind.key] = rollFromList(store.active(), kind.key);
        refresh();
      }
    }, "Roll for an entry") : null);
  add(box, actions);
  if (lastListRoll[kind.key]) add(box, listRollResult(adv, kind, lastListRoll[kind.key]));

  if (listFull(adv, kind.key)) {
    add(box, el("p", { class: "refusal", text: `The ${kind.label.toLowerCase()} list is full at ${rule.lines} lines.` }));
    if (listNeedsCleanup(adv, kind.key)) {
      add(box, el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => confirmModal({
          title: `Clean up the ${kind.label.toLowerCase()} list?`,
          message: rule.cleanup,
          loss: `Crossed-out elements are dropped for good. Everything else comes across with a single line, except anything holding ${rule.maxEntries}, which comes across with two. One step of undo is kept.`,
          confirmLabel: "Clean up",
          danger: false,
          onConfirm: () => {
            const result = store.cleanupList(adv.id, kind.key, rule.cleanupEntries);
            refresh();
            showToast(`${result.carried} carried across on ${result.lines} lines; ${result.reduced} reduced.`);
          }
        })
      }, "Clean up the list"));
    }
  }
  return box;
}

function listRow(adv, kind, item, used) {
  const rule = listsRule();
  const row = el("li", { class: "mythic-row" });

  // F37: these were disabled with the reason in a title attribute, which a phone never
  // shows (§13 D-26). They stay enabled and refuse out loud instead (§6.4).
  const weightUp = () => {
    if (item.entries >= rule.maxEntries) {
      showToast(`"${item.text}" already holds ${rule.maxEntries} lines, which is the most any element may have.`, "warn");
      return;
    }
    if (used >= rule.lines) {
      showToast(`The ${kind.label.toLowerCase()} list is full at ${rule.lines} lines. Cross something out, or clean up.`, "warn");
      return;
    }
    store.setListEntries(adv.id, kind.key, item.id, item.entries + 1);
    refresh();
  };
  const weightDown = () => {
    if (item.entries <= 1) {
      showToast(`"${item.text}" holds one line. Cross it out to take that one back.`, "warn");
      return;
    }
    store.setListEntries(adv.id, kind.key, item.id, item.entries - 1);
    refresh();
  };

  add(row,
    el("span", { class: "mythic-text", text: item.text }),
    el("span", {
      class: "mythic-entries",
      title: `${item.entries} of ${rule.maxEntries} lines`,
      "aria-label": `${item.entries} of ${rule.maxEntries} lines`,
      text: "\u25cf".repeat(item.entries) + "\u25cb".repeat(rule.maxEntries - item.entries)
    }),
    el("button", {
      class: "btn-icon", type: "button",
      "aria-label": `Give ${item.text} another line`,
      onclick: weightUp
    }, "+"),
    el("button", {
      class: "btn-icon", type: "button",
      "aria-label": `Take a line back from ${item.text}`,
      onclick: weightDown
    }, "\u2212"),
    el("button", {
      class: "btn-icon", type: "button", "aria-label": `Cross out ${item.text}`,
      onclick: () => (plotArmoured(adv, item.id)
        ? showToast(`"${truncate(item.text, 28)}" is the focus thread and carries plot armour: it cannot be resolved until its track is full.`, "warn")
        : confirmModal({
        title: `Cross out "${item.text}"?`,
        message: "Finished, abandoned, or gone.",
        loss: `All ${plural(item.entries, "line", "lines")} it holds are freed.`,
        confirmLabel: "Cross out",
        onConfirm: () => { store.removeListItem(adv.id, kind.key, item.id); refresh(); showToast("Crossed out."); }
      }))
    }, "\u00d7"));
  return row;
}
