// rules.js — pure lookups over the data files. No state, no DOM.
// One lookup per kind of thing (§10.16): every Focus table goes through lookupRange.

import {
  VILLAIN_PLAN_FOCUS, END_GOAL_FOCUS, PIVOT_PLAN_FOCUS,
  PLOT_TWISTS, ARC_STAGES, PIVOT_GATE, END_GOAL_ROLL, GUIDANCE, SOURCE, FATE_ANSWERS
} from "../data.js";
import { LIBRARY, LIBRARY_GROUPS, TUTORIAL, EXAMPLES } from "../data-library.js";
import {
  ASK_ODDS, ASK_ANSWERS, ASK_PROCEDURE, RANDOM_EVENT, DISCOVER_MEANING,
  MYTHIC_GUIDANCE, MYTHIC_SOURCE, STILL_NOT_IN_SOURCE
} from "../data-mythic.js";
import {
  VILLAIN_ARCHETYPES, VILLAIN_ORGANIZATIONS, UNDERLINGS, CRAFTER_GUIDANCE,
  CRAFTER_SOURCE, SPECIAL
} from "../data-villain-crafter.js";
import { ELEMENT_TABLES, ELEMENTS_SOURCE, VILLAIN_DETAIL_TABLES } from "../data-elements.js";
import {
  CHAOS, SCENE_TEST, SCENE_ADJUSTMENTS, LISTS, BOOKKEEPING, NOT_SUPPLIED, SCENES_SOURCE
} from "../data-scenes.js";
import { WEIGHTED_PICK } from "../data-house.js";

const FOCUS = {
  phase: VILLAIN_PLAN_FOCUS,
  endgoal: END_GOAL_FOCUS,
  pivot: PIVOT_PLAN_FOCUS
};

/** The Focus table a reveal of this kind reads. */
export function focusTableFor(kind) {
  const table = FOCUS[kind];
  if (!table) throw new Error(`no Focus table for reveal kind "${kind}"`);
  return table;
}

/** Range lookup shared by all three Focus tables. Throws rather than guessing. */
export function lookupRange(table, roll) {
  const row = table.rows.find((r) => roll >= r.min && roll <= r.max);
  if (!row) throw new Error(`${table.name}: roll ${roll} is outside the table`);
  return { ...row, table: table.id, tableName: table.name, roll, cite: table.cite, noContext: !!row.noContext };
}

/** Keyword lookup, 1..100. */
export function keyword(roll) {
  const word = PLOT_TWISTS.words[roll - 1];
  if (!word) throw new Error(`Plot Twists: roll ${roll} is outside the table`);
  return { roll, word, table: PLOT_TWISTS.id, cite: PLOT_TWISTS.cite };
}

// ---------------------------------------------------------------- Villain Crafter
export const SPECIAL_KEYS = SPECIAL;
export const archetypeTable = () => VILLAIN_ARCHETYPES;
export const organizationTable = () => VILLAIN_ORGANIZATIONS;
export const underlingTable = () => UNDERLINGS;
export const crafterGuidance = (key) => CRAFTER_GUIDANCE[key] || null;
export const crafterSource = () => CRAFTER_SOURCE;

/**
 * Range lookup for the Crafter tables, whose top and bottom bands are open-ended -
 * that is what absorbs a modifier pushing a roll past 100 or under 1 (ruling A21).
 */
export function lookupOpen(table, total) {
  const row = table.rows.find((r) => total >= r.min && total <= r.max);
  if (!row) throw new Error(`${table.name}: ${total} is outside the table`);
  return row;
}

// ---------------------------------------------------------------- scenes & chaos
export const chaosRule = () => CHAOS;
export const sceneTestRule = () => SCENE_TEST;
export const sceneAdjustments = () => SCENE_ADJUSTMENTS;
export const listsRule = () => LISTS;
export const bookkeepingSteps = () => BOOKKEEPING.steps;
export const notSupplied = () => NOT_SUPPLIED;
export const scenesSource = () => SCENES_SOURCE;
export const housePick = () => WEIGHTED_PICK;

export function listKind(key) {
  return LISTS.kinds.find((k) => k.key === key) || LISTS.kinds[0];
}

/**
 * The scene test: roll over the Chaos Factor and the scene is as expected; at or under it,
 * an odd roll alters and an even roll interrupts (GME2e, via summary - provisional).
 */
export function sceneOutcome(d10, chaos) {
  if (d10 > chaos) return SCENE_TEST.outcomes.find((o) => o.key === "expected");
  return SCENE_TEST.outcomes.find((o) => o.key === (d10 % 2 === 1 ? "altered" : "interrupt"));
}

export function clampChaos(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return CHAOS.start;
  return Math.min(CHAOS.max, Math.max(CHAOS.min, Math.round(n)));
}

export function arcStage(key) {
  return ARC_STAGES.find((s) => s.key === key) || ARC_STAGES[0];
}
export function arcLabel(key) { return arcStage(key).label; }

export const pivotGate = () => PIVOT_GATE;
export const endGoalRule = () => END_GOAL_ROLL;
export const guidance = (key) => GUIDANCE[key] || null;
export const source = () => SOURCE;
export const fateAnswers = () => FATE_ANSWERS;

export function libraryEntry(id) { return LIBRARY.find((e) => e.id === id) || null; }
export function libraryGroups() {
  return LIBRARY_GROUPS.map((g) => ({ ...g, entries: LIBRARY.filter((e) => e.group === g.key) }))
    .filter((g) => g.entries.length > 0);
}
export function searchLibrary(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return LIBRARY.filter((e) => `${e.title} ${e.body}`.toLowerCase().includes(q));
}
export const tutorialSteps = () => TUTORIAL;
export const examples = () => EXAMPLES;

// ---------------------------------------------------------------- One-Page Mythic
export const askOdds = () => ASK_ODDS;
export const askProcedure = () => ASK_PROCEDURE;
export const randomEventRule = () => RANDOM_EVENT;
export const mythicGuidance = (key) => MYTHIC_GUIDANCE[key] || null;
export const mythicSource = () => MYTHIC_SOURCE;
export const stillNotInSource = () => STILL_NOT_IN_SOURCE;

export function oddsRow(key) {
  return ASK_ODDS.find((o) => o.key === key) || ASK_ODDS.find((o) => o.default) || ASK_ODDS[0];
}
export function defaultOdds() { return (ASK_ODDS.find((o) => o.default) || ASK_ODDS[0]).key; }

/** A double-digit d100 result, which also fires a Random Event (OPM). 100 is not one. */
function isDouble(roll) { return RANDOM_EVENT.doubles.includes(roll); }

/** Read one d100 against one odds row. Throws rather than guessing. */
export function askResult(oddsKey, roll) {
  const odds = oddsRow(oddsKey);
  const band = ["exYes", "yes", "no", "exNo"].find((k) => roll >= odds[k][0] && roll <= odds[k][1]);
  if (!band) throw new Error(`Ask The Game Master: roll ${roll} is outside the ${odds.label} row`);
  const answerKey = { exYes: "exceptional-yes", yes: "yes", no: "no", exNo: "exceptional-no" }[band];
  const answer = ASK_ANSWERS.find((a) => a.key === answerKey);
  return { odds, roll, answer, double: isDouble(roll) };
}

/**
 * Every meaning table the app can roll, from whichever source, behind one lookup.
 * `span` is how many d100 results each word covers: One-Page Mythic prints 50 rows over
 * 100 numbers, the Elements tables print 100.
 */
const MEANING_TABLES = [
  ...DISCOVER_MEANING.columns.map((column, i) => ({
    id: `meaning-${column.key}`,
    key: column.key,
    label: `Discover Meaning: ${column.label}`,
    short: column.label,
    group: "Discover Meaning",
    use: column.use,
    cite: DISCOVER_MEANING.cite,
    span: 2,
    words: DISCOVER_MEANING.rows.map((row) => row[i])
  })),
  ...ELEMENT_TABLES.map((table) => ({
    id: table.id,
    key: table.id,
    label: table.label,
    short: table.label,
    group: "Elements",
    use: table.use,
    cite: table.cite,
    span: 1,
    words: table.words
  }))
];

export const meaningTables = () => MEANING_TABLES.map(({ words, ...rest }) => rest);
export function meaningTable(id) {
  return MEANING_TABLES.find((t) => t.id === id || t.key === id) || null;
}
export const elementsSource = () => ELEMENTS_SOURCE;
/** The tables The Villain Crafter names for fleshing out a villain (MM41:p5). */
export const villainDetailTables = () => VILLAIN_DETAIL_TABLES.map((id) => meaningTable(id)).filter(Boolean);

/** One word from one meaning table. Throws rather than guessing. */
export function meaningWord(tableId, roll) {
  const table = meaningTable(tableId);
  if (!table) throw new Error(`no meaning table "${tableId}"`);
  const word = table.words[Math.floor((roll - 1) / table.span)];
  if (!word) throw new Error(`${table.label}: roll ${roll} is outside the table`);
  return { tableId: table.id, table: table.label, roll, word, cite: table.cite };
}
