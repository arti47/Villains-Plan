// unit: table completeness
import { test, assert, equal } from "../harness.mjs";
import { data, rules } from "./shared.mjs";

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
