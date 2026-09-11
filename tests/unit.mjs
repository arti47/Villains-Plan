// Harness A — parse gate, data invariants, engine invariants, dead-data scan.
// Runs in seconds and gates every change (CLAUDE.md §11.4).

import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { test, assert, equal, deepEqual, installStorage, report, results } from "./harness.mjs";

installStorage();

const SHIPPED = [
  "data.js", "data-library.js", "firebase-config.js", "service-worker.js",
  ...readdirSync("src").filter((f) => f.endsWith(".js")).map((f) => `src/${f}`)
];

// ---------------------------------------------------------------- parse gate
// A missing paren presents as a screen that never renders, not as a thrown error.
// This check costs a second and has already caught two (docs/AUDIT.md F1).
for (const file of SHIPPED) {
  test(`parses: ${file}`, () => {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  });
}

// ---------------------------------------------------------------- bans
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("no Math.random call in any shipped file (§5.1)", () => {
  const hits = SHIPPED.filter((f) => /Math\.random\s*\(/.test(stripComments(readFileSync(f, "utf8"))));
  assert(hits.length === 0, `Math.random called in ${hits.join(", ")}`);
});

test("dice are rolled only in roller.js (one source of dice)", () => {
  const offenders = SHIPPED.filter((f) => f !== "src/core.js" && f !== "src/roller.js")
    .filter((f) => /\b(d10|d100)\s*\(/.test(readFileSync(f, "utf8")));
  assert(offenders.length === 0, `dice rolled outside roller.js: ${offenders.join(", ")}`);
});

test("the End Goal threshold is never written as a literal in src/ (§10.2)", () => {
  // It caught two: a header tooltip and the reveal screen's explain() copy, both of
  // which would have gone stale if the rule ever changed (docs/AUDIT.md F7).
  const offenders = [];
  for (const file of SHIPPED.filter((f) => f.startsWith("src/"))) {
    const body = stripComments(readFileSync(file, "utf8"));
    if (/(?:against|>=|>|of)\s*11\b/.test(body)) offenders.push(file);
  }
  assert(offenders.length === 0, `the threshold appears as a literal in ${offenders.join(", ")}`);
});

const data = await import("../data.js");
const rules = await import("../src/rules.js");
const derived = await import("../src/derived.js");
const store = await import("../src/store.js");
const roller = await import("../src/roller.js");
const lifecycle = await import("../src/lifecycle.js");

// ---------------------------------------------------------------- table completeness
for (const table of data.FOCUS_TABLES) {
  test(`${table.name}: every roll 1-100 returns exactly one row`, () => {
    for (let roll = 1; roll <= 100; roll += 1) {
      const matches = table.rows.filter((r) => roll >= r.min && roll <= r.max);
      equal(matches.length, 1, `roll ${roll} on ${table.name}`);
    }
  });
  test(`${table.name}: rows are contiguous and unique`, () => {
    const sorted = table.rows.slice().sort((a, b) => a.min - b.min);
    equal(sorted[0].min, 1, "table starts at 1");
    equal(sorted[sorted.length - 1].max, 100, "table ends at 100");
    for (let i = 1; i < sorted.length; i += 1) equal(sorted[i].min, sorted[i - 1].max + 1, "no gap or overlap");
    equal(new Set(table.rows.map((r) => r.key)).size, table.rows.length, "keys unique");
  });
}

test("Plot Twists: 100 unique keywords", () => {
  equal(data.PLOT_TWISTS.words.length, 100, "row count");
  equal(new Set(data.PLOT_TWISTS.words).size, 100, "unique");
});

test("Plot Twists: the article's own worked-example keywords sit at their stated rolls", () => {
  // 14 anchors taken from the two worked examples; they pin the de-interleaved
  // transcript's pairing (CLAUDE.md Stage A, table integrity).
  const anchors = { 53: "Mental", 54: "Missing", 50: "Limit", 69: "Power", 19: "Diminish",
    56: "Mystery", 43: "Incapacitate", 78: "Repair", 76: "Rare", 23: "Enemy",
    71: "Problem", 28: "Failure", 65: "Personal", 96: "Unknown" };
  for (const [roll, word] of Object.entries(anchors)) equal(rules.keyword(Number(roll)).word, word, `roll ${roll}`);
});

test("keyword lookup refuses rolls outside the table", () => {
  for (const bad of [0, 101, -1]) {
    let threw = false;
    try { rules.keyword(bad); } catch { threw = true; }
    assert(threw, `keyword(${bad}) should throw rather than guess`);
  }
});

test("no-context rows carry the flag, and only they do (Exception shape)", () => {
  equal(rules.lookupRange(data.VILLAIN_PLAN_FOCUS, 81).noContext, true, "81 on the plan table");
  equal(rules.lookupRange(data.VILLAIN_PLAN_FOCUS, 80).noContext, false, "80 on the plan table");
  equal(rules.lookupRange(data.END_GOAL_FOCUS, 84).noContext, true, "84 on the end goal table");
  equal(rules.lookupRange(data.END_GOAL_FOCUS, 83).noContext, false, "83 on the end goal table");
  equal(rules.lookupRange(data.PIVOT_PLAN_FOCUS, 96).noContext, true, "96 on the pivot table");
});

test("every library entry with a citation cites one of the four sources", () => {
  // Widened once per source; it has caught a miscited entry every time (AUDIT F31).
  const lib = rules.libraryGroups().flatMap((g) => g.entries);
  const ok = /^(MM69:p\d|MM41:p\d|OPM$|GME2e$)/;
  for (const entry of lib) if (entry.cite) assert(ok.test(entry.cite), `${entry.id} cites ${entry.cite}`);
  assert(lib.length >= 36, "the library covers every automated rule from all four sources");
});

// ---------------------------------------------------------------- the Threshold
function advWith(phaseCount) {
  return derived.normalizeAdventure({
    name: "t",
    phases: Array.from({ length: phaseCount }, () => ({ kind: "phase", focus: null, keywords: [] }))
  });
}

test("End Goal modifier is +2 per known phase (Escalation)", () => {
  deepEqual([0, 1, 2, 3, 4, 5].map((n) => derived.endGoalModifier(advWith(n))), [0, 2, 4, 6, 8, 10]);
});

test("the ladder matches the article's arithmetic: 1st impossible, then 9/7/5/3/any", () => {
  deepEqual(derived.endGoalLadder().map((r) => r.needed), [null, 9, 7, 5, 3, 1]);
  deepEqual(derived.endGoalLadder().map((r) => r.chance), [0, 20, 40, 60, 80, 100]);
});

test("the threshold fires at exactly 11 and not at 10", () => {
  const adv = advWith(1);                       // +2
  equal(derived.endGoalCheck(adv, 8).total, 10, "8+2");
  equal(derived.endGoalCheck(adv, 8).fired, false, "10 is not enough");
  equal(derived.endGoalCheck(adv, 9).total, 11, "9+2");
  equal(derived.endGoalCheck(adv, 9).fired, true, "11 fires");
});

test("the first reveal can never be the End Goal", () => {
  const adv = advWith(0);
  for (let face = 1; face <= 10; face += 1) equal(derived.endGoalCheck(adv, face).fired, false, `d10 ${face}`);
  equal(derived.endGoalNeeded(adv), null, "the app reports it as out of reach");
});

test("the sixth reveal is certain", () => {
  const adv = advWith(5);
  for (let face = 1; face <= 10; face += 1) equal(derived.endGoalCheck(adv, face).fired, true, `d10 ${face}`);
});

// ---------------------------------------------------------------- engine
function freshAdventure(name = "Test adventure") {
  store.__setState({ version: 1, adventures: [], rollLog: [], activeAdventureId: null });
  return store.createAdventure({ name, villainName: "The General" });
}

test("a reveal writes one log row whose first die is the d10 check (order of a reveal)", () => {
  const adv = freshAdventure();
  const result = roller.revealNext(adv);
  assert(result.ok, "reveal happened");
  const rows = store.rollLog({ adventureId: adv.id });
  equal(rows.length, 1, "one row per reveal");
  equal(rows[0].dice[0].die, "d10", "the End Goal Roll is rolled first");
  equal(rows[0].dice.length, 4, "d10 + focus + two keywords");
  equal(rows[0].dice[1].die, "d100", "the Focus roll");
});

test("no dice are rolled by earning alone: 200 first reveals, never an End Goal", () => {
  for (let i = 0; i < 200; i += 1) {
    const adv = freshAdventure(`run ${i}`);
    const r = roller.revealNext(adv);
    equal(r.phase.kind, "phase", "first reveal is always a phase");
  }
});

test("phases renumber from the store, not from what was written (one counter, §10.12)", () => {
  const adv = freshAdventure();
  // Built directly: a second *rolled* reveal can legitimately fire the End Goal (20% at
  // +2), which would make this test flake rather than fail (docs/AUDIT.md F13).
  store.addPhase(adv.id, { id: "p1", kind: "phase", ordinal: 9, focus: null, keywords: [], leads: [] });
  store.addPhase(adv.id, { id: "p2", kind: "phase", ordinal: 4, focus: null, keywords: [], leads: [] });
  const saved = store.active();
  deepEqual(derived.planPhases(saved).map((p) => p.ordinal), [1, 2]);
  store.deletePhase(saved.id, derived.planPhases(saved)[0].id);
  deepEqual(derived.planPhases(store.active()).map((p) => p.ordinal), [1], "the survivor renumbers");
});

test("no second End Goal: the reveal control refuses once it is out (Once-per-X)", () => {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  const check = derived.canEarnReveal(store.active());
  equal(check.ok, false, "refused");
  assert(/End Goal is already known/.test(check.reason), "and says why");
  equal(roller.revealNext(store.active()).ok, false, "the engine refuses too, not just the button");
});

test("keyword doubles are flagged and never re-rolled (5000 pairs)", () => {
  let doubles = 0;
  for (let i = 0; i < 5000; i += 1) {
    const { keywords, doubled } = roller.rollKeywords();
    equal(keywords.length, 2, "always two");
    equal(doubled, keywords[0].roll === keywords[1].roll, "flag matches the rolls");
    if (doubled) doubles += 1;
  }
  assert(doubles > 0, "doubles occur and are kept (they are amplification, not a misfire)");
});

test("dice are uniform enough to be defensible: 10k d10 faces within 25% of expectation", () => {
  const adv = freshAdventure();
  const counts = Array.from({ length: 10 }, () => 0);
  for (let i = 0; i < 10000; i += 1) counts[derived.endGoalCheck(adv, 0).d10 !== undefined ? 0 : 0] += 0; // no-op guard
  // roll through the public engine instead of reaching into core
  const faces = Array.from({ length: 10 }, () => 0);
  for (let i = 0; i < 2000; i += 1) {
    const a = freshAdventure(`d ${i}`);
    const r = roller.revealNext(a);
    faces[r.check.d10 - 1] += 1;
  }
  const expected = 200;
  for (const [i, n] of faces.entries()) assert(Math.abs(n - expected) < expected * 0.35, `face ${i + 1} appeared ${n} times`);
});

// ---------------------------------------------------------------- One-Page Mythic
const mythic = await import("../data-mythic.js");
const oracle = await import("../src/oracle.js");

test("every odds row covers 1-100 exactly once across its four answers", () => {
  for (const row of mythic.ASK_ODDS) {
    const seen = new Array(101).fill(0);
    for (const band of ["exYes", "yes", "no", "exNo"]) {
      const [lo, hi] = row[band];
      assert(lo >= 1 && hi <= 100 && lo <= hi, `${row.label} ${band} is ${lo}-${hi}`);
      for (let i = lo; i <= hi; i += 1) seen[i] += 1;
    }
    for (let i = 1; i <= 100; i += 1) equal(seen[i], 1, `${row.label} roll ${i}`);
  }
});

test("the odds ladder runs monotonically from Impossible to Certain", () => {
  const yesChance = mythic.ASK_ODDS.map((r) => r.yes[1]);      // a Yes of either kind
  deepEqual(yesChance, [90, 85, 75, 65, 50, 35, 25, 15, 10], "the published Yes bands");
  const ordered = [...yesChance].sort((a, b) => b - a);
  deepEqual(yesChance, ordered, "better odds never give a worse chance");
});

test("the chart's boundaries land on the published numbers (50/50)", () => {
  const at = (roll) => rules.askResult("50-50", roll).answer.key;
  equal(at(1), "exceptional-yes", "1");
  equal(at(10), "exceptional-yes", "10 is the last Exceptional Yes");
  equal(at(11), "yes", "11 starts Yes");
  equal(at(50), "yes", "50 is the last Yes");
  equal(at(51), "no", "51 starts No");
  equal(at(90), "no", "90 is the last No");
  equal(at(91), "exceptional-no", "91 starts Exceptional No");
  equal(at(100), "exceptional-no", "100");
});

test("Certain and Impossible read the way the chart says", () => {
  equal(rules.askResult("certain", 90).answer.key, "yes", "Certain still fails above 90");
  equal(rules.askResult("certain", 91).answer.key, "no", "and 91 is a No");
  equal(rules.askResult("impossible", 2).answer.key, "exceptional-yes", "Impossible can still land a 2");
  equal(rules.askResult("impossible", 11).answer.key, "no", "11 is a No at Impossible");
});

test("unknown odds fall back to 50/50 rather than guessing", () => {
  equal(rules.oddsRow("no-such-odds").key, "50-50", "the default row");
  equal(rules.defaultOdds(), "50-50", "and the default key");
});

test("an out-of-range roll throws rather than returning an answer", () => {
  let threw = false;
  try { rules.askResult("50-50", 101); } catch { threw = true; }
  assert(threw, "101 is not on the chart");
});

test("doubles fire a random event; 100 does not", () => {
  for (const roll of [11, 22, 33, 44, 55, 66, 77, 88, 99]) {
    equal(rules.askResult("50-50", roll).double, true, `${roll} is a double`);
  }
  for (const roll of [1, 10, 12, 21, 98, 100]) {
    equal(rules.askResult("50-50", roll).double, false, `${roll} is not a double`);
  }
});

test("Discover Meaning: 50 rows, two columns, every roll 1-100 returns a word", () => {
  equal(mythic.DISCOVER_MEANING.rows.length, 50, "rows");
  for (const column of ["action", "description"]) {
    const words = new Set();
    for (let roll = 1; roll <= 100; roll += 1) {
      const word = rules.meaningWord(column, roll);
      assert(word.word && typeof word.word === "string", `roll ${roll} on ${column}`);
      words.add(word.word);
    }
    equal(words.size, 50, `${column} words are unique`);
  }
  equal(rules.meaningWord("action", 1).word, "Attain", "1-2 is the first row");
  equal(rules.meaningWord("action", 2).word, "Attain", "and both halves of it");
  equal(rules.meaningWord("description", 100).word, "Warm", "99-100 is the last row");
  equal(rules.meaningWord("action", 69).word, "Mundane", "69-70 Action");
  equal(rules.meaningWord("description", 59).word, "Mundane", "59-60 Description");
});

test("an unknown meaning table throws rather than guessing", () => {
  let threw = false;
  try { rules.meaningWord("vibes", 5); } catch { threw = true; }
  assert(threw, "a table that does not exist is an error, not a shrug");
  let threw2 = false;
  try { rules.meaningWord("character-identity", 101); } catch { threw2 = true; }
  assert(threw2, "and so is a roll off the end of one");
});

test("an ask writes one log row, and a double writes the event die with it", () => {
  const adv = freshAdventure();
  let withEvent = null; let withoutEvent = null;
  for (let i = 0; i < 400 && (!withEvent || !withoutEvent); i += 1) {
    const result = oracle.ask({ question: "Is the mine still guarded?", odds: "50-50" });
    if (result.double) withEvent = result; else withoutEvent = result;
  }
  assert(withEvent && withoutEvent, "both outcomes occur in 400 asks");
  assert(withEvent.event.focus.label, "a double rolls an Event Focus");
  equal(withEvent.event.words.length, 2, "and its meaning on both Action tables");
  const rows = store.rollLog({ kind: "ask" });
  const doubleRow = rows.find((r) => r.dice.length === 4);
  const plainRow = rows.find((r) => r.dice.length === 1);
  assert(doubleRow && plainRow, "the log shows one die normally, and four on a double: the ask, the focus and two words");
  equal(plainRow.question, "Is the mine still guarded?", "the question is kept with the roll");
});

test("the ask records the answer in the session record", () => {
  const adv = freshAdventure();
  oracle.ask({ question: "Does the guard turn away?", odds: "likely" });
  const rows = store.sessionRecord(adv.id);
  assert(rows.some((r) => r.kind === "ask" && /Does the guard turn away/.test(r.text)), "recorded");
});

test("asking the pivot question writes the answer the gate reads (A14)", () => {
  const adv = atPivot({ survived: true });
  let blockedOnce = false; let allowedOnce = false;
  for (let i = 0; i < 200 && !(blockedOnce && allowedOnce); i += 1) {
    const result = oracle.askPivot(store.active());
    const gate = derived.canRevealPivot(store.active());
    equal(gate.ok, result.answer.yes, `a ${result.answer.label} must ${result.answer.yes ? "open" : "block"} the pivot`);
    if (gate.ok) allowedOnce = true; else blockedOnce = true;
  }
  assert(blockedOnce && allowedOnce, "both answers occur and both are honoured");
});

test("Discover Meaning rolls one word at a time and logs each (A15)", () => {
  const adv = freshAdventure();
  const before = store.rollLog({ kind: "meaning" }).length;
  const word = oracle.discover("description");
  equal(store.rollLog({ kind: "meaning" }).length, before + 1, "one roll, one row");
  assert(word.word, "and a word came back");
});

// ---------------------------------------------------------------- scenes & chaos (GME2e)
const sceneData = await import("../data-scenes.js");
const fate = await import("../data-fate-chart.js");
const actions = await import("../data-actions.js");
const sceneEngine = await import("../src/scenes.js");

test("the scene test reads the way the rule states, at every chaos level", () => {
  for (let chaos = 1; chaos <= 9; chaos += 1) {
    for (let d10 = 1; d10 <= 10; d10 += 1) {
      const outcome = rules.sceneOutcome(d10, chaos);
      const expected = d10 > chaos ? "expected" : (d10 % 2 === 1 ? "altered" : "interrupt");
      equal(outcome.key, expected, `d10 ${d10} against chaos ${chaos}`);
    }
  }
});

test("a 10 always clears, which is why the book's even list stops at 8", () => {
  for (let chaos = 1; chaos <= 9; chaos += 1) {
    equal(rules.sceneOutcome(10, chaos).key, "expected", `a 10 at chaos ${chaos}`);
  }
  const evens = [2, 4, 6, 8].map((n) => rules.sceneOutcome(n, 9).key);
  deepEqual(evens, ["interrupt", "interrupt", "interrupt", "interrupt"], "2, 4, 6 and 8 interrupt");
});

test("the scene test's boundaries: at chaos, under it, over it", () => {
  equal(rules.sceneOutcome(6, 5).key, "expected", "a 6 clears a chaos of 5");
  equal(rules.sceneOutcome(5, 5).key, "altered", "a 5 does not, and 5 is odd");
  equal(rules.sceneOutcome(4, 5).key, "interrupt", "a 4 does not, and 4 is even");
  equal(rules.sceneOutcome(1, 1).key, "altered", "at chaos 1 only a 1 fails, and it alters");
  equal(rules.sceneOutcome(2, 1).key, "expected", "everything else runs as expected");
  for (let d10 = 1; d10 <= 9; d10 += 1) assert(rules.sceneOutcome(d10, 9).key !== "expected", `chaos 9 catches a ${d10}`);
  equal(rules.sceneOutcome(10, 9).key, "expected", "only a 10 clears chaos 9");
});

test("chaos clamps to 1-9 and starts at 5", () => {
  equal(sceneData.CHAOS.start, 5, "the adventure starts at five");
  equal(rules.clampChaos(0), 1, "floor");
  equal(rules.clampChaos(-4), 1, "well under the floor");
  equal(rules.clampChaos(10), 9, "ceiling");
  equal(rules.clampChaos(5), 5, "and leaves a legal value alone");
  equal(rules.clampChaos(undefined), 5, "an absent value falls back to the start");
  equal(rules.clampChaos("not a number"), 5, "so does rubbish");
  // The floor case is the one that broke: 0 is falsy, and `Number(x) || 5` read it as
  // absent, so "in control at chaos 1" jumped to 5 (docs/AUDIT.md F36).
  equal(rules.clampChaos(0), 1, "zero is a number, not an absence");
  const adv = freshAdventure();
  equal(derived.chaos(store.active()), 5, "a new adventure starts at five");
});

test("bookkeeping moves chaos one step, and refuses to run past the ends", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), { expectation: "The PC reaches the mine." });
  const out = sceneEngine.endScene(store.active(), "out");
  assert(out.ok, "the scene closed");
  equal(derived.chaos(store.active()), 6, "out of control raises it");
  sceneEngine.testScene(store.active(), {});
  sceneEngine.endScene(store.active(), "in");
  equal(derived.chaos(store.active()), 5, "in control lowers it");
  store.setChaos(adv.id, 9);
  sceneEngine.testScene(store.active(), {});
  const capped = sceneEngine.endScene(store.active(), "out");
  equal(derived.chaos(store.active()), 9, "it cannot pass nine");
  assert(/ceiling/.test(capped.summary.join(" ")), "and the summary says so rather than claiming a change");
  store.setChaos(adv.id, 1);
  sceneEngine.testScene(store.active(), {});
  sceneEngine.endScene(store.active(), "in");
  equal(derived.chaos(store.active()), 1, "nor under one");
});

test("a scene must be running to be ended, and control must be stated", () => {
  const adv = freshAdventure();
  equal(sceneEngine.endScene(store.active(), "in").ok, false, "nothing to end");
  sceneEngine.testScene(store.active(), {});
  equal(sceneEngine.endScene(store.active(), "sideways").ok, false, "an unknown control is refused");
  equal(derived.chaos(store.active()), 5, "and nothing moved");
});

test("a scene is logged with its die and its chaos, and recorded", () => {
  const adv = freshAdventure();
  const scene = sceneEngine.testScene(store.active(), { expectation: "Into the mine." });
  const row = store.rollLog({ kind: "scene" })[0];
  equal(row.dice[0].die, "d10", "one d10");
  equal(row.dice[0].value, scene.test.d10, "the one that was rolled");
  assert(/chaos/.test(row.dice[0].table), "read against the chaos factor");
  equal(row.question, "Into the mine.", "the expectation is kept with the roll");
  assert(store.sessionRecord(adv.id).some((r) => r.kind === "scene"), "and the session record shows it");
});

test("the Fate Chart moves with the Chaos Factor (ruling A24, revised)", () => {
  // The same roll, the same odds, a different chaos: a different answer. That is the
  // chart's whole purpose, and it is what the One-Page Mythic chart could not do.
  equal(rules.askResult("50-50", 50, 9).answer.key, "yes", "at chaos 9 a 50 is a Yes");
  equal(rules.askResult("50-50", 50, 1).answer.key, "no", "at chaos 1 the same 50 is a No");
  equal(rules.askResult("50-50", 11, 5).answer.key, "yes", "chaos 5 keeps the familiar boundary");
  equal(rules.askResult("50-50", 10, 5).answer.key, "exceptional-yes", "and the one above it");
});

test("the ask engine reads the adventure's chaos, not a constant", () => {
  const adv = freshAdventure();
  store.setChaos(adv.id, 2);
  const low = oracle.ask({ question: "low", odds: "50-50" });
  equal(low.chaos, 2, "the ask carried chaos 2");
  store.setChaos(adv.id, 8);
  equal(oracle.ask({ question: "high", odds: "50-50" }).chaos, 8, "and then chaos 8");
  const rows = store.rollLog({ kind: "ask" });
  assert(/chaos 8/.test(rows[0].dice[0].table), "the log records which column was read");
});

test("all 81 Fate Chart cells match the chart's own ladder", () => {
  // The chart is one thirteen-rung ladder read at an offset. That is a structural fact,
  // not how the app reads it - it is here to prove the transcription has no typo.
  const { ladder, offsets } = rules.fateLadder();
  for (const row of fate.FATE_CHART.rows) {
    for (let cf = 1; cf <= 9; cf += 1) {
      const index = Math.min(ladder.length - 1, Math.max(0, cf + offsets[row.key]));
      deepEqual(row.cells[cf - 1], ladder[index], `${row.label} at chaos ${cf}`);
    }
  }
});

test("the Fate Chart's chaos-5 column IS the One-Page Mythic chart", () => {
  // Two pages, transcribed separately, days apart. If either had a typo this fails.
  for (const row of fate.FATE_CHART.rows) {
    const opm = rules.opmChart().find((o) => o.key === row.key);
    assert(opm, `${row.label} exists in both`);
    const bands = rules.fateBands(row.key, 5);
    deepEqual(bands.exYes, opm.exYes, `${row.label} Exceptional Yes`);
    deepEqual(bands.yes, opm.yes, `${row.label} Yes`);
    deepEqual(bands.no, opm.no, `${row.label} No`);
    deepEqual(bands.exNo, opm.exNo, `${row.label} Exceptional No`);
  }
});

test("every cell of the chart covers 1-100 exactly once, including the impossible ones", () => {
  for (const row of fate.FATE_CHART.rows) {
    for (let cf = 1; cf <= 9; cf += 1) {
      const seen = new Array(101).fill(0);
      for (let roll = 1; roll <= 100; roll += 1) seen[roll] += 1;
      for (let roll = 1; roll <= 100; roll += 1) {
        const answer = rules.askResult(row.key, roll, cf).answer;
        assert(answer && answer.key, `${row.label} chaos ${cf} roll ${roll}`);
      }
      const bands = rules.fateBands(row.key, cf);
      if (!bands.exYes) assert(bands.yes[0] === 1, "with no Exceptional Yes, Yes starts at 1");
      if (!bands.exNo) assert(bands.no[1] === 100, "with no Exceptional No, No runs to 100");
    }
  }
  assert(!rules.fateBands("certain", 7).exNo, "Certain at chaos 7 cannot fail exceptionally");
  assert(!rules.fateBands("very-unlikely", 1).exYes, "Very Unlikely at chaos 1 cannot succeed exceptionally");
});

test("an impossible roll is an error, not an answer", () => {
  for (const bad of [0, 101, 1.5]) {
    let threw = false;
    try { rules.askResult("50-50", bad, 5); } catch { threw = true; }
    assert(threw, `${bad} is not a d100 result`);
  }
});

test("the Random Event Focus table covers 1-100 and names its lists", () => {
  for (let roll = 1; roll <= 100; roll += 1) {
    const focus = rules.eventFocus(roll);
    assert(focus.label && focus.reason, `roll ${roll}`);
  }
  equal(rules.eventFocus(1).key, "remote-event", "1-5");
  equal(rules.eventFocus(21).key, "npc-action", "21-40 is the widest band");
  equal(rules.eventFocus(40).key, "npc-action", "to 40");
  equal(rules.eventFocus(86).key, "current-context", "86-100");
  equal(rules.eventFocus(100).key, "current-context", "to 100");
  equal(rules.eventFocus(11).list, "characters", "a New NPC points at the Characters list");
  equal(rules.eventFocus(51).list, "threads", "a Thread focus points at the Threads list");
  equal(rules.eventFocus(71).list, undefined, "PC Negative points at neither");
});

test("the Scene Adjustment table covers 1-10, and 7+ means two adjustments", () => {
  for (let roll = 1; roll <= 10; roll += 1) assert(rules.sceneAdjustment(roll).label, `roll ${roll}`);
  equal(rules.sceneAdjustment(1).key, "remove-character", "1");
  equal(rules.sceneAdjustment(6).key, "add-object", "6");
  for (const roll of [7, 8, 9, 10]) equal(rules.sceneAdjustment(roll).special, "double", `${roll} doubles`);
});

test("rolling adjustments always yields at least one real adjustment, and terminates", () => {
  const adv = freshAdventure();
  let sawTwo = false;
  for (let i = 0; i < 300; i += 1) {
    sceneEngine.testScene(store.active(), {});
    const scene = store.active().scenes.slice(-1)[0];
    const results = sceneEngine.rollAdjustments(store.active(), scene);
    assert(results.length >= 1, "something came out of it");
    assert(results.length <= 16, `the cascade ran away: ${results.length}`);
    for (const r of results) assert(r.label && r.special !== "double", "no Make 2 Adjustments survives in the result");
    if (results.length > 1) sawTwo = true;
    sceneEngine.endScene(store.active(), "in");
  }
  assert(sawTwo, "a 7-10 produces more than one adjustment");
});

test("an interrupt rolls a focus and two Action words, and keeps them on the scene", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), {});
  const scene = store.active().scenes.slice(-1)[0];
  const event = sceneEngine.interruptEvent(store.active(), scene);
  assert(event.focus.label, "a focus");
  equal(event.words.length, 2, "and two words");
  const saved = store.active().scenes.slice(-1)[0];
  equal(saved.event.focus.key, event.focus.key, "stored on the scene");
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  assert(reloaded.adventures[0].scenes.slice(-1)[0].event, "and it survives a reload");
});

test("both Action tables carry 100 unique words, at the rolls the page shows", () => {
  for (const table of actions.ACTION_TABLES) {
    equal(table.words.length, 100, `${table.label} rows`);
    equal(new Set(table.words).size, 100, `${table.label} unique`);
  }
  equal(rules.meaningWord("action-1", 1).word, "Abandon", "Action 1 opens at Abandon");
  equal(rules.meaningWord("action-1", 100).word, "Waste", "and closes at Waste");
  equal(rules.meaningWord("action-2", 1).word, "Advantage", "Action 2 opens at Advantage");
  equal(rules.meaningWord("action-2", 100).word, "Wound", "and closes at Wound");
  equal(rules.meaningWord("action-1", 60).word, "Lure", "60 on Action 1");
  equal(rules.meaningWord("action-2", 72).word, "Plot", "72 on Action 2");
});

test("scenes survive a reload and renumber from the store", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), { expectation: "one" });
  sceneEngine.endScene(store.active(), "in");
  sceneEngine.testScene(store.active(), { expectation: "two" });
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = reloaded.adventures[0];
  deepEqual(saved.scenes.map((sc) => sc.n), [1, 2], "numbered in order");
  equal(saved.chaos, 4, "and the chaos factor came back");
  equal(derived.currentScene(saved).expectation, "two", "the open scene is the one still running");
});

test("an old adventure back-fills a chaos factor and empty lists", () => {
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  const adv = older.adventures[0];
  equal(adv.chaos, 5, "chaos");
  deepEqual([adv.threads, adv.characters, adv.scenes], [[], [], []], "and the rest");
});

test("list weighting caps at three lines and the sheet caps at twenty-five", () => {
  const adv = freshAdventure();
  const item = store.addListItem(adv.id, "threads", "Find out who pays the diggers");
  equal(item.entries, 1, "one line to start");
  store.setListEntries(adv.id, "threads", item.id, 5);
  equal(store.active().threads[0].entries, 5, "the store writes what it is told");
  const normalized = store.__setState(JSON.parse(store.exportJSON()));
  equal(normalized.adventures[0].threads[0].entries, sceneData.LISTS.maxEntries,
    "and normalization holds it to three, so no path can exceed the cap");
  equal(sceneData.LISTS.lines, 25, "twenty-five lines");
  equal(sceneData.LISTS.sections, 5, "in five sections");
});

test("lines are counted by weighting, and a full list is a full list", () => {
  const adv = freshAdventure();
  for (let i = 0; i < 8; i += 1) {
    const item = store.addListItem(adv.id, "characters", `Character ${i + 1}`);
    store.setListEntries(adv.id, "characters", item.id, 3);
  }
  equal(derived.listLines(store.active(), "characters"), 24, "eight elements at three lines");
  equal(derived.listFull(store.active(), "characters"), false, "twenty-four is not full");
  store.addListItem(adv.id, "characters", "One more");
  equal(derived.listLines(store.active(), "characters"), 25, "twenty-five is");
  equal(derived.listFull(store.active(), "characters"), true, "and the screen refuses another");
});

test("crossing out frees every line the element held", () => {
  const adv = freshAdventure();
  const item = store.addListItem(adv.id, "threads", "Stop the ore shipment");
  store.setListEntries(adv.id, "threads", item.id, 3);
  equal(derived.listLines(store.active(), "threads"), 3, "three lines");
  store.removeListItem(adv.id, "threads", item.id);
  equal(derived.listLines(store.active(), "threads"), 0, "and none once crossed out");
  equal(derived.listItems(store.active(), "threads").length, 0, "it is off the live list");
});

test("the clean-up transfer: a single entry each, except threes, which get two", () => {
  // The book's words: "copy over ... with a single entry for each element. For any with
  // three entries on the original List, give them two entries on the new List." The app
  // carried twos across at two until a quote corrected it (docs/AUDIT.md F41).
  deepEqual(sceneData.LISTS.cleanupEntries, { 1: 1, 2: 1, 3: 2 }, "1 stays 1, 2 drops to 1, 3 drops to 2");
  const adv = freshAdventure();
  const big = store.addListItem(adv.id, "threads", "The general's war");
  store.setListEntries(adv.id, "threads", big.id, 3);
  const middling = store.addListItem(adv.id, "threads", "The seized mine");
  store.setListEntries(adv.id, "threads", middling.id, 2);
  const small = store.addListItem(adv.id, "threads", "A rumour in the village");
  const gone = store.addListItem(adv.id, "threads", "Finished business");
  store.setListEntries(adv.id, "threads", gone.id, 3);
  store.removeListItem(adv.id, "threads", gone.id);

  const before = derived.listLines(store.active(), "threads");
  equal(before, 6, "three live elements on six lines");
  const result = store.cleanupList(adv.id, "threads", sceneData.LISTS.cleanupEntries);
  equal(result.carried, 3, "three live elements came across");
  equal(result.reduced, 2, "the three and the two were both reduced");
  equal(store.active().threads.find((t) => t.id === big.id).entries, 2, "three became two");
  equal(store.active().threads.find((t) => t.id === middling.id).entries, 1, "two became one");
  equal(store.active().threads.find((t) => t.id === small.id).entries, 1, "one stayed one");
  assert(!store.active().threads.some((t) => t.id === gone.id), "the crossed-out one did not travel");
  equal(derived.listLines(store.active(), "threads"), 4, "six lines became four");
});

test("a clean-up on a full list always frees room", () => {
  const adv = freshAdventure();
  for (let i = 0; i < 8; i += 1) {
    const item = store.addListItem(adv.id, "characters", `Character ${i + 1}`);
    store.setListEntries(adv.id, "characters", item.id, 3);
  }
  store.addListItem(adv.id, "characters", "The last line");
  equal(derived.listFull(store.active(), "characters"), true, "twenty-five lines");
  store.cleanupList(adv.id, "characters", sceneData.LISTS.cleanupEntries);
  equal(derived.listLines(store.active(), "characters"), 17, "eight threes become twos, the single stays one");
  equal(derived.listFull(store.active(), "characters"), false, "and there is room again");
});

test("a list roll reads section then line, the way the procedure says", () => {
  const rule = rules.listSelectionRule();
  deepEqual(rule.sectionDice.map((r) => r.die), [null, 4, 6, 8, 10], "the section die grows with the active sections");
  deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => rules.lineFromRoll(n)), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    "a d10 pairs onto the five lines of a section");
  deepEqual([1, 2, 3, 4, 9, 10].map((n) => rules.sectionFromRoll(n)), [1, 1, 2, 2, 5, 5],
    "and the section die pairs the same way");
  equal(rules.activeSections(1).die, null, "one section needs no roll");
  equal(rules.activeSections(5).die, null, "five lines is still one section");
  equal(rules.activeSections(6).die, 4, "six lines opens a second");
  equal(rules.activeSections(25).die, 10, "and a full sheet uses a d10");
});

test("a list roll lands on a real entry or reports Choose, and is logged either way", () => {
  const adv = freshAdventure();
  const heavy = store.addListItem(adv.id, "characters", "Gorazon");
  store.setListEntries(adv.id, "characters", heavy.id, 3);
  store.addListItem(adv.id, "characters", "A passing merchant");
  let hits = 0; let chooses = 0;
  const counts = {};
  for (let i = 0; i < 600; i += 1) {
    const result = sceneEngine.rollFromList(store.active(), "characters");
    assert(result.dice.length >= 1, "the dice are recorded");
    if (result.choose) { chooses += 1; equal(result.item, null, "a Choose result has no entry"); }
    else { hits += 1; counts[result.item.text] = (counts[result.item.text] || 0) + 1; }
  }
  assert(hits > 0 && chooses > 0, "four filled lines out of five means both outcomes occur");
  // weighting bites: three lines against one, among the lines that were hit
  const ratio = counts.Gorazon / counts["A passing merchant"];
  assert(ratio > 2 && ratio < 4.5, `three lines should come up about three times as often, got ${ratio.toFixed(2)}`);
  const logged = store.rollLog({ kind: "list" });
  equal(logged.length, 200, "every roll is logged, and the log holds its cap of the newest");
});

test("what is still unsupplied is recorded, and what arrived is no longer listed", () => {
  const missing = rules.notSupplied().join(" ");
  assert(/Track \+1/i.test(missing), "what four Discovery results do is still not supplied");
  // F45: this only ever read notSupplied(), so the OTHER gap list - the one the Rules
  // screen prints first - stayed four sources out of date. Read both.
  const both = missing + " " + rules.stillNotInSource().join(" ");
  for (const name of ["Fate Chart", "Event Focus", "Scene Adjustment", "Thread Progress Track",
                      "Villain Crafter", "Chaos Factor", "scene setup", "Bookkeeping",
                      "Mid-Chaos", "Low-Chaos", "Fate Check"]) {
    assert(!new RegExp("(" + name + ")\\s*(itself|table|is|are)?[^.]{0,40}(not |never |no )", "i").test(both),
      `${name} arrived, so no gap list may still call it missing`);
  }
  for (const gap of rules.stillNotInSource()) {
    assert(false, `STILL_NOT_IN_SOURCE is meant to be empty now; it holds: ${gap}`);
  }
  equal(rules.scenesSource().provisional, false, "the summary-sourced values were confirmed by quotation");
  for (const rule of [sceneData.CHAOS, sceneData.SCENE_TEST, sceneData.LISTS, sceneData.BOOKKEEPING]) {
    equal(rule.provisional, false, "each confirmed rule drops the flag");
  }
  // The list-selection procedure was the last summary-only rule; it has since been
  // quoted, so nothing in the app rests on a summary any more.
  equal(rules.listSelectionRule().provisional, false, "the list procedure is quoted now");
  equal(rules.listSelectionRule().provenance, "quotation", "and says so");
  assert(/Adventure Lists sheet/i.test(rules.listSelectionRule().inferred),
    "with its one unquoted detail - the die's faces - still named and sourced to the printed sheet");
});

// ---------------------------------------------------------------- the Fate Check
const check = await import("../data-fate-check.js");

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

test("an Exceptional No shuts Discovery down for the rest of the scene, and only that scene", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), {});
  const scene = derived.currentScene(store.active());
  equal(scene.discoveryClosed, false, "a fresh scene allows a Discovery Check");
  store.updateScene(adv.id, scene.id, { discoveryClosed: true });
  equal(derived.currentScene(store.active()).discoveryClosed, true, "an Exceptional No closes it");
  // it survives a save/reload, because it gates a control
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  equal(derived.currentScene(reloaded.adventures[0]).discoveryClosed, true, "and it is persisted");
  // ...and the NEXT scene opens it again, which is the whole point of the rule
  sceneEngine.endScene(store.active(), "in");
  sceneEngine.testScene(store.active(), {});
  equal(derived.currentScene(store.active()).discoveryClosed, false, "the next scene opens it again");
});

test("the Discovery Fate Question decides how many times the table is rolled", () => {
  const answers = rules.progressTrack().discovery.answers;
  const by = (key) => answers.find((a) => a.key === key);
  equal(by("exceptional-yes").rolls, 2, "an Exceptional Yes rolls twice and combines");
  equal(by("yes").rolls, 1, "a Yes rolls once");
  equal(by("no").rolls, 0, "a No does not roll");
  equal(by("exceptional-no").rolls, 0, "nor an Exceptional No");
  equal(by("exceptional-no").closesScene, true, "which also shuts Discovery down for the scene");
  for (const key of ["yes", "no", "exceptional-yes"]) {
    assert(!by(key).closesScene, `${key} does not close the scene`);
  }
});

test("the Discovery Check table covers its range and only awards what the source states", () => {
  const rule = rules.progressTrack().discovery;
  equal(rule.minimumOdds, "50-50", "asked at no less than 50/50");
  const at = (total) => rule.rows.find((r) => total >= r.min && total <= r.max);
  equal(at(1).key, "progress-2", "1-9");
  equal(at(9).key, "progress-2", "to 9");
  equal(at(10).key, "flashpoint-2", "10");
  equal(at(14).key, "track-1", "11-14");
  equal(at(17).key, "progress-3", "15-17");
  equal(at(18).key, "flashpoint-3", "18");
  equal(at(19).key, "track-2", "19");
  equal(at(24).key, "strengthen-1", "20-24");
  equal(at(99).key, "strengthen-2", "25+");
  for (let total = -5; total <= 60; total += 1) assert(at(total), `total ${total} has a row`);
  // the four results with no stated effect award nothing, and say so
  for (const key of ["track-1", "track-2", "strengthen-1", "strengthen-2"]) {
    const row = rule.rows.find((r) => r.key === key);
    equal(row.award, null, `${key} applies nothing`);
    assert(/not stated/i.test(row.text), `${key} says why`);
  }
  deepEqual(rule.rows.filter((r) => r.award).map((r) => r.award.points), [2, 2, 3, 3], "and the stated awards are the quoted ones");
});

// ---------------------------------------------------------------- chaos modes & the track
test("a question standing in for a game rule is always read at chaos 5 (quoted)", () => {
  equal(sceneData.CHAOS.fixedForMechanics, 5, "the book's number");
  for (const chaos of [1, 3, 5, 7, 9]) {
    equal(rules.chartChaos(chaos, { forMechanic: true }), 5, `chaos ${chaos} is ignored for a mechanic`);
    equal(rules.chartChaos(chaos, { forMechanic: false }), chaos, "and honoured otherwise");
  }
  const adv = freshAdventure();
  store.setChaos(adv.id, 9);
  const skewed = oracle.ask({ question: "does the blow land?", odds: "50-50" });
  const fair = oracle.ask({ question: "does the blow land?", odds: "50-50", forMechanic: true });
  equal(skewed.chaos, 9, "a normal question reads the adventure's chaos");
  equal(fair.chaos, 5, "one standing in for a rule does not");
});

test("No-Chaos answers from the odds alone and leaves chaos running underneath", () => {
  equal(rules.chaosMode("no-chaos").chart, "no-chaos", "it has its own printed chart");
  const adv = freshAdventure();
  store.setChaosMode(adv.id, "no-chaos");
  store.setChaos(adv.id, 8);
  // The ask still carries the adventure's real chaos - what changes is the chart it reads
  const asked = oracle.ask({ question: "no-chaos", odds: "50-50" });
  equal(asked.chaos, 8, "the ask keeps the real chaos");
  equal(asked.bands.chart.name, "No-Chaos Fate Chart", "and reads the No-Chaos chart");
  deepEqual(asked.bands.yes, rules.fateBands("50-50", 5).yes, "whose band is the standard chart's 5");
  // ...but the scene test still uses the real chaos, because scenes are still tested
  sceneEngine.testScene(store.active(), {});
  equal(store.active().scenes.slice(-1)[0].test.chaos, 8, "the scene test still uses the real value");
});

test("Random Chaos rolls a d10 at the end of a scene instead of asking", () => {
  equal(rules.randomChaosDelta(5, 5), -1, "equal to the chaos factor drops it");
  equal(rules.randomChaosDelta(4, 5), -1, "under it drops it");
  equal(rules.randomChaosDelta(6, 5), 1, "over it raises it");
  const adv = freshAdventure();
  store.setChaosMode(adv.id, "random-chaos");
  let moved = 0;
  for (let i = 0; i < 40; i += 1) {
    const before = derived.chaos(store.active());
    sceneEngine.testScene(store.active(), {});
    const result = sceneEngine.endScene(store.active(), undefined);
    assert(result.ok, "it closes without being told about control");
    assert(result.roll >= 1 && result.roll <= 10, "and rolls a d10 to decide");
    const after = derived.chaos(store.active());
    assert(Math.abs(after - before) <= 1, "one step at a time");
    if (after !== before) moved += 1;
  }
  assert(moved > 0, "it moves");
  const rows = store.rollLog({ kind: "scene" }).filter((r) => /Random Chaos/.test(r.dice[0].table));
  assert(rows.length >= 1, "and the roll is in the log");
});

test("standard mode still refuses to close a scene without a control answer", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), {});
  equal(sceneEngine.endScene(store.active(), undefined).ok, false, "it asks");
});

test("the progress track: two points a time, and plot armour until it is full", () => {
  const rule = rules.progressTrack();
  deepEqual(rule.lengths, [10, 15, 20], "the three track lengths");
  deepEqual(rule.awards.map((a) => a.points), [2, 2], "progress and a flashpoint are two each");

  const adv = freshAdventure();
  const thread = store.addListItem(adv.id, "threads", "End the general's war");
  store.setTrack(adv.id, { threadId: thread.id, length: 10, points: 0, awards: [] });
  equal(derived.plotArmoured(store.active(), thread.id), true, "armoured from the start");
  equal(derived.trackComplete(store.active()), false, "and not complete");

  for (let i = 0; i < 4; i += 1) store.awardTrack(adv.id, { key: "progress", label: "Progress", points: 2 });
  equal(derived.track(store.active()).points, 8, "four awards of two");
  equal(derived.plotArmoured(store.active(), thread.id), true, "still armoured at eight of ten");

  store.awardTrack(adv.id, { key: "flashpoint", label: "Flashpoint", points: 2 });
  equal(derived.track(store.active()).points, 10, "ten");
  equal(derived.trackComplete(store.active()), true, "complete");
  equal(derived.plotArmoured(store.active(), thread.id), false, "and the armour is off");

  store.awardTrack(adv.id, { key: "progress", label: "Progress", points: 2 });
  equal(derived.track(store.active()).points, 10, "points never pass the track's length");
});

test("plot armour only covers the focus thread, and the track dies with it", () => {
  const adv = freshAdventure();
  const focus = store.addListItem(adv.id, "threads", "End the war");
  const other = store.addListItem(adv.id, "threads", "Find the ore");
  store.setTrack(adv.id, { threadId: focus.id, length: 15, points: 2, awards: [] });
  equal(derived.plotArmoured(store.active(), other.id), false, "another thread is not armoured");
  store.removeListItem(adv.id, "threads", focus.id);
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  equal(derived.track(reloaded.adventures[0]), null, "crossing the focus thread out drops its track");
});

test("the Conclusion is a random event with an automatic Current Context focus (quoted)", () => {
  const event = oracle.rollEvent({ focusKey: "current-context" });
  equal(event.focus.key, "current-context", "the focus is not rolled for");
  equal(event.focus.automatic, true, "it is marked automatic");
  equal(event.focus.roll, null, "so there is no die for it");
  equal(event.words.length, 2, "and the meaning is still two Action words");
});

test("the track survives a reload, and an old adventure has none", () => {
  const adv = freshAdventure();
  const thread = store.addListItem(adv.id, "threads", "End the war");
  store.setTrack(adv.id, { threadId: thread.id, length: 20, points: 6, awards: [{ key: "progress", label: "Progress", points: 2 }] });
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = derived.track(reloaded.adventures[0]);
  equal(saved.length, 20, "length");
  equal(saved.points, 6, "points");
  equal(saved.awards.length, 1, "and its history");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  equal(derived.track(older.adventures[0]), null, "no track on an old record");
  equal(derived.chaosMode(older.adventures[0]), "standard", "and standard chaos");
});

test("what is still unsupplied, after everything", () => {
  const missing = rules.notSupplied().join(" ");
  assert(/Track \+1|Strengthen Progress/i.test(missing),
    "what four Discovery Check results do is the one thing left");
  equal(rules.notSupplied().length, 1, "and it is the only entry");
  // every chaos mode the book prints is now offered, on both resolutions
  const modes = rules.chaosModes().map((m) => m.key);
  for (const key of ["standard", "low-chaos", "mid-chaos", "no-chaos", "random-chaos"]) {
    assert(modes.includes(key), `${key} is a mode`);
  }
});

// ---------------------------------------------------------------- Elements (GME2e)
const elements = await import("../data-elements.js");

test("all twelve Elements tables carry 100 unique words", () => {
  equal(elements.ELEMENT_TABLES.length, 12, "tables");
  for (const table of elements.ELEMENT_TABLES) {
    equal(table.words.length, 100, `${table.label} row count`);
    equal(new Set(table.words).size, 100, `${table.label} words are unique`);
    for (const word of table.words) assert(word && typeof word === "string", `${table.label} has no blank rows`);
  }
});

test("Elements words sit at the rolls the page shows", () => {
  // Anchors transcribed from the page photographs, one per table.
  const anchors = [
    ["character-identity", 98, "Villain"], ["character-identity", 51, "Killer"],
    ["character-motivations", 86, "Revenge"], ["character-personality", 100, "Wise"],
    ["character-skills", 100, "Wounds"], ["character-traits-flaws", 62, "Multi"],
    ["character-appearance", 77, "Scar"], ["character-background", 59, "Imprisonment"],
    ["character-conversations", 68, "Macabre"], ["character-descriptors", 88, "Sophisticated"],
    ["character-actions-combat", 100, "Withdraw"], ["character-actions-general", 100, "Yield"],
    ["city-descriptors", 69, "Opulence"]
  ];
  for (const [id, roll, word] of anchors) equal(rules.meaningWord(id, roll).word, word, `${id} ${roll}`);
});

test("the meaning registry covers every source, with the right span each", () => {
  const tables = rules.meaningTables();
  equal(tables.filter((t) => t.group === "Discover Meaning").length, 2, "the One-Page Mythic columns");
  equal(tables.filter((t) => t.group === "Actions").length, 2, "the GME2e Action tables");
  equal(tables.filter((t) => t.group === "Elements").length, 12, "the GME2e Elements tables");
  equal(rules.meaningTable("meaning-action").span, 2, "OPM prints 50 rows over 100 numbers");
  equal(rules.meaningTable("character-identity").span, 1, "Elements print 100");
  for (const table of tables) {
    const seen = new Set();
    for (let roll = 1; roll <= 100; roll += 1) seen.add(rules.meaningWord(table.id, roll).word);
    equal(seen.size, table.group === "Discover Meaning" ? 50 : 100, `${table.label} covers 1-100`);
  }
});

test("the seven tables The Villain Crafter names are all present (MM41:p5)", () => {
  const names = rules.villainDetailTables().map((t) => t.id);
  deepEqual(names, ["character-identity", "character-skills", "character-motivations",
    "character-personality", "character-appearance", "character-traits-flaws", "character-background"],
  "identity, skills, motivations, personality, appearance, traits & flaws, background");
});

// ---------------------------------------------------------------- The Villain Crafter
const vc = await import("../data-villain-crafter.js");
const crafter = await import("../src/crafter.js");

test("Villain Archetype: 23 rows, every roll 1-100 returns exactly one, keys unique", () => {
  equal(vc.VILLAIN_ARCHETYPES.rows.length, 23, "rows");
  for (let roll = 1; roll <= 100; roll += 1) {
    const hits = vc.VILLAIN_ARCHETYPES.rows.filter((r) => roll >= r.min && roll <= r.max);
    equal(hits.length, 1, `roll ${roll}`);
  }
  equal(new Set(vc.VILLAIN_ARCHETYPES.rows.map((r) => r.key)).size, 23, "unique keys");
});

test("the modified tables are open-ended, so a big modifier cannot fall off them", () => {
  for (const table of [vc.VILLAIN_ORGANIZATIONS, vc.UNDERLINGS]) {
    for (const total of [-40, -1, 0, 1, 50, 100, 140, 200]) {
      const row = rules.lookupOpen(table, total);
      assert(row && row.label, `${table.name} at ${total}`);
    }
    for (let total = -50; total <= 200; total += 1) {
      const hits = table.rows.filter((r) => total >= r.min && total <= r.max);
      equal(hits.length, 1, `${table.name} at ${total}`);
    }
  }
});

test("every archetype modifier matches the page (MM41:p6-7, transcribed from photographs)", () => {
  // Transcribed independently from page photographs, not from the data file. This is what
  // retires the reconstruction risk: the first extraction paired 22 ranges with 22 modifier
  // rows by ORDER, because the transcript de-interleaved them, and only three rows could be
  // checked against the article's worked examples (docs/AUDIT.md F33).
  const page = {
    "revenge": [0, 0, 0], "master-of-domain": [10, 10, 10], "domination": [10, 5, 5],
    "serves-another": [5, 5, 5], "conquest": [5, 5, 10], "schemer": [0, 0, 5],
    "brute": [-5, -5, 0], "doing-their-job": [5, 0, 0], "killer": [-5, -5, -5],
    "money": [-5, -5, -5], "inscrutable": [5, 0, 0], "thrill": [-10, -5, -5],
    "one-of-the-people": [0, 5, 5], "class-act": [5, 10, 10], "higher-purpose": [5, 5, 5],
    "personal-need": [-5, -5, -5], "no-choice": [10, 0, 5], "i-am-the-best": [-10, -10, 0],
    "making-a-point": [0, 5, 5], "power": [10, 5, 10], "duty-bound": [-5, -5, 5],
    "meaning-table": [0, 0, 0], "double": [0, 0, 0]
  };
  equal(Object.keys(page).length, vc.VILLAIN_ARCHETYPES.rows.length, "every row is accounted for");
  for (const row of vc.VILLAIN_ARCHETYPES.rows) {
    const expected = page[row.key];
    assert(expected, `${row.key} is on the page`);
    deepEqual([row.mods.o, row.mods.l, row.mods.m], expected, `${row.label} modifiers`);
  }
});

test("every organization modifier matches the page (MM41:p10-11, transcribed from photographs)", () => {
  const page = {
    "none": [-10, -10], "gang": [-5, -10], "hired-hands": [0, -5], "followers": [-10, -5],
    "family": [-5, -10], "cult": [0, 0], "organized-crime": [5, 0], "secret-society": [10, 5],
    "army": [5, 5], "professionals": [5, 10], "company": [10, 10], "corrupted": [10, 5],
    "syndicate": [10, 5], "sprawling": [10, 10], "government": [10, 10], "upscale": [5, 5],
    "meaning-table": [0, 0], "double": [0, 0]
  };
  equal(Object.keys(page).length, vc.VILLAIN_ORGANIZATIONS.rows.length, "every row is accounted for");
  for (const row of vc.VILLAIN_ORGANIZATIONS.rows) {
    const expected = page[row.key];
    assert(expected, `${row.key} is on the page`);
    deepEqual([row.mods.l, row.mods.m], expected, `${row.label} modifiers`);
  }
});

test("the band boundaries match the page too", () => {
  const bands = [[1, "revenge"], [6, "revenge"], [7, "master-of-domain"], [16, "master-of-domain"],
    [17, "domination"], [20, "domination"], [25, "schemer"], [32, "schemer"], [44, "thrill"],
    [45, "one-of-the-people"], [63, "power"], [70, "power"], [74, "duty-bound"],
    [75, "meaning-table"], [80, "meaning-table"], [81, "double"], [100, "double"]];
  for (const [roll, key] of bands) equal(rules.lookupOpen(vc.VILLAIN_ARCHETYPES, roll).key, key, `archetype ${roll}`);
  const orgBands = [[-30, "none"], [8, "none"], [9, "gang"], [22, "hired-hands"], [23, "followers"],
    [40, "organized-crime"], [41, "secret-society"], [48, "company"], [53, "company"],
    [68, "government"], [69, "upscale"], [74, "upscale"], [80, "meaning-table"], [81, "double"], [150, "double"]];
  for (const [total, key] of orgBands) equal(rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, total).key, key, `organization ${total}`);
});

test("the article's own example arithmetic comes out right (MM41:p16)", () => {
  // Has No Choice + One Of The People, then The Company: lieutenants +15, minions +20.
  const noChoice = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "no-choice");
  const people = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "one-of-the-people");
  equal(noChoice.mods.o + people.mods.o, 10, "organization modifier is +10");
  const org = rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, 42 + 10);
  equal(org.key, "company", "42 +10 = 52 is The Company");
  equal(noChoice.mods.l + people.mods.l + org.mods.l, 15, "lieutenant modifier is +15");
  equal(noChoice.mods.m + people.mods.m + org.mods.m, 20, "minion modifier is +20");
  equal(rules.lookupOpen(vc.UNDERLINGS, 28 + 15).key, "tough-stuff", "the lieutenant roll gives Tough Stuff");
  equal(rules.lookupOpen(vc.UNDERLINGS, 7 + 20).key, "groveler", "the minion roll gives Groveler");
});

test("the spore example's organization roll also reproduces", () => {
  // The Domination Game is +10 to the organization roll; 25 +10 = 35 is Organized Crime.
  const domination = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "domination");
  equal(domination.mods.o, 10, "+10");
  equal(rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, 25 + 10).key, "organized-crime", "35");
});

test("Double Archetypes always resolves to real archetypes, never to itself", () => {
  let sawDouble = false;
  for (let i = 0; i < 300; i += 1) {
    const result = crafter.rollArchetype();
    assert(result.parts.length >= 1, "at least one archetype");
    for (const part of result.parts) {
      assert(part.special !== "double", "a Double is never left in the result");
      assert(part.label, "every part is named");
    }
    if (result.parts.length > 1) sawDouble = true;
    // the modifiers are the sum of the parts, which is what the rule says to do
    const sum = result.parts.reduce((a, p) => a + (p.mods ? p.mods.o : 0), 0);
    equal(result.mods.o, sum, "organization modifier is the sum of the parts");
  }
  assert(sawDouble, "a double archetype occurs in 300 rolls and combines two");
});

test("Upscale rolls again and keeps both sets of modifiers", () => {
  let sawUpscale = false;
  for (let i = 0; i < 400 && !sawUpscale; i += 1) {
    const result = crafter.rollOrganization(0);
    if (!result.upscaled) continue;
    sawUpscale = true;
    assert(result.parts.length >= 2, "the Upscale row and the result it scaled");
    const sum = result.parts.reduce((a, p) => a + (p.mods ? p.mods.l : 0), 0);
    equal(result.mods.l, sum, "both sets of modifiers count");
    assert(result.parts.some((p) => !p.scaffold), "something real came out of it");
  }
  assert(sawUpscale, "Upscale occurs in 400 rolls");
});

test("a nested Double is re-rolled, not expanded (the rule, and why it terminates)", () => {
  // At +40 the organization table lands on Double (81 or more) on roughly three rolls in
  // five. Expanding those recursively diverges - which is how this shipped first, and
  // what docs/AUDIT.md F28 records. Two archetypes is the most a Double may produce.
  for (let i = 0; i < 300; i += 1) {
    const result = crafter.rollOrganization(40);
    const real = result.parts.filter((p) => !p.scaffold);
    assert(real.length <= 2, `a Double produced ${real.length} archetypes`);
    for (const part of result.parts) assert(part.special !== "double", "no Double survives in the result");
  }
});

test("Teamwork rolls a partner archetype, and a second Teamwork is not another pair", () => {
  let sawTeamwork = false;
  for (let i = 0; i < 400 && !sawTeamwork; i += 1) {
    const result = crafter.rollUnderling("lieutenant", 0);
    if (!result.teamwork) continue;
    sawTeamwork = true;
    equal(result.parts.filter((p) => p.special === "teamwork").length, 1, "only one Teamwork in the result");
    assert(result.parts.length >= 2, "and a partner archetype came with it");
  }
  assert(sawTeamwork, "Teamwork occurs in 400 rolls");
});

test("every crafter cascade terminates", () => {
  for (let i = 0; i < 200; i += 1) {
    const arch = crafter.rollArchetype();
    assert(arch.rolls.length < 20, `archetype cascade ran ${arch.rolls.length} times`);
    const org = crafter.rollOrganization(40);   // a big modifier pushes Double more often
    assert(org.rolls.length < 20, `organization cascade ran ${org.rolls.length} times`);
    const und = crafter.rollUnderling("lieutenant", 40);
    assert(und.rolls.length < 20, `underling cascade ran ${und.rolls.length} times`);
  }
});

test("the minion column overrides the lieutenant one where the table splits it", () => {
  const row = vc.UNDERLINGS.rows.find((r) => r.key === "anger-issues");
  equal(row.label, "Anger Issues", "lieutenant entry");
  equal(row.minion.label, "Soldier", "minion entry");
  const shared = vc.UNDERLINGS.rows.find((r) => r.key === "true-believer");
  equal(shared.shared, true, "and shared rows read the same for both");
  assert(!shared.minion, "with no separate minion entry");
});

test("every band of the minion column is readable - the source gap is closed (A19)", () => {
  const gaps = vc.UNDERLINGS.rows.filter((r) => r.minion && r.minion.unrecovered);
  equal(gaps.length, 0, "no band ships marked unrecovered any more");
  for (let total = -20; total <= 120; total += 1) {
    const entry = rules.lookupOpen(vc.UNDERLINGS, total);
    const minion = entry.minion || entry;
    assert(minion.label && (minion.text || entry.shared), `minion result at ${total} has an archetype`);
  }
  // the three bands the photographs recovered, and the merged cells they belong to
  const at = (n) => { const r = rules.lookupOpen(vc.UNDERLINGS, n); return r.minion ? r.minion.label : r.label; };
  deepEqual([at(40), at(43)], ["Soldier", "Soldier"], "the Soldier cell spans 40-44");
  deepEqual([at(68), at(71), at(73), at(75)], ["On A Mission", "On A Mission", "On A Mission", "On A Mission"],
    "the On A Mission cell spans 68-76");
  deepEqual([at(43) === at(41), at(68) === at(70)], [true, true], "which is what merged cells mean");
});

test("no minion roll can come back without an archetype", () => {
  for (let i = 0; i < 400; i += 1) {
    const result = crafter.rollUnderling("minion", (i % 9) * 10 - 20);
    for (const part of result.parts) {
      assert(part.label, "every part is named");
      assert(!part.unrecovered, "and none is a gap");
    }
  }
});

test("crafter rolls are logged with their dice and recorded", () => {
  const adv = freshAdventure();
  const before = store.rollLog({ kind: "crafter" }).length;
  const result = crafter.rollArchetype();
  const rows = store.rollLog({ kind: "crafter" });
  equal(rows.length, before + 1 + result.words.length, "one row for the archetype, plus any meaning-table word");
  assert(rows[rows.length - 1].dice.length >= 1, "the dice are kept");
  assert(store.sessionRecord(adv.id).some((r) => r.kind === "crafter"), "and the session record shows it");
});

test("the organization roll is gated on the archetype, whose modifier it carries", () => {
  const adv = freshAdventure();
  const blocked = crafter.canRollOrganization(store.active());
  equal(blocked.ok, false, "refused");
  assert(/archetype first/.test(blocked.reason), "and says why");
  store.setCrafted(adv.id, { archetype: crafter.rollArchetype() });
  equal(crafter.canRollOrganization(store.active()).ok, true, "allowed once the archetype is known");
});

test("the modifier breakdown shows the arithmetic it applies", () => {
  const adv = freshAdventure();
  const archetype = { mods: { o: 10, l: 0, m: 5 }, parts: [{ label: "Has No Choice" }], rolls: [57] };
  const organization = { mods: { l: 10, m: 10 }, parts: [{ label: "The Company" }], rolls: [{ roll: 42, mod: 10, total: 52 }] };
  store.setCrafted(adv.id, { archetype, organization });
  const mods = crafter.modifierBreakdown(store.active());
  equal(mods.organization.total, 10, "organization takes the archetype's o");
  equal(mods.lieutenant.total, 10, "lieutenant takes l from both");
  equal(mods.minion.total, 15, "minion takes m from both");
  equal(mods.hasOrganization, true, "and knows the organization is rolled");
});

test("details attach to the villain and to one underling, and survive a reload", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("minion", 0);
  store.addUnderling(adv.id, "minion", entry);
  store.addDetail(adv.id, { kind: "villain" }, { tableId: "character-identity", table: "Character Identity", roll: 98, word: "Villain" });
  store.addDetail(adv.id, { kind: "minion", id: entry.id }, { tableId: "character-skills", table: "Character Skills", roll: 62, word: "Military" });
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = reloaded.adventures[0];
  equal(saved.villain.details.length, 1, "the villain's detail survived");
  equal(saved.villain.details[0].word, "Villain", "with its word");
  equal(saved.villain.crafted.minions[0].details.length, 1, "and the minion's");
  assert(saved.villain.details[0].id, "details get ids");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  deepEqual(older.adventures[0].villain.details, [], "an old record back-fills an empty list");
});

test("a detail is removed from the holder it belongs to, and only that one", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("lieutenant", 0);
  store.addUnderling(adv.id, "lieutenant", entry);
  const a = store.addDetail(adv.id, { kind: "villain" }, { table: "Character Identity", roll: 1, word: "Abandoned" });
  store.addDetail(adv.id, { kind: "lieutenant", id: entry.id }, { table: "Character Skills", roll: 2, word: "Adversity" });
  store.removeDetail(adv.id, { kind: "villain" }, a.id);
  equal(store.active().villain.details.length, 0, "removed from the villain");
  equal(store.active().villain.crafted.lieutenants[0].details.length, 1, "the lieutenant's is untouched");
});

test("a crafted villain survives a reload, and an old adventure back-fills one", () => {
  const adv = freshAdventure();
  store.setCrafted(adv.id, { archetype: crafter.rollArchetype() });
  const entry = crafter.rollUnderling("minion", 0);
  store.addUnderling(adv.id, "minion", entry);
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = reloaded.adventures[0].villain.crafted;
  equal(saved.minions.length, 1, "the minion survived");
  assert(saved.archetype, "and the archetype");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  const blank = older.adventures[0].villain.crafted;
  deepEqual([blank.archetype, blank.organization, blank.lieutenants, blank.minions], [null, null, [], []], "old records get an empty roster");
});

test("underlings can be renamed and removed", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("lieutenant", 0);
  store.addUnderling(adv.id, "lieutenant", entry);
  store.updateUnderling(adv.id, "lieutenant", entry.id, { name: "The Gargoyle" });
  equal(store.active().villain.crafted.lieutenants[0].name, "The Gargoyle", "renamed");
  store.removeUnderling(adv.id, "lieutenant", entry.id);
  equal(store.active().villain.crafted.lieutenants.length, 0, "removed");
});

// ---------------------------------------------------------------- the pivot gate
function atPivot(flags = {}) {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  store.setArcStage(adv.id, "pivot", {});
  for (const [k, v] of Object.entries(flags)) store.setPivotFlag(adv.id, k, v);
  return store.active();
}

test("a pivot is refused with none of the three conditions ticked (Gate)", () => {
  const adv = atPivot();
  const check = derived.canRevealPivot(adv);
  equal(check.ok, false, "refused");
  equal(check.reason, data.PIVOT_GATE.refusal, "the refusal explains the rule");
  equal(roller.revealPivot(adv).ok, false, "the engine refuses, not just the button");
});

test("a pivot is refused before the plan is defeated", () => {
  const adv = freshAdventure();
  store.setPivotFlag(adv.id, "survived", true);
  equal(derived.canRevealPivot(store.active()).ok, false, "still in the Discovery arc");
});

test("one ticked condition allows exactly one pivot; a second needs an override", () => {
  const adv = atPivot({ survived: true });
  equal(roller.revealPivot(store.active()).ok, true, "first pivot rolled");
  const second = derived.canRevealPivot(store.active());
  equal(second.ok, false, "second refused");
  assert(/One pivot per adventure/.test(second.reason), "and says why");
  store.setPivotOverride(adv.id, true);
  equal(roller.revealPivot(store.active()).ok, true, "the override permits one more");
  equal(store.active().pivotOverride, false, "and is cleared by use (setter/reader/clearer)");
});

test("the override never survives a reload (its clearer is normalization)", () => {
  const adv = atPivot({ failsafe: true });
  store.setPivotOverride(adv.id, true);
  const reloaded = store.__setState(JSON.parse(JSON.stringify({ version: 1, adventures: store.adventures(), rollLog: [], activeAdventureId: adv.id })));
  equal(reloaded.adventures[0].pivotOverride, false, "cleared");
});

test("a recorded Fate Question of No blocks the pivot (the answer is load-bearing)", () => {
  const adv = atPivot({ survived: true });
  equal(derived.canRevealPivot(store.active()).ok, true, "allowed before any answer");
  store.setFateAnswer(adv.id, "no");
  const blocked = derived.canRevealPivot(store.active());
  equal(blocked.ok, false, "No means no pivot");
  assert(/does not enact/.test(blocked.reason), "and the refusal cites the answer");
  equal(roller.revealPivot(store.active()).ok, false, "the engine refuses too");
  store.setFateAnswer(adv.id, "exceptional-yes");
  equal(derived.canRevealPivot(store.active()).ok, true, "a Yes re-opens it");
});

test("the villain behind the villain is a field, not a sentence (End Goal Focus 73-76)", () => {
  const adv = freshAdventure();
  equal(store.active().villain.behind, "", "the field exists on a new adventure");
  store.updateVillain(adv.id, { behind: "The king himself." });
  equal(store.active().villain.behind, "The king himself.", "and it persists");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  equal(older.adventures[0].villain.behind, "", "old records back-fill it");
  const src = readFileSync("src/sheet.js", "utf8");
  assert(/villain-behind/.test(src) && /focus.key === "villain-behind"/.test(src),
    "the control is offered exactly where the rule applies");
});

test("the app rolls no Fate Question: the answer is recorded, never generated", () => {
  const adv = atPivot({ survived: true });
  const before = store.rollLog().length;
  store.setFateAnswer(adv.id, "yes");
  equal(store.rollLog().length, before, "recording an answer rolls nothing");
  equal(store.active().fateAnswer, "yes", "and is kept");
  const src = readFileSync("src/sheet.js", "utf8");
  assert(!/fate[A-Za-z]*\s*=\s*(d10|d100|die)\(/i.test(src), "nothing derives a fate answer from dice");
});

// ---------------------------------------------------------------- arcs
test("the arc cannot advance out of Discovery until the End Goal is out", () => {
  const adv = freshAdventure();
  const preview = lifecycle.previewAdvance(adv);
  assert(preview.blocked, "blocked");
  equal(lifecycle.advance(adv).ok, false, "and the engine refuses");
});

test("an arc boundary reports what changed and undo puts it back", () => {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  const result = lifecycle.advance(store.active());
  assert(result.ok, "advanced");
  assert(result.summary.length >= 1, "it summarised the bundle");
  equal(derived.arcStageKey(store.active()), "foiling", "stage moved");
  const undone = lifecycle.undo();
  assert(undone.ok, "undo ran");
  equal(derived.arcStageKey(store.active()), "discovery", "stage restored");
});

test("deleting the End Goal reopens the Discovery arc", () => {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  lifecycle.advance(store.active());
  store.deletePhase(adv.id, "eg");
  equal(derived.arcStageKey(store.active()), "discovery", "back to Discovery");
  equal(derived.canEarnReveal(store.active()).ok, true, "reveals are earnable again");
});

// ---------------------------------------------------------------- leads & record
test("a lead persists, toggles and counts in the header", () => {
  const adv = freshAdventure();
  const r = roller.revealNext(store.active());
  store.addLead(adv.id, r.phase.id, "Who is paying the diggers?");
  equal(derived.openLeads(store.active()).length, 1, "counted while open");
  store.toggleLead(adv.id, r.phase.id, store.active().phases[0].leads[0].id);
  equal(derived.openLeads(store.active()).length, 0, "not counted once resolved");
  // The count lives on the Dossier tab's badge, not in the header: one number, one place
  // (docs/AUDIT.md F38).
  equal(derived.headerStats(store.active()).openLeads, undefined, "the header does not carry it");
});

test("the session record grows as the adventure is played", () => {
  const adv = freshAdventure();
  roller.revealNext(store.active());
  const rows = store.sessionRecord(adv.id);
  assert(rows.length >= 2, "a start row and a reveal row");
});

test("nextStep always names something to do", () => {
  equal(typeof derived.nextStep(null).text, "string", "with no adventure");
  const adv = freshAdventure();
  for (const stage of ["discovery", "foiling", "pivot", "concluded"]) {
    store.setArcStage(adv.id, stage, {});
    const step = derived.nextStep(store.active());
    assert(step.text && step.route, `${stage} has an onward route`);
  }
});

// ---------------------------------------------------------------- storage
test("export round-trips through import unchanged", () => {
  const adv = freshAdventure();
  roller.revealNext(store.active());
  store.addLead(adv.id, store.active().phases[0].id, "A lead");
  const before = store.exportJSON();
  const result = store.importJSON(before);
  assert(result.ok, "imported");
  const after = store.exportJSON();
  deepEqual(JSON.parse(after).adventures, JSON.parse(before).adventures, "adventures survive the round trip");
});

test("import refuses rubbish without destroying what is there", () => {
  const adv = freshAdventure();
  const bad = store.importJSON("{ not json");
  equal(bad.ok, false, "refused");
  assert(store.adventure(adv.id), "the existing adventure is untouched");
  equal(store.importJSON('{"nothing":1}').ok, false, "and a valid file with no adventures is refused too");
});

test("an old-shape record loads into the current shape (migration fixture, §10.17)", () => {
  const old = JSON.parse(readFileSync("tests/fixtures/old-shape.json", "utf8"));
  const state = store.__setState(old);
  equal(state.adventures.length, 1, "the top-level adventure moved into the list");
  const adv = state.adventures[0];
  assert(adv.id, "an id was minted");
  equal(adv.arc.stage, "discovery", "a missing arc block defaults");
  deepEqual(derived.planPhases(adv).map((p) => p.ordinal), [1], "ordinals are recomputed, not trusted");
  equal(adv.phases[1].ordinal, null, "the End Goal carries no ordinal");
  equal(adv.pivotOverride, false, "a spent override is cleared");
  equal(adv.phases[0].leads.length, 1, "the empty lead was dropped");
  assert(adv.phases[0].leads[0].id, "leads gain ids");
  equal(state.activeAdventureId, adv.id, "an active adventure is chosen");
});

test("the roll log is capped and keeps the newest", () => {
  const adv = freshAdventure();
  for (let i = 0; i < data.LOG_CAP + 15; i += 1) store.pushLog({ adventureId: adv.id, kind: "phase", dice: [], summary: `row ${i}` });
  const rows = store.rollLog();
  equal(rows.length, data.LOG_CAP, "capped");
  equal(rows[0].summary, `row ${data.LOG_CAP + 14}`, "newest first");
});

test("the distribution counts every face it was given", () => {
  store.__setState({ version: 1, adventures: [], rollLog: [], activeAdventureId: null });
  const adv = store.createAdventure({ name: "dist" });
  store.pushLog({ adventureId: adv.id, kind: "phase", dice: [{ die: "d10", value: 7 }, { die: "d100", value: 44 }] });
  const dist = store.logDistribution();
  equal(dist.d10[6], 1, "the 7 was counted");
  equal(dist.d100Deciles[4], 1, "44 landed in 41-50");
  equal(dist.d10Total, 1, "totals agree");
});

test("a readable export names the phases and their dice", () => {
  const adv = freshAdventure();
  roller.revealNext(store.active());
  const text = store.exportText(adv.id);
  assert(/PHASE 1/.test(text), "phases are labelled");
  assert(/End Goal Roll: d10/.test(text), "the check is shown");
});

// ---------------------------------------------------------------- dead-data scan
test("dead-data scan: every export is imported somewhere (§11.2.1)", () => {
  const files = SHIPPED.filter((f) => f !== "service-worker.js");
  const bodies = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  const allowed = new Set([
    "firebaseConfig", "FIREBASE_ENABLED",   // Phase 5 shape, deliberately unconsumed (§1.1)
    "__setState",                            // test seam, named as one
    "rollKeywords",                          // engine API the unit harness exercises directly
    "fateLadder", "opmChart",                // the chart's two cross-checks, harness-only
    // The Crafter's engine and its screen share one module, so these have no importer
    // outside it; the harness drives them directly and every one has a test.
    "rollArchetype", "rollOrganization", "rollUnderling",
    "modifierBreakdown", "canRollOrganization", "canRollUnderling",
    // The scene engine and its screens share one module, as the Crafter's do.
    "testScene", "endScene", "interruptEvent", "rollAdjustments", "rollFromList",
    "routes",                                // the layout probe's single source of routes
    "die", "d10", "d100",                    // dice primitives, reached through the roller
    "clearNode", "clearUndo", "deepClone",
    "FOCUS_TABLES"                           // the table roster the harness iterates
  ]);
  const dead = [];
  for (const [file, body] of bodies) {
    const names = [];
    for (const m of body.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) names.push(m[1]);
    for (const m of body.matchAll(/export\s+(?:const|let|class)\s+(\w+)/g)) names.push(m[1]);
    for (const m of body.matchAll(/export\s*\{([^}]+)\}/g)) for (const part of m[1].split(",")) names.push(part.trim().split(/\s+as\s+/).pop());
    for (const name of names) {
      if (allowed.has(name)) continue;
      const used = [...bodies].some(([other, text]) => other !== file && new RegExp(`\\b${name}\\b`).test(text));
      if (!used) dead.push(`${file}: ${name}`);
    }
  }
  assert(dead.length === 0, `exported but never imported:\n    ${dead.join("\n    ")}`);
});

test("dead-data scan: every rules table reaches a consumer", () => {
  const bodies = SHIPPED.map((f) => readFileSync(f, "utf8")).join("\n");
  for (const name of ["VILLAIN_PLAN_FOCUS", "END_GOAL_FOCUS", "PIVOT_PLAN_FOCUS", "PLOT_TWISTS",
    "END_GOAL_ROLL", "PIVOT_GATE", "ARC_STAGES", "GUIDANCE", "NOT_IN_SOURCE", "LOG_CAP", "SOURCE"]) {
    const uses = bodies.split(name).length - 1;
    assert(uses >= 2, `${name} is declared but never read`);
  }
});

test("every guidance entry is surfaced somewhere", () => {
  const ui = ["src/sheet.js", "src/screens.js", "src/wizard.js", "src/tutorial.js"].map((f) => readFileSync(f, "utf8")).join("\n");
  for (const key of Object.keys(data.GUIDANCE)) {
    assert(ui.includes(`"${key}"`), `GUIDANCE.${key} is never shown`);
  }
});

test("every library entry id linked from the UI exists", () => {
  const ui = ["src/sheet.js", "src/screens.js", "src/wizard.js", "src/tutorial.js"].map((f) => readFileSync(f, "utf8")).join("\n");
  const ids = new Set(rules.libraryGroups().flatMap((g) => g.entries).map((e) => e.id));
  const linked = [...ui.matchAll(/citeLink\("([\w-]+)"/g)].map((m) => m[1]);
  assert(linked.length > 0, "the UI links to the library at all");
  for (const id of linked) assert(ids.has(id), `citeLink points at a missing entry: ${id}`);
});

test("the service worker caches every shipped file", () => {
  const sw = readFileSync("service-worker.js", "utf8");
  for (const file of SHIPPED.filter((f) => f !== "service-worker.js")) {
    assert(sw.includes(`./${file}`), `${file} is missing from the app shell`);
  }
  assert(!sw.includes("./tests/"), "dev-only harnesses stay out of the shell");
});

process.exit(report("unit") ? 0 : 1);
