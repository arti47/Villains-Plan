// oracle.js — One-Page Mythic: Ask The Game Master, Random Events and Discover Meaning.
// The engine and its two screens. Dice come from core; every roll is logged once and
// rendered from what was stored (§5.1).

import { el, add, d100 as rollD100, uid, now, formatTime, formatDate } from "./core.js";
import {
  explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast, checkRow
} from "./ui.js";
import {
  askResult, defaultOdds, oddsRow, fateChart, fateBands, meaningWord, meaningTables,
  meaningTable, askProcedure, randomEventRule, mythicGuidance, mythicSource,
  elementsSource, eventFocus, eventFocusTable, chartChaos, chaosMode as chaosModeRule
} from "./rules.js";
import { chaos as chaosOf, chaosMode as chaosModeOf } from "./derived.js";
import * as store from "./store.js";
import { Settings } from "./settings.js";
import { refresh, go } from "./router.js";

// ------------------------------------------------------------------ engine
/**
 * Ask The Game Master. Rolls one d100 against the chosen odds row; a double-digit
 * result also fires a Random Event, which does not overturn the answer (OPM).
 */
export function ask({ question = "", odds = defaultOdds(), expectation = "", forMechanic = false } = {}) {
  const adv = store.active();
  const mode = chaosModeOf(adv);
  const level = chartChaos(chaosOf(adv), { mode, forMechanic });
  const roll = rollD100();
  const result = askResult(odds, roll, level);
  const event = result.double ? rollEvent() : null;

  const dice = [{ die: "d100", value: roll, table: `Fate Chart - ${result.odds.label} at chaos ${level}` }];
  if (event) {
    if (event.focus.roll) dice.push({ die: "d100", value: event.focus.roll, table: "Random Event Focus" });
    for (const word of event.words) dice.push({ die: "d100", value: word.roll, table: word.table });
  }

  store.pushLog({
    adventureId: adv ? adv.id : null,
    kind: "ask",
    question: String(question || "").trim(),
    dice,
    summary: `${result.odds.label} at chaos ${level}: ${result.answer.label}${event ? ` · random event: ${event.focus.label} - ${event.words.map((w) => w.word).join(", ")}` : ""}`,
    outcome: result.answer.label
  });
  if (adv) {
    store.record(adv.id, "ask",
      `Asked${question ? ` "${String(question).trim()}"` : ""} at ${result.odds.label}, chaos ${level}: ${result.answer.label} (${roll})${event ? `, and a random event - ${event.focus.label}: ${event.words.map((w) => w.word).join(", ")}` : ""}.`);
  }
  return { ...result, question: String(question || "").trim(), expectation, event, forMechanic, mode, id: uid("ask"), at: now() };
}

/** One word from one meaning table. Nothing rolls a second on your behalf (ruling A15). */
export function discover(tableId = "action", { logAs = "meaning", question = "" } = {}) {
  const roll = rollD100();
  const word = meaningWord(tableId, roll);
  const adv = store.active();
  store.pushLog({
    adventureId: adv ? adv.id : null,
    kind: logAs,
    question: String(question || "").trim(),
    dice: [{ die: "d100", value: roll, table: word.table }],
    summary: word.word,
    outcome: `${word.table}: ${word.word}`
  });
  return word;
}

/**
 * A random event: roll the Event Focus, then its meaning on the two Action tables
 * (GME2e). The focus may point at the Threads or Characters list - the app offers that
 * pick rather than making it for you, because which entry fits is a reading.
 */
export function rollEvent({ focusKey = null } = {}) {
  const focus = focusKey
    ? { ...eventFocusTable().rows.find((r) => r.key === focusKey), roll: null, automatic: true }
    : eventFocus(rollD100());
  const words = [meaningWord("action-1", rollD100()), meaningWord("action-2", rollD100())];
  return { focus, words };
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
let draft = { question: "", odds: defaultOdds(), forMechanic: false };
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
  for (const row of fateChart().rows) {
    add(chips, el("button", {
      class: `chip ${draft.odds === row.key ? "on" : ""}`, type: "button",
      "aria-pressed": draft.odds === row.key ? "true" : "false",
      onclick: () => { draft.odds = row.key; refresh(); }
    }, row.label));
  }
  add(oddsWrap, chips);
  add(content, oddsWrap);

  const odds = oddsRow(draft.odds);
  const mode = chaosModeOf(store.active());
  const level = chartChaos(chaosOf(store.active()), { mode, forMechanic: draft.forMechanic });
  add(content, mechanicRow(mode, level), oddsCard(odds, level), procedureCard());

  if (lastAsk) add(content, sectionTitle("The answer"), askCard(lastAsk));
  add(content, guidanceNote(mythicGuidance("odds"), "ask-odds"), guidanceNote(mythicGuidance("expectations"), "ask-odds"), focusTableCard());
  add(content, recentAsks());

  const action = actionBar({
    label: "Ask",
    context: `${odds.label} · chaos ${level} · Yes on 1-${fateBands(odds.key, level).yes[1]}`,
    onClick: () => {
      lastAsk = ask({ question: draft.question, odds: draft.odds, forMechanic: draft.forMechanic });
      refresh();
      showToast(`${lastAsk.answer.label}${lastAsk.double ? " — and a random event" : ""}.`);
    }
  });
  return { content, action };
}

/**
 * "Treat the Chaos Factor as a value of 5 for these Questions, regardless of what the
 * actual Chaos Factor value is right now" (GME2e). A control, so the rule can fire.
 */
function mechanicRow(mode, level) {
  const wrap = el("div", { class: "field" });
  add(wrap, checkRow({
    label: "This question stands in for a game rule",
    hint: "Read at chaos 5 whatever the adventure's chaos is, so a to-hit roll is not skewed by the story's tension.",
    checked: draft.forMechanic,
    onChange: (v) => { draft.forMechanic = v; refresh(); }
  }));
  const variant = chaosModeRule(mode);
  if (mode !== "standard") {
    add(wrap, el("p", { class: "block-note", text: `${variant.label}: ${variant.text}` }));
  }
  if (draft.forMechanic || variant.readsChartAt) {
    add(wrap, el("p", { class: "block-note", text: `Reading the chart at chaos ${level}.` }));
  }
  return wrap;
}

function oddsCard(odds, level) {
  const bands = fateBands(odds.key, level);
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title" }, `${odds.label} at chaos ${bands.chaos}`, citeLink("fate-chart", "rule")));
  for (const [name, range] of [
    ["Exceptional Yes", bands.exYes], ["Yes", bands.yes], ["No", bands.no], ["Exceptional No", bands.exNo]
  ]) {
    const row = el("div", { class: "band-row" });
    add(row,
      el("span", { class: "band-name", text: name }),
      range
        ? el("span", { class: `band-bar band-${name.toLowerCase().replace(/ /g, "-")}`, style: `width:${range[1] - range[0] + 1}%` })
        : el("span", { class: "band-none", text: "cannot happen" }),
      range ? el("span", { class: "band-range", text: `${range[0]}-${range[1]}` }) : null);
    add(box, row);
  }
  add(box, el("p", { class: "block-note", text: `A Yes of either kind on 1-${bands.yes[1]}: ${bands.yes[1]}%. The Chaos Factor moves these bands - that is what it is for.` }));
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
  add(dice, diePill({ die: "d100", value: result.roll, table: `Fate Chart - ${result.odds.label}` }),
    el("span", { class: "arith", text: `${result.odds.label} at chaos ${result.chaos}` }));
  add(box, dice, el("p", { class: "block-text", text: result.answer.text }));

  if (!result.answer.yes) {
    add(box, el("p", { class: "block-note" },
      "Cannot see how a No plays out? ", el("a", { class: "cite", href: "#/meaning" }, "Discover Meaning"), " rather than rolling again."));
  }
  if (result.event) add(box, eventBlock(result.event));
  return box;
}

export function eventBlock(event) {
  const box = el("div", { class: "block event-block" });
  add(box, el("h4", { class: "block-title" }, "Random event", citeLink("random-events", "rule")));

  const focusRow = el("div", { class: "dice-row" });
  add(focusRow,
    event.focus.roll
      ? diePill({ die: "d100", value: event.focus.roll, table: "Random Event Focus" })
      : el("span", { class: "band-none", text: "automatic focus" }),
    el("span", { class: "focus-label", text: event.focus.label }));
  add(box, focusRow, el("p", { class: "block-note", text: event.focus.reason }));

  const wordRow = el("div", { class: "dice-row" });
  for (const word of event.words) {
    add(wordRow, diePill({ die: "d100", value: word.roll, table: word.table }));
    const pill = el("span", { class: "keyword", title: word.table });
    add(pill, el("span", { class: "keyword-word", text: word.word }));
    add(wordRow, pill);
  }
  add(box, wordRow, el("p", { class: "block-note", text: randomEventRule().note }));

  if (event.focus.list) {
    add(box, el("p", { class: "block-note" },
      `This focus points at the ${event.focus.list} list. `,
      el("a", { class: "cite", href: "#/lists" }, "Roll for an entry there"), "."));
  }
  add(box, el("button", {
    class: "btn btn-quiet", type: "button",
    onclick: () => { go("#/meaning"); showToast("Roll another word to sharpen it."); }
  }, "Add another word"));
  return box;
}

/**
 * The Event Focus table, with the book's own note on when each focus is the one you would
 * choose if you were choosing rather than rolling.
 */
function focusTableCard() {
  const table = eventFocusTable();
  const box = el("details", { class: "card fold" });
  add(box, el("summary", { text: "The Random Event Focus table" }),
    el("p", { class: "block-note", text: "A double on the ask rolls this, then two Action words. The reasons are the book's own: they say when a focus is the one you would pick if you were picking." }));
  const list = el("dl", { class: "focus-list" });
  for (const row of table.rows) {
    add(list,
      el("dt", {}, el("span", { class: "band-range", text: `${row.min}-${row.max}` }), " ", row.label,
        row.list ? el("span", { class: "phase-open-leads", text: row.list }) : null),
      el("dd", { text: row.reason }));
  }
  add(box, list, el("p", { class: "source-cite", text: table.cite }));
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
let reading = { tableId: "meaning-action", words: [] };

export function renderMeaning() {
  const content = el("div", {});
  add(content, el("h1", { text: "Discover Meaning" }),
    explain("Detail without a question. Roll for an Action word when you want to know what something is doing, or a Description word when you want to know what it is like, and read it against what is happening. One word is often enough; when it is not, roll another and read them together."));

  if (!Settings.mythicOracle()) {
    add(content, oracleOffCard());
    return { content };
  }

  const current = meaningTable(reading.tableId);
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Which table" }));
  for (const group of ["Discover Meaning", "Elements"]) {
    const tables = meaningTables().filter((t) => t.group === group);
    if (!tables.length) continue;
    add(wrap, el("p", { class: "group-title", text: group }));
    const chips = el("div", { class: "chip-row" });
    for (const table of tables) {
      add(chips, el("button", {
        class: `chip ${reading.tableId === table.id ? "on" : ""}`, type: "button",
        "aria-pressed": reading.tableId === table.id ? "true" : "false",
        onclick: () => { reading.tableId = table.id; refresh(); }
      }, table.short));
    }
    add(wrap, chips);
  }
  add(wrap, el("small", { class: "field-hint", text: `${current.use} ${current.cite}` }));
  add(content, wrap);

  if (reading.words.length) {
    const box = el("div", { class: "card reading-card" });
    add(box, el("h2", { class: "card-title" }, "This reading", citeLink("discover-meaning", "rule")));
    const dice = el("div", { class: "dice-row" });
    for (const word of reading.words) {
      const pill = el("span", { class: "keyword", title: `${word.table} ${word.roll}` });
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
    guidanceNote(mythicGuidance("noMeaning"), "ask-answers"),
    el("p", { class: "block-note" }, "The Elements tables come from ", elementsSource().section, ", ", elementsSource().title, ". ", citeLink("elements-tables", "what they are for")));

  const action = actionBar({
    label: reading.words.length ? "Roll another word" : "Roll a word",
    context: current.short,
    onClick: () => {
      reading.words.push(discover(reading.tableId));
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
