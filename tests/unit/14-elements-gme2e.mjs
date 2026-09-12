// unit: Elements (GME2e)
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { rules, actions, elements } from "./shared.mjs";

// ---------------------------------------------------------------- Elements (GME2e)

test("all twelve Elements tables carry 100 unique words", () => {
  equal(elements.ELEMENT_TABLES.length, 12, "tables");
  for (const table of elements.ELEMENT_TABLES) {
    equal(table.words.length, 100, `${table.label} row count`);
    equal(new Set(table.words).size, 100, `${table.label} words are unique`);
    for (const word of table.words) assert(word && typeof word === "string", `${table.label} has no blank rows`);
  }
});

test("Elements words sit at the rolls the page shows", () => {
  // Anchors transcribed from the page photographs, one per table.
  const anchors = [
    ["character-identity", 98, "Villain"], ["character-identity", 51, "Killer"],
    ["character-motivations", 86, "Revenge"], ["character-personality", 100, "Wise"],
    ["character-skills", 100, "Wounds"], ["character-traits-flaws", 62, "Multi"],
    ["character-appearance", 77, "Scar"], ["character-background", 59, "Imprisonment"],
    ["character-conversations", 68, "Macabre"], ["character-descriptors", 88, "Sophisticated"],
    ["character-actions-combat", 100, "Withdraw"], ["character-actions-general", 100, "Yield"],
    ["city-descriptors", 69, "Opulence"]
  ];
  for (const [id, roll, word] of anchors) equal(rules.meaningWord(id, roll).word, word, `${id} ${roll}`);
});

test("the meaning registry covers every source, with the right span each", () => {
  const tables = rules.meaningTables();
  equal(tables.filter((t) => t.group === "Discover Meaning").length, 2, "the One-Page Mythic columns");
  equal(tables.filter((t) => t.group === "Actions").length, 2, "the GME2e Action tables");
  equal(tables.filter((t) => t.group === "Elements").length, 12, "the GME2e Elements tables");
  equal(rules.meaningTable("meaning-action").span, 2, "OPM prints 50 rows over 100 numbers");
  equal(rules.meaningTable("character-identity").span, 1, "Elements print 100");
  for (const table of tables) {
    const seen = new Set();
    for (let roll = 1; roll <= 100; roll += 1) seen.add(rules.meaningWord(table.id, roll).word);
    equal(seen.size, table.group === "Discover Meaning" ? 50 : 100, `${table.label} covers 1-100`);
  }
});

test("the seven tables The Villain Crafter names are all present (MM41:p5)", () => {
  const names = rules.villainDetailTables().map((t) => t.id);
  deepEqual(names, ["character-identity", "character-skills", "character-motivations",
    "character-personality", "character-appearance", "character-traits-flaws", "character-background"],
  "identity, skills, motivations, personality, appearance, traits & flaws, background");
});
