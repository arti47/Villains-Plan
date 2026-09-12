// unit: The Villain Crafter
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { data, rules, store, vc, crafter, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- The Villain Crafter

test("Villain Archetype: 23 rows, every roll 1-100 returns exactly one, keys unique", () => {
  equal(vc.VILLAIN_ARCHETYPES.rows.length, 23, "rows");
  for (let roll = 1; roll <= 100; roll += 1) {
    const hits = vc.VILLAIN_ARCHETYPES.rows.filter((r) => roll >= r.min && roll <= r.max);
    equal(hits.length, 1, `roll ${roll}`);
  }
  equal(new Set(vc.VILLAIN_ARCHETYPES.rows.map((r) => r.key)).size, 23, "unique keys");
});

test("the modified tables are open-ended, so a big modifier cannot fall off them", () => {
  for (const table of [vc.VILLAIN_ORGANIZATIONS, vc.UNDERLINGS]) {
    for (const total of [-40, -1, 0, 1, 50, 100, 140, 200]) {
      const row = rules.lookupOpen(table, total);
      assert(row && row.label, `${table.name} at ${total}`);
    }
    for (let total = -50; total <= 200; total += 1) {
      const hits = table.rows.filter((r) => total >= r.min && total <= r.max);
      equal(hits.length, 1, `${table.name} at ${total}`);
    }
  }
});

test("every archetype modifier matches the page (MM41:p6-7, transcribed from photographs)", () => {
  // Transcribed independently from page photographs, not from the data file. This is what
  // retires the reconstruction risk: the first extraction paired 22 ranges with 22 modifier
  // rows by ORDER, because the transcript de-interleaved them, and only three rows could be
  // checked against the article's worked examples (docs/AUDIT.md F33).
  const page = {
    "revenge": [0, 0, 0], "master-of-domain": [10, 10, 10], "domination": [10, 5, 5],
    "serves-another": [5, 5, 5], "conquest": [5, 5, 10], "schemer": [0, 0, 5],
    "brute": [-5, -5, 0], "doing-their-job": [5, 0, 0], "killer": [-5, -5, -5],
    "money": [-5, -5, -5], "inscrutable": [5, 0, 0], "thrill": [-10, -5, -5],
    "one-of-the-people": [0, 5, 5], "class-act": [5, 10, 10], "higher-purpose": [5, 5, 5],
    "personal-need": [-5, -5, -5], "no-choice": [10, 0, 5], "i-am-the-best": [-10, -10, 0],
    "making-a-point": [0, 5, 5], "power": [10, 5, 10], "duty-bound": [-5, -5, 5],
    "meaning-table": [0, 0, 0], "double": [0, 0, 0]
  };
  equal(Object.keys(page).length, vc.VILLAIN_ARCHETYPES.rows.length, "every row is accounted for");
  for (const row of vc.VILLAIN_ARCHETYPES.rows) {
    const expected = page[row.key];
    assert(expected, `${row.key} is on the page`);
    deepEqual([row.mods.o, row.mods.l, row.mods.m], expected, `${row.label} modifiers`);
  }
});

test("every organization modifier matches the page (MM41:p10-11, transcribed from photographs)", () => {
  const page = {
    "none": [-10, -10], "gang": [-5, -10], "hired-hands": [0, -5], "followers": [-10, -5],
    "family": [-5, -10], "cult": [0, 0], "organized-crime": [5, 0], "secret-society": [10, 5],
    "army": [5, 5], "professionals": [5, 10], "company": [10, 10], "corrupted": [10, 5],
    "syndicate": [10, 5], "sprawling": [10, 10], "government": [10, 10], "upscale": [5, 5],
    "meaning-table": [0, 0], "double": [0, 0]
  };
  equal(Object.keys(page).length, vc.VILLAIN_ORGANIZATIONS.rows.length, "every row is accounted for");
  for (const row of vc.VILLAIN_ORGANIZATIONS.rows) {
    const expected = page[row.key];
    assert(expected, `${row.key} is on the page`);
    deepEqual([row.mods.l, row.mods.m], expected, `${row.label} modifiers`);
  }
});

test("the band boundaries match the page too", () => {
  const bands = [[1, "revenge"], [6, "revenge"], [7, "master-of-domain"], [16, "master-of-domain"],
    [17, "domination"], [20, "domination"], [25, "schemer"], [32, "schemer"], [44, "thrill"],
    [45, "one-of-the-people"], [63, "power"], [70, "power"], [74, "duty-bound"],
    [75, "meaning-table"], [80, "meaning-table"], [81, "double"], [100, "double"]];
  for (const [roll, key] of bands) equal(rules.lookupOpen(vc.VILLAIN_ARCHETYPES, roll).key, key, `archetype ${roll}`);
  const orgBands = [[-30, "none"], [8, "none"], [9, "gang"], [22, "hired-hands"], [23, "followers"],
    [40, "organized-crime"], [41, "secret-society"], [48, "company"], [53, "company"],
    [68, "government"], [69, "upscale"], [74, "upscale"], [80, "meaning-table"], [81, "double"], [150, "double"]];
  for (const [total, key] of orgBands) equal(rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, total).key, key, `organization ${total}`);
});

test("the article's own example arithmetic comes out right (MM41:p16)", () => {
  // Has No Choice + One Of The People, then The Company: lieutenants +15, minions +20.
  const noChoice = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "no-choice");
  const people = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "one-of-the-people");
  equal(noChoice.mods.o + people.mods.o, 10, "organization modifier is +10");
  const org = rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, 42 + 10);
  equal(org.key, "company", "42 +10 = 52 is The Company");
  equal(noChoice.mods.l + people.mods.l + org.mods.l, 15, "lieutenant modifier is +15");
  equal(noChoice.mods.m + people.mods.m + org.mods.m, 20, "minion modifier is +20");
  equal(rules.lookupOpen(vc.UNDERLINGS, 28 + 15).key, "tough-stuff", "the lieutenant roll gives Tough Stuff");
  equal(rules.lookupOpen(vc.UNDERLINGS, 7 + 20).key, "groveler", "the minion roll gives Groveler");
});

test("the spore example's organization roll also reproduces", () => {
  // The Domination Game is +10 to the organization roll; 25 +10 = 35 is Organized Crime.
  const domination = vc.VILLAIN_ARCHETYPES.rows.find((r) => r.key === "domination");
  equal(domination.mods.o, 10, "+10");
  equal(rules.lookupOpen(vc.VILLAIN_ORGANIZATIONS, 25 + 10).key, "organized-crime", "35");
});

test("Double Archetypes always resolves to real archetypes, never to itself", () => {
  let sawDouble = false;
  for (let i = 0; i < 300; i += 1) {
    const result = crafter.rollArchetype();
    assert(result.parts.length >= 1, "at least one archetype");
    for (const part of result.parts) {
      assert(part.special !== "double", "a Double is never left in the result");
      assert(part.label, "every part is named");
    }
    if (result.parts.length > 1) sawDouble = true;
    // the modifiers are the sum of the parts, which is what the rule says to do
    const sum = result.parts.reduce((a, p) => a + (p.mods ? p.mods.o : 0), 0);
    equal(result.mods.o, sum, "organization modifier is the sum of the parts");
  }
  assert(sawDouble, "a double archetype occurs in 300 rolls and combines two");
});

test("Upscale rolls again and keeps both sets of modifiers", () => {
  let sawUpscale = false;
  for (let i = 0; i < 400 && !sawUpscale; i += 1) {
    const result = crafter.rollOrganization(0);
    if (!result.upscaled) continue;
    sawUpscale = true;
    assert(result.parts.length >= 2, "the Upscale row and the result it scaled");
    const sum = result.parts.reduce((a, p) => a + (p.mods ? p.mods.l : 0), 0);
    equal(result.mods.l, sum, "both sets of modifiers count");
    assert(result.parts.some((p) => !p.scaffold), "something real came out of it");
  }
  assert(sawUpscale, "Upscale occurs in 400 rolls");
});

test("a nested Double is re-rolled, not expanded (the rule, and why it terminates)", () => {
  // At +40 the organization table lands on Double (81 or more) on roughly three rolls in
  // five. Expanding those recursively diverges - which is how this shipped first, and
  // what docs/AUDIT.md F28 records. Two archetypes is the most a Double may produce.
  for (let i = 0; i < 300; i += 1) {
    const result = crafter.rollOrganization(40);
    const real = result.parts.filter((p) => !p.scaffold);
    assert(real.length <= 2, `a Double produced ${real.length} archetypes`);
    for (const part of result.parts) assert(part.special !== "double", "no Double survives in the result");
  }
});

test("Teamwork rolls a partner archetype, and Teamwork inside Teamwork does not", () => {
  // F49: this used to assert ONE Teamwork per result, which is not the rule and failed
  // about one run in ten. The underling table's 83+ is Double Archetypes, which draws two
  // independent entries and leaves no trace of itself in `parts`; each of those may land
  // on Teamwork (59-60) entirely legitimately. What the book actually forbids is a
  // Teamwork drawn as a Teamwork's PARTNER - "Teamwork rolled again reads as As Expected"
  // - and a partner always sits immediately after its Teamwork in the flattened parts.
  // Why two Teamworks are possible is a fact about the table, so assert THAT rather than
  // waiting for the dice to show it - two Teamworks need a Double and then 59-60 twice,
  // which is roughly one roll in fourteen thousand. Asserting on that would be the very
  // mistake this test is being fixed for.
  const rows = vc.UNDERLINGS.rows;
  const double = rows.find((r) => r.special === "double");
  const teamwork = rows.find((r) => r.special === "teamwork");
  assert(double && double.min === 83, "83 or more is Double Archetypes: two independent draws");
  assert(teamwork && teamwork.min === 59 && teamwork.max === 60, "59-60 is Teamwork");

  let sawTeamwork = false;
  for (let i = 0; i < 2000; i += 1) {
    const result = crafter.rollUnderling("lieutenant", 0);
    const parts = result.parts;
    if (parts.some((p) => p.special === "teamwork")) sawTeamwork = true;
    parts.forEach((part, at) => {
      if (part.special !== "teamwork") return;
      assert(parts[at + 1], "a Teamwork is always followed by its partner");
      assert(parts[at + 1].special !== "teamwork",
        `a Teamwork's partner was another Teamwork: ${parts.map((p) => p.label).join(" | ")}`);
    });
  }
  assert(sawTeamwork, "Teamwork occurs in 2000 rolls");
});

test("every crafter cascade terminates", () => {
  for (let i = 0; i < 200; i += 1) {
    const arch = crafter.rollArchetype();
    assert(arch.rolls.length < 20, `archetype cascade ran ${arch.rolls.length} times`);
    const org = crafter.rollOrganization(40);   // a big modifier pushes Double more often
    assert(org.rolls.length < 20, `organization cascade ran ${org.rolls.length} times`);
    const und = crafter.rollUnderling("lieutenant", 40);
    assert(und.rolls.length < 20, `underling cascade ran ${und.rolls.length} times`);
  }
});

test("the minion column overrides the lieutenant one where the table splits it", () => {
  const row = vc.UNDERLINGS.rows.find((r) => r.key === "anger-issues");
  equal(row.label, "Anger Issues", "lieutenant entry");
  equal(row.minion.label, "Soldier", "minion entry");
  const shared = vc.UNDERLINGS.rows.find((r) => r.key === "true-believer");
  equal(shared.shared, true, "and shared rows read the same for both");
  assert(!shared.minion, "with no separate minion entry");
});

test("every band of the minion column is readable - the source gap is closed (A19)", () => {
  const gaps = vc.UNDERLINGS.rows.filter((r) => r.minion && r.minion.unrecovered);
  equal(gaps.length, 0, "no band ships marked unrecovered any more");
  for (let total = -20; total <= 120; total += 1) {
    const entry = rules.lookupOpen(vc.UNDERLINGS, total);
    const minion = entry.minion || entry;
    assert(minion.label && (minion.text || entry.shared), `minion result at ${total} has an archetype`);
  }
  // the three bands the photographs recovered, and the merged cells they belong to
  const at = (n) => { const r = rules.lookupOpen(vc.UNDERLINGS, n); return r.minion ? r.minion.label : r.label; };
  deepEqual([at(40), at(43)], ["Soldier", "Soldier"], "the Soldier cell spans 40-44");
  deepEqual([at(68), at(71), at(73), at(75)], ["On A Mission", "On A Mission", "On A Mission", "On A Mission"],
    "the On A Mission cell spans 68-76");
  deepEqual([at(43) === at(41), at(68) === at(70)], [true, true], "which is what merged cells mean");
});

test("no minion roll can come back without an archetype", () => {
  for (let i = 0; i < 400; i += 1) {
    const result = crafter.rollUnderling("minion", (i % 9) * 10 - 20);
    for (const part of result.parts) {
      assert(part.label, "every part is named");
      assert(!part.unrecovered, "and none is a gap");
    }
  }
});

test("crafter rolls are logged with their dice and recorded", () => {
  const adv = freshAdventure();
  const before = store.rollLog({ kind: "crafter" }).length;
  const result = crafter.rollArchetype();
  const rows = store.rollLog({ kind: "crafter" });
  equal(rows.length, before + 1 + result.words.length, "one row for the archetype, plus any meaning-table word");
  assert(rows[rows.length - 1].dice.length >= 1, "the dice are kept");
  assert(store.sessionRecord(adv.id).some((r) => r.kind === "crafter"), "and the session record shows it");
});

test("the organization roll is gated on the archetype, whose modifier it carries", () => {
  const adv = freshAdventure();
  const blocked = crafter.canRollOrganization(store.active());
  equal(blocked.ok, false, "refused");
  assert(/archetype first/.test(blocked.reason), "and says why");
  store.setCrafted(adv.id, { archetype: crafter.rollArchetype() });
  equal(crafter.canRollOrganization(store.active()).ok, true, "allowed once the archetype is known");
});

test("the modifier breakdown shows the arithmetic it applies", () => {
  const adv = freshAdventure();
  const archetype = { mods: { o: 10, l: 0, m: 5 }, parts: [{ label: "Has No Choice" }], rolls: [57] };
  const organization = { mods: { l: 10, m: 10 }, parts: [{ label: "The Company" }], rolls: [{ roll: 42, mod: 10, total: 52 }] };
  store.setCrafted(adv.id, { archetype, organization });
  const mods = crafter.modifierBreakdown(store.active());
  equal(mods.organization.total, 10, "organization takes the archetype's o");
  equal(mods.lieutenant.total, 10, "lieutenant takes l from both");
  equal(mods.minion.total, 15, "minion takes m from both");
  equal(mods.hasOrganization, true, "and knows the organization is rolled");
});

test("details attach to the villain and to one underling, and survive a reload", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("minion", 0);
  store.addUnderling(adv.id, "minion", entry);
  store.addDetail(adv.id, { kind: "villain" }, { tableId: "character-identity", table: "Character Identity", roll: 98, word: "Villain" });
  store.addDetail(adv.id, { kind: "minion", id: entry.id }, { tableId: "character-skills", table: "Character Skills", roll: 62, word: "Military" });
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = reloaded.adventures[0];
  equal(saved.villain.details.length, 1, "the villain's detail survived");
  equal(saved.villain.details[0].word, "Villain", "with its word");
  equal(saved.villain.crafted.minions[0].details.length, 1, "and the minion's");
  assert(saved.villain.details[0].id, "details get ids");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  deepEqual(older.adventures[0].villain.details, [], "an old record back-fills an empty list");
});

test("a detail is removed from the holder it belongs to, and only that one", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("lieutenant", 0);
  store.addUnderling(adv.id, "lieutenant", entry);
  const a = store.addDetail(adv.id, { kind: "villain" }, { table: "Character Identity", roll: 1, word: "Abandoned" });
  store.addDetail(adv.id, { kind: "lieutenant", id: entry.id }, { table: "Character Skills", roll: 2, word: "Adversity" });
  store.removeDetail(adv.id, { kind: "villain" }, a.id);
  equal(store.active().villain.details.length, 0, "removed from the villain");
  equal(store.active().villain.crafted.lieutenants[0].details.length, 1, "the lieutenant's is untouched");
});

test("a crafted villain survives a reload, and an old adventure back-fills one", () => {
  const adv = freshAdventure();
  store.setCrafted(adv.id, { archetype: crafter.rollArchetype() });
  const entry = crafter.rollUnderling("minion", 0);
  store.addUnderling(adv.id, "minion", entry);
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  const saved = reloaded.adventures[0].villain.crafted;
  equal(saved.minions.length, 1, "the minion survived");
  assert(saved.archetype, "and the archetype");
  const older = store.__setState({ version: 1, adventures: [{ name: "old", villain: { name: "x" } }], rollLog: [] });
  const blank = older.adventures[0].villain.crafted;
  deepEqual([blank.archetype, blank.organization, blank.lieutenants, blank.minions], [null, null, [], []], "old records get an empty roster");
});

test("underlings can be renamed and removed", () => {
  const adv = freshAdventure();
  const entry = crafter.rollUnderling("lieutenant", 0);
  store.addUnderling(adv.id, "lieutenant", entry);
  store.updateUnderling(adv.id, "lieutenant", entry.id, { name: "The Gargoyle" });
  equal(store.active().villain.crafted.lieutenants[0].name, "The Gargoyle", "renamed");
  store.removeUnderling(adv.id, "lieutenant", entry.id);
  equal(store.active().villain.crafted.lieutenants.length, 0, "removed");
});
