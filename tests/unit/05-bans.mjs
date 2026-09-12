// unit: bans
import { readFileSync } from "node:fs";
import { test, assert } from "../harness.mjs";
import { SHIPPED, stripComments, roller } from "./shared.mjs";

// ---------------------------------------------------------------- bans

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
