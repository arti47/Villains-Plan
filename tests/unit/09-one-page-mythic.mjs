// unit: One-Page Mythic
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { rules, derived, store, mythic, oracle, freshAdventure, atPivot } from "./shared.mjs";

// ---------------------------------------------------------------- One-Page Mythic

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
