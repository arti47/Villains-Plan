// unit: storage
import { readFileSync } from "node:fs";
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { data, derived, store, roller, check, freshAdventure } from "./shared.mjs";

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
