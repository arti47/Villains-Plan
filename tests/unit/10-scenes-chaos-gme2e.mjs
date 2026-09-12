// unit: scenes & chaos (GME2e)
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { rules, derived, store, oracle, sceneData, fate, actions, sceneEngine, elements, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- scenes & chaos (GME2e)

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
  equal(rules.notSupplied().length, 0,
    "nothing is unsupplied any more: every rule the app automates is read from a page or a quotation");
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
