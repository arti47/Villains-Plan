// unit: the pivot gate
import { readFileSync } from "node:fs";
import { test, assert, equal } from "../harness.mjs";
import { data, derived, store, roller, fate, check, freshAdventure, atPivot } from "./shared.mjs";

// ---------------------------------------------------------------- the pivot gate

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
