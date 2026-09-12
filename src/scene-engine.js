// scene-engine.js — the Mythic scene loop as pure state changes: test the expected
// scene, build an interrupt, roll adjustments, roll on a list, end the scene. No DOM.
// Split out of scenes.js, which had grown to the screen AND the engine AND the lists
// AND the track (docs/AUDIT.md, cycle 12).

import { die, uid, now } from "./core.js";
import { chaosRule, sceneTestRule, sceneOutcome, clampChaos, listKind, sceneAdjustment, sceneAdjustmentTable, listSelectionRule, activeSections, sectionFromRoll, lineFromRoll, chaosMode as chaosModeRule, randomChaosDelta } from "./rules.js";
import { chaos, currentScene, sceneCount, listItems, chaosMode as chaosModeOf, track as trackOf, trackComplete } from "./derived.js";
import { rollEvent } from "./oracle.js";
import * as store from "./store.js";

/**
 * A conclusion rolled but not yet played, waiting for the next scene. The book: come up
 * with the expected scene including the conclusion, and do NOT test it against the Chaos
 * Factor, because the track guarantees it begins as imagined.
 */
function carriedConclusion(adv) {
  const t = trackOf(adv);
  return Boolean(t && t.conclusion && !t.conclusionPlayed && trackComplete(adv) && !currentScene(adv));
}

// ------------------------------------------------------------------ engine
/**
 * Test the expected scene. One d10 against the Chaos Factor: over it and the scene runs
 * as you pictured; at or under it, odd alters and even interrupts.
 *
 * One exception, and it is the Progress Track's: a conclusion delayed to this scene is
 * NOT tested. The track has already guaranteed the scene begins as you imagine it, so
 * there is no die to roll.
 */
export function testScene(adv, { expectation = "" } = {}) {
  const level = chaos(adv);
  const carries = carriedConclusion(adv);
  const d10 = carries ? null : die(sceneTestRule().die);
  const outcome = carries
    ? { key: "expected", label: sceneOutcome(10, 1).label }
    : sceneOutcome(d10, level);
  const scene = {
    id: uid("scene"),
    n: sceneCount(adv) + 1,
    test: { d10, chaos: level, kind: outcome.key, label: outcome.label, untested: carries },
    expectation: String(expectation || "").trim(),
    notes: "", adjustments: [], words: [], control: null,
    discoveryClosed: false,
    startedAt: now(), endedAt: null
  };
  const saved = store.addScene(adv.id, scene);
  if (carries) {
    store.setTrack(adv.id, { conclusionPlayed: true });   // the guarantee is spent
    store.record(adv.id, "scene", `Scene ${scene.n} begins as expected, untested: the Progress Track's conclusion guarantees it.`);
    return saved;
  }
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    question: scene.expectation,
    dice: [{ die: "d10", value: d10, table: `Scene test against chaos ${level}` }],
    summary: outcome.label,
    outcome: `Scene ${scene.n}: ${outcome.label} (${d10} vs chaos ${level})`
  });
  store.record(adv.id, "scene", `Scene ${scene.n}: ${outcome.label} (d10 ${d10} against chaos ${level}).`);
  return saved;
}

/** An Interrupt is generated exactly like a random event: a Focus, then its meaning. */
export function interruptEvent(adv, scene) {
  const event = rollEvent();
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    dice: [
      { die: "d100", value: event.focus.roll, table: "Random Event Focus" },
      ...event.words.map((w) => ({ die: "d100", value: w.roll, table: w.table }))
    ],
    summary: `${event.focus.label}: ${event.words.map((w) => w.word).join(", ")}`,
    outcome: `Interrupt scene: ${event.focus.label}`
  });
  store.updateScene(adv.id, scene.id, { event });
  store.record(adv.id, "scene", `Interrupt: ${event.focus.label} - ${event.words.map((w) => w.word).join(", ")}.`);
  return event;
}

/** One roll on the Scene Adjustment Table. 7-10 is "make 2 adjustments" (ruling A27). */
export function rollAdjustments(adv, scene) {
  const rolls = [];
  const results = [];
  const expand = (depth) => {
    if (depth > 4) return;
    const roll = die(sceneAdjustmentTable().die);
    rolls.push(roll);
    const row = sceneAdjustment(roll);
    if (row.special === "double") { expand(depth + 1); expand(depth + 1); return; }
    results.push({ key: row.key, label: row.label, text: row.text, roll });
  };
  expand(0);
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    dice: rolls.map((value) => ({ die: "d10", value, table: "Scene Adjustment" })),
    summary: results.map((r) => r.label).join(" + "),
    outcome: `Scene ${scene.n} altered: ${results.map((r) => r.label).join(" + ")}`
  });
  store.updateScene(adv.id, scene.id, { adjustments: [...(scene.adjustments || []), ...results] });
  return results;
}

/**
 * Picking an entry from a list, the book's way: a section die sized to the active
 * sections, then 1d10 for the line inside it. A blank line is a "Choose" result.
 */
export function rollFromList(adv, kind) {
  const rule = listSelectionRule();
  const lines = [];
  for (const item of listItems(adv, kind)) for (let i = 0; i < item.entries; i += 1) lines.push(item);
  const sectionRule = activeSections(lines.length);
  const dice = [];
  let section = 1;
  if (sectionRule.die) {
    const roll = die(sectionRule.die);
    dice.push({ die: `d${sectionRule.die}`, value: roll, table: `${listKind(kind).label} list - section` });
    section = Math.min(sectionRule.sections, sectionFromRoll(roll));
  }
  const lineRoll = die(rule.lineDie);
  dice.push({ die: "d10", value: lineRoll, table: `${listKind(kind).label} list - line` });
  const index = (section - 1) * 5 + (lineFromRoll(lineRoll) - 1);
  const item = lines[index] || null;

  store.pushLog({
    adventureId: adv.id,
    kind: "list",
    dice,
    summary: item ? item.text : "Choose",
    outcome: item ? `${listKind(kind).label}: ${item.text}` : `${listKind(kind).label}: blank line - Choose`
  });
  return { item, section, line: lineFromRoll(lineRoll), lines: lines.length, dice, choose: !item };
}

/**
 * Bookkeeping: the scene ends, the lists have been updated, and the Chaos Factor moves
 * one step by whether the characters held control. Snapshots first, so it is undoable.
 */
export function endScene(adv, control) {
  const scene = currentScene(adv);
  if (!scene) return { ok: false, reason: "No scene is running." };

  const mode = chaosModeRule(chaosModeOf(adv));
  const before = chaos(adv);
  let rule = null;
  let roll = null;
  let delta = 0;

  if (mode.rollsAtSceneEnd) {
    // Random Chaos: a d10 at the end of the scene decides, not your reading of it.
    roll = die(sceneTestRule().die);
    delta = randomChaosDelta(roll, before);
    rule = { key: "random", label: `Random Chaos (d10 ${roll} against ${before})`, delta };
  } else {
    rule = chaosRule().controls.find((c) => c.key === control);
    if (!rule) return { ok: false, reason: "Say whether the characters were in control." };
    delta = rule.delta;
  }

  store.snapshot(`ending scene ${scene.n}`);
  const after = clampChaos(before + delta);
  store.updateScene(adv.id, scene.id, { control: mode.rollsAtSceneEnd ? "random" : control, endedAt: now() });
  store.setChaos(adv.id, after);
  if (roll !== null) {
    store.pushLog({
      adventureId: adv.id,
      kind: "scene",
      dice: [{ die: "d10", value: roll, table: `Random Chaos against ${before}` }],
      summary: delta < 0 ? "chaos down" : "chaos up",
      outcome: `Random Chaos: ${before} \u2192 ${after}`
    });
  }
  store.record(adv.id, "bookkeeping",
    `Scene ${scene.n} ended ${rule.label.toLowerCase()}; chaos ${before} → ${after}.`);

  const summary = [
    `Scene ${scene.n} is closed as "${rule.label}".`,
    before === after
      ? `The Chaos Factor stays at ${after} - it is already at its ${delta < 0 ? "floor" : "ceiling"}.`
      : `The Chaos Factor moves ${before} to ${after}.`
  ];
  return { ok: true, summary, before, after, scene, roll };
}
