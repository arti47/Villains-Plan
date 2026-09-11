// oracle.js — One-Page Mythic: Ask The Game Master, Random Events and Discover Meaning.
// The engine and its two screens. Dice come from core; every roll is logged once and
// rendered from what was stored (§5.1).

import { el, add, d100 as rollD100, uid, now, formatTime, formatDate } from "./core.js";
import {
  explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast
} from "./ui.js";
import {
  askOdds, askResult, defaultOdds, oddsRow, discoverWord, discoverMeaning,
  askProcedure, randomEventRule, mythicGuidance, mythicSource
} from "./rules.js";
import * as store from "./store.js";
import { Settings } from "./settings.js";
import { refresh, go } from "./router.js";

// ------------------------------------------------------------------ engine
/**
 * Ask The Game Master. Rolls one d100 against the chosen odds row; a double-digit
 * result also fires a Random Event, which does not overturn the answer (OPM).
 */
export function ask({ question = "", odds = defaultOdds(), expectation = "" } = {}) {
  const roll = rollD100();
  const result = askResult(odds, roll);
  const event = result.double ? rollEventWord() : null;

  const adv = store.active();
  const dice = [{ die: "d100", value: roll, table: `Ask The Game Master - ${result.odds.label}` }];
  if (event) dice.push({ die: "d100", value: event.roll, table: "Discover Meaning - Action" });

  store.pushLog({
    adventureId: adv ? adv.id : null,
    kind: "ask",
    question: String(question || "").trim(),
    dice,
    summary: `${result.odds.label}: ${result.answer.label}${event ? ` · random event: ${event.word}` : ""}`,
    outcome: result.answer.label
  });
  if (adv) {
    store.record(adv.id, "ask",
      `Asked${question ? ` "${String(question).trim()}"` : ""} at ${result.odds.label}: ${result.answer.label} (${roll})${event ? `, and a random event: ${event.word}` : ""}.`);
  }
  return { ...result, question: String(question || "").trim(), expectation, event, id: uid("ask"), at: now() };
}

/** One Discover Meaning word. Nothing rolls a second one on your behalf (ruling A15). */
export function discover(column = "action", { logAs = "meaning", question = "" } = {}) {
  const roll = rollD100();
  const word = discoverWord(column, roll);
  const adv = store.active();
  store.pushLog({
    adventureId: adv ? adv.id : null,
    kind: logAs,
    question: String(question || "").trim(),
    dice: [{ die: "d100", value: roll, table: `Discover Meaning - ${column === "action" ? "Action" : "Description"}` }],
    summary: word.word,
    outcome: `${column === "action" ? "Action" : "Description"}: ${word.word}`
  });
  return word;
}

/** The word a Random Event is read from — an Action, because an event is what happens. */
function rollEventWord() {
  const roll = rollD100();
  return { ...discoverWord("action", roll), event: true };
}

/** Ask the pivot question for the Arc screen, and record the answer where the gate reads it. */
export function askPivot(adv) {
  const result = ask({ question: "Does the villain enact a Pivot Plan?", odds: lastPivotOdds });
  store.setFateAnswer(adv.id, result.answer.key);
  return result;
}
let lastPivotOdds = defaultOdds();
export function setPivotOdds(key) { lastPivotOdds = key; return lastPivotOdds; }
export function pivotOdds() { return lastPivotOdds; }

// ------------------------------------------------------------------ ask screen
let draft = { question: "", odds: defaultOdds() };
let lastAsk = null;                 // rendered from what was rolled; never re-rolled

export function renderAsk() {
  const content = el("div", {});
  add(content, el("h1", { text: "Ask the Game Master" }),
    explain("A Yes/No question, your honest read of the odds, and one d100 against the Mythic chart. Yes and No follow the expectation you had when you asked; the Exceptional results go past it. A double-digit roll also throws a random event into the same moment, which the app rolls a word for."));

  if (!Settings.mythicOracle()) {
    add(content, oracleOffCard());
    return { content };
  }

  const field = el("input", { type: "text", placeholder: "Is the mine still guarded?", "aria-label": "Your question" });
  field.value = draft.question;
  field.addEventListener("input", () => { draft.question = field.value; });
  const label = el("label", { class: "field" });
  add(label, el("span", { class: "field-label", text: "Your question" }), field);
  add(content, label);

  const oddsWrap = el("div", { class: "field" });
  add(oddsWrap, el("span", { class: "field-label", text: "Odds of a Yes" }));
  const chips = el("div", { class: "chip-row odds-row" });
  for (const row of askOdds()) {
    add(chips, el("button", {
      class: `chip ${draft.odds === row.key ? "on" : ""}`, type: "button",
      "aria-pressed": draft.odds === row.key ? "true" : "false",
      onclick: () => { draft.odds = row.key; refresh(); }
    }, row.label));
  }
  add(oddsWrap, chips);
  add(content, oddsWrap);

  const odds = oddsRow(draft.odds);
  add(content, oddsCard(odds), procedureCard());

  if (lastAsk) add(content, sectionTitle("The answer"), askCard(lastAsk));
  add(content, guidanceNote(mythicGuidance("odds"), "ask-odds"), guidanceNote(mythicGuidance("expectations"), "ask-odds"));
  add(content, recentAsks());

  const action = actionBar({
    label: "Ask",
    context: `${odds.label} · Yes on ${odds.exYes[0]}-${odds.yes[1]}`,
    onClick: () => {
      lastAsk = ask({ question: draft.question, odds: draft.odds });
      refresh();
      showToast(`${lastAsk.answer.label}${lastAsk.double ? " — and a random event" : ""}.`);
    }
  });
  return { content, action };
}

function oddsCard(odds) {
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title" }, odds.label, citeLink("ask-chart", "rule")));
  const bands = [
    ["Exceptional Yes", odds.exYes], ["Yes", odds.yes], ["No", odds.no], ["Exceptional No", odds.exNo]
  ];
  for (const [name, range] of bands) {
    const width = range[1] - range[0] + 1;
    const row = el("div", { class: "band-row" });
    add(row,
      el("span", { class: "band-name", text: name }),
      el("span", { class: `band-bar band-${name.toLowerCase().replace(/ /g, "-")}`, style: `width:${width}%` }),
      el("span", { class: "band-range", text: `${range[0]}-${range[1]}` }));
    add(box, row);
  }
  add(box, el("p", { class: "block-note", text: `A Yes of either kind on ${odds.exYes[0]}-${odds.yes[1]}: ${odds.yes[1]}%.` }));
  return box;
}

function askCard(result) {
  const box = el("article", { class: `card ask-card ${result.answer.yes ? "yes" : "no"}${result.answer.exceptional ? " exceptional" : ""}` });
  add(box,
    el("header", { class: "phase-head" },
      el("h3", { class: "phase-title", text: result.answer.label }),
      el("span", { class: "phase-date", text: formatTime(result.at) })));
  if (result.question) add(box, el("p", { class: "ask-question", text: `"${result.question}"` }));
  const dice = el("div", { class: "dice-row" });
  add(dice, diePill({ die: "d100", value: result.roll, table: `Ask The Game Master - ${result.odds.label}` }),
    el("span", { class: "arith", text: `${result.odds.label}` }));
  add(box, dice, el("p", { class: "block-text", text: result.answer.text }));

  if (!result.answer.yes) {
    add(box, el("p", { class: "block-note" },
      "Cannot see how a No plays out? ", el("a", { class: "cite", href: "#/meaning" }, "Discover Meaning"), " rather than rolling again."));
  }
  if (result.event) add(box, eventBlock(result.event));
  return box;
}

function eventBlock(event) {
  const box = el("div", { class: "block event-block" });
  add(box, el("h4", { class: "block-title" }, "Random event", citeLink("random-events", "rule")));
  const dice = el("div", { class: "dice-row" });
  add(dice, diePill({ die: "d100", value: event.roll, table: "Discover Meaning - Action" }),
    el("span", { class: "keyword" }, el("span", { class: "keyword-word", text: event.word })));
  add(box, dice,
    el("p", { class: "block-note", text: randomEventRule().note }),
    el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => { go("#/meaning"); showToast("Roll another word to sharpen it."); }
    }, "Add another word"));
  return box;
}

function recentAsks() {
  const adv = store.active();
  const rows = store.rollLog({ kind: "ask" }).filter((r) => !adv || r.adventureId === adv.id).slice(0, 8);
  if (!rows.length) return null;
  const box = el("details", { class: "card fold" });
  add(box, el("summary", { text: `Recent questions (${rows.length})` }));
  const list = el("ol", { class: "log-list" });
  for (const row of rows) {
    const item = el("li", { class: "log-row" });
    add(item,
      el("div", { class: "log-head" },
        el("span", { class: "log-outcome", text: row.outcome }),
        el("span", { class: "log-time", text: `${formatDate(row.ts)} ${formatTime(row.ts)}` })),
      row.question ? el("p", { class: "log-summary", text: `"${row.question}"` }) : null,
      el("p", { class: "log-summary", text: row.summary }));
    add(list, item);
  }
  add(box, list);
  return box;
}

// ------------------------------------------------------------------ meaning screen
let reading = { column: "action", words: [] };

export function renderMeaning() {
  const content = el("div", {});
  add(content, el("h1", { text: "Discover Meaning" }),
    explain("Detail without a question. Roll for an Action word when you want to know what something is doing, or a Description word when you want to know what it is like, and read it against what is happening. One word is often enough; when it is not, roll another and read them together."));

  if (!Settings.mythicOracle()) {
    add(content, oracleOffCard());
    return { content };
  }

  const table = discoverMeaning();
  const chips = el("div", { class: "chip-row" });
  for (const column of table.columns) {
    add(chips, el("button", {
      class: `chip ${reading.column === column.key ? "on" : ""}`, type: "button",
      "aria-pressed": reading.column === column.key ? "true" : "false",
      onclick: () => { reading.column = column.key; refresh(); }
    }, column.label));
  }
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Which column" }), chips,
    el("small", { class: "field-hint", text: table.columns.find((c) => c.key === reading.column).use }));
  add(content, wrap);

  if (reading.words.length) {
    const box = el("div", { class: "card reading-card" });
    add(box, el("h2", { class: "card-title" }, "This reading", citeLink("discover-meaning", "rule")));
    const dice = el("div", { class: "dice-row" });
    for (const word of reading.words) {
      const pill = el("span", { class: "keyword" });
      add(pill, el("span", { class: "keyword-word", text: word.word }), el("span", { class: "keyword-roll", text: String(word.roll) }));
      add(dice, pill);
    }
    add(box, dice,
      el("p", { class: "block-note", text: reading.words.length === 1
        ? "One word. If it is enough, stop here."
        : `${reading.words.length} words, read together.` }),
      el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => { reading.words = []; refresh(); showToast("Reading cleared."); }
      }, "Start a new reading"));
    add(content, box);
  } else {
    add(content, emptyState("Nothing rolled yet. Pick a column and roll a word."));
  }

  add(content, guidanceNote(mythicGuidance("moreWords"), "discover-meaning"),
    guidanceNote(mythicGuidance("noMeaning"), "ask-answers"));

  const action = actionBar({
    label: reading.words.length ? "Roll another word" : "Roll a word",
    context: `${table.columns.find((c) => c.key === reading.column).label} column`,
    onClick: () => {
      reading.words.push(discover(reading.column));
      refresh();
    }
  });
  return { content, action };
}

function oracleOffCard() {
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title", text: "The oracle is switched off" }),
    el("p", { class: "block-note", text: "You have turned off Ask The Game Master, Random Events and Discover Meaning - the app will not roll them. Turn it back on here if you want them." }),
    el("button", {
      class: "btn btn-primary", type: "button",
      onclick: () => { Settings.set("mythicOracle", true); refresh(); showToast("Oracle on."); }
    }, "Turn the oracle on"));
  return box;
}

function guidanceNote(g, entryId) {
  if (!g || !Settings.showGuidance()) return null;
  const note = el("details", { class: "guidance" });
  add(note, el("summary", { text: g.title }), el("p", { text: g.text }),
    el("p", { class: "block-note" }, citeLink(entryId, "in the rules library"), el("span", { class: "source-cite", text: g.cite })));
  return note;
}

function procedureCard() {
  const box = el("details", { class: "card fold" });
  add(box, el("summary", { text: "How to ask" }));
  const list = el("ol", { class: "summary-list" });
  for (const step of askProcedure().steps) {
    add(list, el("li", {}, el("strong", { text: `${step.title}. ` }), step.text));
  }
  add(box, list, el("p", { class: "source-cite", text: mythicSource().cite }));
  return box;
}
