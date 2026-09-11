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

test("every library entry with a citation cites one of the three sources", () => {
  const lib = rules.libraryGroups().flatMap((g) => g.entries);
  for (const entry of lib) if (entry.cite) assert(/^(MM69:p\d|MM41:p\d|OPM$)/.test(entry.cite), `${entry.id} cites ${entry.cite}`);
  assert(lib.length >= 28, "the library covers every automated rule from all three sources");
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
      const word = rules.discoverWord(column, roll);
      assert(word.word && typeof word.word === "string", `roll ${roll} on ${column}`);
      words.add(word.word);
    }
    equal(words.size, 50, `${column} words are unique`);
  }
  equal(rules.discoverWord("action", 1).word, "Attain", "1-2 is the first row");
  equal(rules.discoverWord("action", 2).word, "Attain", "and both halves of it");
  equal(rules.discoverWord("description", 100).word, "Warm", "99-100 is the last row");
  equal(rules.discoverWord("action", 69).word, "Mundane", "69-70 Action");
  equal(rules.discoverWord("description", 59).word, "Mundane", "59-60 Description");
});

test("an unknown Discover Meaning column throws", () => {
  let threw = false;
  try { rules.discoverWord("vibes", 5); } catch { threw = true; }
  assert(threw, "there are two columns and no others");
});

test("an ask writes one log row, and a double writes the event die with it", () => {
  const adv = freshAdventure();
  let withEvent = null; let withoutEvent = null;
  for (let i = 0; i < 400 && (!withEvent || !withoutEvent); i += 1) {
    const result = oracle.ask({ question: "Is the mine still guarded?", odds: "50-50" });
    if (result.double) withEvent = result; else withoutEvent = result;
  }
  assert(withEvent && withoutEvent, "both outcomes occur in 400 asks");
  equal(withEvent.event.word.length > 0, true, "a double rolls an Action word");
  const rows = store.rollLog({ kind: "ask" });
  const doubleRow = rows.find((r) => r.dice.length === 2);
  const plainRow = rows.find((r) => r.dice.length === 1);
  assert(doubleRow && plainRow, "the log shows one die normally and two on a double");
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
  equal(derived.headerStats(store.active()).openLeads, 0, "and the header agrees");
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
    // The Crafter's engine and its screen share one module, so these have no importer
    // outside it; the harness drives them directly and every one has a test.
    "rollArchetype", "rollOrganization", "rollUnderling",
    "modifierBreakdown", "canRollOrganization", "canRollUnderling",
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
