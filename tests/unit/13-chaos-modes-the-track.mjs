// unit: chaos modes & the track
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { rules, derived, store, oracle, sceneData, sceneEngine, freshAdventure } from "./shared.mjs";

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
  equal(missing.trim(), "", "nothing is unsupplied: the last gap closed with the Progress Track chapter");
  equal(rules.stillNotInSource().length, 0, "and the other gap list is empty too");
  // every chaos mode the book prints is now offered, on both resolutions
  const modes = rules.chaosModes().map((m) => m.key);
  for (const key of ["standard", "low-chaos", "mid-chaos", "no-chaos", "random-chaos"]) {
    assert(modes.includes(key), `${key} is a mode`);
  }
});
