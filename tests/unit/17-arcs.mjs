// unit: arcs
import { test, assert, equal } from "../harness.mjs";
import { derived, store, lifecycle, freshAdventure } from "./shared.mjs";

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
