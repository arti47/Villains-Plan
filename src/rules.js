// rules.js — pure lookups over the data files. No state, no DOM.
// One lookup per kind of thing (§10.16): every Focus table goes through lookupRange.

import {
  VILLAIN_PLAN_FOCUS, END_GOAL_FOCUS, PIVOT_PLAN_FOCUS,
  PLOT_TWISTS, ARC_STAGES, PIVOT_GATE, END_GOAL_ROLL, GUIDANCE, SOURCE, FATE_ANSWERS
} from "../data.js";
import { LIBRARY, LIBRARY_GROUPS, TUTORIAL, EXAMPLES } from "../data-library.js";

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
