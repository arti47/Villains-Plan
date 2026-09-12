// unit: the Threshold
import { test, equal, deepEqual } from "../harness.mjs";
import { derived, advWith } from "./shared.mjs";

// ---------------------------------------------------------------- the Threshold

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
