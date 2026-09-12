// unit: the Fate Check
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { rules, derived, store, oracle, sceneEngine, check, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- the Fate Check

test("the Fate Check's modifier tables match the page", () => {
  deepEqual(check.FATE_CHECK.oddsModifiers, {
    "certain": 5, "nearly-certain": 4, "very-likely": 2, "likely": 1, "50-50": 0,
    "unlikely": -1, "very-unlikely": -2, "nearly-impossible": -4, "impossible": -5
  }, "odds");
  deepEqual(check.FATE_CHECK.chaosModifiers, { 9: 5, 8: 4, 7: 2, 6: 1, 5: 0, 4: -1, 3: -2, 2: -4, 1: -5 }, "chaos");
  deepEqual(check.FATE_CHECK.dice, { count: 2, sides: 10 }, "2d10");
});

test("Mid-Chaos is the standard ladder compressed into the middle", () => {
  // +2/+1/0/-1/-2 are the standard modifiers for chaos 7/6/5/4/3 - so Mid-Chaos does not
  // change the arithmetic, it narrows how far chaos can push it.
  const mid = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => rules.checkChaosModifier(c, "mid-chaos"));
  deepEqual(mid, [-2, -1, -1, 0, 0, 0, 1, 1, 2], "the quoted bands: 1, 2-3, 4-6, 7-8, 9");
  const standard = check.FATE_CHECK.chaosModifiers;
  deepEqual([standard[3], standard[4], standard[5], standard[6], standard[7]], [-2, -1, 0, 1, 2],
    "and those five values are standard chaos 3 through 7");
  deepEqual([1, 5, 9].map((c) => rules.checkChaosModifier(c, "no-chaos")), [0, 0, 0], "No-Chaos flattens it entirely");
});

test("a Fate Check reads as thresholds, because modifiers push past the printed range", () => {
  // Printed: 18-20 Exceptional Yes, 11 or more Yes, 10 or less No, 2-4 Exceptional No.
  // 2d10 plus modifiers runs -8 to 30, so the printed ranges are read as thresholds (A34).
  const at = (dice, odds, chaos) => rules.checkResult(odds, dice, chaos).answer.key;
  equal(at([5, 6], "50-50", 5), "yes", "11 exactly is a Yes");
  equal(at([5, 5], "50-50", 5), "no", "10 is a No");
  equal(at([9, 9], "50-50", 5), "exceptional-yes", "18 is an Exceptional Yes");
  equal(at([8, 9], "50-50", 5), "yes", "17 is not");
  equal(at([2, 2], "50-50", 5), "exceptional-no", "4 is an Exceptional No");
  equal(at([2, 3], "50-50", 5), "no", "5 is not");
  equal(at([10, 10], "certain", 9), "exceptional-yes", "30, past the printed top, is still Exceptional Yes");
  equal(at([1, 1], "impossible", 1), "exceptional-no", "-8, past the printed bottom, is still Exceptional No");
});

test("the Fate Check adds both modifiers, and shows its working", () => {
  const result = rules.checkResult("likely", [4, 6], 7);
  equal(result.oddsMod, 1, "Likely is +1");
  equal(result.chaosMod, 2, "chaos 7 is +2");
  equal(result.total, 13, "4 + 6 + 1 + 2");
  equal(result.answer.key, "yes", "and 13 is a Yes");
});

test("a Fate Check random event is doubles at or under the Chaos Factor", () => {
  for (let face = 1; face <= 9; face += 1) {
    equal(rules.checkResult("50-50", [face, face], 9).double, true, `double ${face} at chaos 9`);
  }
  equal(rules.checkResult("50-50", [10, 10], 9).double, false, "a double 10 never fires: chaos stops at 9");
  equal(rules.checkResult("50-50", [6, 6], 5).double, false, "a double 6 at chaos 5 does not");
  equal(rules.checkResult("50-50", [5, 5], 5).double, true, "a double 5 at chaos 5 does");
  equal(rules.checkResult("50-50", [3, 4], 9).double, false, "and a non-double never does");
});

test("a d10 out of range is an error on the check too", () => {
  for (const bad of [[0, 5], [5, 11], [1.5, 2]]) {
    let threw = false;
    try { rules.checkResult("50-50", bad, 5); } catch { threw = true; }
    assert(threw, `${bad.join(",")} is not 2d10`);
  }
});

test("the ask engine uses whichever resolution the adventure is set to", () => {
  const adv = freshAdventure();
  equal(derived.resolutionMode(store.active()), "chart", "the chart by default");
  const onChart = oracle.ask({ question: "chart", odds: "50-50" });
  equal(onChart.dice, undefined, "a chart ask has no dice pair");
  store.setResolution(adv.id, "check");
  const onCheck = oracle.ask({ question: "check", odds: "50-50" });
  equal(onCheck.dice.length, 2, "a check rolls two d10");
  assert(Number.isInteger(onCheck.total), "and totals them");
  // F46: this asserted the row held exactly two dice, which is false ~5% of the time -
  // a double at or under the chaos fires a random event, whose focus and two words are
  // appended to the SAME row. Assert what is actually invariant: the check's own dice.
  const row = store.rollLog({ kind: "ask" }).find((r) => r.question === "check");
  const pair = row.dice.filter((d) => d.die === "d10");
  equal(pair.length, 2, "both dice are logged, as d10s");
  deepEqual(pair.map((d) => d.value), onCheck.dice, "with the rolled values");
  equal(row.dice.length, onCheck.double ? 5 : 2,
    "and a double appends the random event's focus and two words to the same row");
});

test("every chaos mode survives a switch of resolution, now that all three charts are in", () => {
  const adv = freshAdventure();
  for (const mode of ["mid-chaos", "low-chaos", "no-chaos", "random-chaos"]) {
    store.setResolution(adv.id, "check");
    store.setChaosMode(adv.id, mode);
    store.setResolution(adv.id, "chart");
    const reloaded = store.__setState(JSON.parse(store.exportJSON()));
    equal(derived.chaosMode(reloaded.adventures[0]), mode,
      `${mode} is kept on the chart - it was only dropped while its chart was unsupplied`);
  }
});

test("the three variant Fate Charts are transcribed, and each is a slice of the standard chart", () => {
  const std = rules.fateChart();
  const equivalence = rules.variantEquivalence();
  let cells = 0;
  for (const variant of rules.chartVariants()) {
    const columns = equivalence[variant.key];
    equal(variant.columns.length, columns.length, `${variant.key} has one equivalence per column`);
    equal(variant.rows.length, 9, `${variant.key} has all nine odds rows`);
    for (const row of variant.rows) {
      const standard = std.rows.find((r) => r.key === row.key);
      assert(standard, `${variant.key}: ${row.key} is a real odds row`);
      row.cells.forEach((cell, i) => {
        cells += 1;
        deepEqual(cell, standard.cells[columns[i] - 1],
          `${variant.key} ${row.key} column ${variant.columns[i].label} is standard chaos ${columns[i]}`);
      });
    }
    // the columns must cover 1-9 with no gap and no overlap
    for (let chaos = 1; chaos <= 9; chaos += 1) {
      const hits = variant.columns.filter((c) => chaos >= c.min && chaos <= c.max);
      equal(hits.length, 1, `${variant.key}: exactly one column holds chaos ${chaos}`);
    }
  }
  equal(cells, 81, "all 81 variant cells checked against the standard chart");
});

test("a chaos mode changes which chart is read, not which column of the standard one", () => {
  // Mid-Chaos at chaos 9 is the standard chart at 7; at chaos 1 it is the standard at 3.
  deepEqual(rules.fateBands("50-50", 9, "mid-chaos").yes, rules.fateBands("50-50", 7).yes,
    "Mid-Chaos at its top is the standard chart at 7");
  deepEqual(rules.fateBands("50-50", 1, "mid-chaos").yes, rules.fateBands("50-50", 3).yes,
    "and at its bottom, the standard chart at 3");
  deepEqual(rules.fateBands("50-50", 9, "low-chaos").yes, rules.fateBands("50-50", 6).yes,
    "Low-Chaos tops out at the standard chart's 6");
  for (const chaos of [1, 5, 9]) {
    deepEqual(rules.fateBands("50-50", chaos, "no-chaos").yes, rules.fateBands("50-50", 5).yes,
      `No-Chaos reads the same band whatever the chaos (${chaos})`);
  }
  // and the mode reports which chart it used, so the answer card can say so
  equal(rules.fateBands("50-50", 4, "mid-chaos").chart.name, "Mid-Chaos Fate Chart", "named");
  equal(rules.fateBands("50-50", 4, "mid-chaos").column.label, "4-6", "with its column");
  equal(rules.fateBands("50-50", 4).chart.name, "Fate Chart", "standard by default");
});

test("the Low-Chaos Fate Check modifiers match the page", () => {
  const check = rules.fateCheck();
  for (const [chaos, mod] of [[9, 1], [8, 1], [7, 0], [5, 0], [3, 0], [2, -1], [1, -1]]) {
    equal(check.lowChaosModifiers[chaos], mod, `chaos ${chaos} is ${mod}`);
    equal(rules.checkChaosModifier(chaos, "low-chaos"), mod, "and the engine reads it");
  }
  // Low-Chaos on the Check is the standard ladder at chaos 6/5/4 - the same compression
  // the Low-Chaos CHART turned out to be
  for (const [low, standard] of [[9, 6], [5, 5], [1, 4]]) {
    equal(rules.checkChaosModifier(low, "low-chaos"), rules.checkChaosModifier(standard, "standard"),
      `Low-Chaos at ${low} is the standard ladder at ${standard}`);
  }
});

test("the track is phases of five, and a phase without a flashpoint is owed one", () => {
  const adv = freshAdventure();
  store.addListItem(adv.id, "threads", "Find the mole");
  const thread = derived.listItems(store.active(), "threads")[0];
  store.setTrack(adv.id, { threadId: thread.id, length: 10, points: 0, awards: [], concluded: false, conclusion: null });

  let phases = derived.trackPhases(store.active());
  equal(phases.length, 2, "a 10-point track is two phases");
  deepEqual(phases.map((p) => [p.from, p.to]), [[1, 5], [6, 10]], "of five points each");
  assert(phases.every((p) => !p.flashpoint && !p.complete), "and starts empty");
  equal(derived.owedFlashpoint(store.active()), null, "nothing owed yet");

  // three lots of progress: 6 points, so the first phase is finished with no flashpoint
  for (let i = 0; i < 3; i += 1) {
    store.awardTrack(adv.id, { key: "progress", kind: "progress", label: "Progress", points: 2 });
  }
  phases = derived.trackPhases(store.active());
  equal(phases[0].complete, true, "the first phase is crossed");
  equal(phases[0].flashpoint, false, "and no flashpoint happened in it");
  equal(derived.owedFlashpoint(store.active()).index, 0, "so the track owes one");
});

test("a flashpoint inside a phase satisfies it, so the track triggers nothing", () => {
  const adv = freshAdventure();
  store.addListItem(adv.id, "threads", "Find the mole");
  const thread = derived.listItems(store.active(), "threads")[0];
  store.setTrack(adv.id, { threadId: thread.id, length: 10, points: 0, awards: [], concluded: false, conclusion: null });
  // 2 progress + 1 flashpoint = 6 points, crossing the same threshold
  store.awardTrack(adv.id, { key: "progress", kind: "progress", label: "Progress", points: 2 });
  store.awardTrack(adv.id, { key: "flashpoint", kind: "flashpoint", label: "Flashpoint", points: 2 });
  store.awardTrack(adv.id, { key: "progress", kind: "progress", label: "Progress", points: 2 });
  const phases = derived.trackPhases(store.active());
  equal(phases[0].complete, true, "the phase is crossed");
  equal(phases[0].flashpoint, true, "and it had its flashpoint");
  equal(derived.owedFlashpoint(store.active()), null,
    "so nothing is owed - the book's own worked example, where a flashpoint at 6 points stops the trigger");
});

test("a delayed conclusion is not tested against the Chaos Factor", () => {
  const adv = freshAdventure();
  store.addListItem(adv.id, "threads", "Find the mole");
  const thread = derived.listItems(store.active(), "threads")[0];
  store.setTrack(adv.id, { threadId: thread.id, length: 10, points: 10, awards: [], concluded: true,
    conclusion: { focus: { key: "current-context", label: "Current Context" }, words: [] } });
  store.setChaos(adv.id, 9);                      // at chaos 9 a tested scene almost never holds
  const scene = sceneEngine.testScene(store.active(), { expectation: "the confrontation" });
  equal(scene.test.untested, true, "the conclusion's scene is not tested");
  equal(scene.test.d10, null, "no die is rolled");
  equal(scene.test.kind, "expected", "it begins as imagined, which is what the track guarantees");
  // and the guarantee is spent: the next scene is tested again
  sceneEngine.endScene(store.active(), "in");
  const next = sceneEngine.testScene(store.active(), {});
  equal(next.test.untested, false, "the scene after it is tested normally");
  assert(Number.isInteger(next.test.d10), "with a real die");
});
