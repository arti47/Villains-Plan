// unit: backups
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { data, rules, derived, store, lifecycle, sceneEngine, check, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- backups
test("a backup is a ring: newest first, capped, and each one restores", () => {
  store.__setState(null);
  try { localStorage.removeItem("schemer.v1.backups"); } catch {}
  equal(store.backups().length, 0, "starts empty");
  const adv = freshAdventure();
  const original = adv.name;   // updateAdventure mutates in place, so keep the value, not the reference
  for (let i = 0; i < store.BACKUP_KEEP + 2; i += 1) store.backup(`backup ${i}`);
  const list = store.backups();
  equal(list.length, store.BACKUP_KEEP, "capped at the keep count");
  equal(list[0].label, `backup ${store.BACKUP_KEEP + 1}`, "newest first");
  equal(list[0].adventures, 1, "records how many adventures it holds");
  // change something, then restore the newest: the change is gone and undo can bring it back
  store.updateAdventure(adv.id, { name: "renamed after the backup" });
  const result = store.restoreBackup(list[0].id);
  assert(result.ok, "restores");
  equal(store.active().name, original, "the rename is gone");
  assert(store.undoAvailable(), "and the restore itself left one step of undo");
  store.undo();
  equal(store.active().name, "renamed after the backup", "which brings the rename back");
});

test("a backup is taken before every irreversible thing: an arc boundary, a delete, an import", () => {
  store.__setState(null);
  try { localStorage.removeItem("schemer.v1.backups"); } catch {}
  const adv = freshAdventure();
  store.setArcStage(adv.id, "foiling", {});
  const before = store.backups().length;
  const moved = lifecycle.advance(store.active());
  assert(moved.ok, `the boundary fired: ${moved.reason || ""}`);
  equal(store.backups().length, before + 1, "an arc boundary takes one");
  assert(/^before /.test(store.backups()[0].label), "labelled with what was about to happen");
  const file = store.exportJSON();
  store.importJSON(file);
  equal(store.backups().length, before + 2, "an import takes one");
  store.deleteAdventure(store.active().id);
  equal(store.backups().length, before + 3, "a delete takes one");
  assert(store.backups()[0].data.adventures.length === 1, "and the delete's backup still holds the adventure");
});

test("a backup exports in the same file shape as an export, so it imports anywhere", () => {
  store.__setState(null);
  const adv = freshAdventure();
  const entry = store.backup("shape check");
  const parsed = JSON.parse(store.backupJSON(entry.id));
  assert(Array.isArray(parsed.adventures) && parsed.adventures[0].id === adv.id, "carries the adventures");
  equal(parsed.backupOf, "shape check", "says what it was a backup of");
  const imported = store.importJSON(store.backupJSON(entry.id));
  assert(imported.ok, "and importJSON accepts it");
});

test("an Exceptional No shuts Discovery down for the rest of the scene, and only that scene", () => {
  const adv = freshAdventure();
  sceneEngine.testScene(store.active(), {});
  const scene = derived.currentScene(store.active());
  equal(scene.discoveryClosed, false, "a fresh scene allows a Discovery Check");
  store.updateScene(adv.id, scene.id, { discoveryClosed: true });
  equal(derived.currentScene(store.active()).discoveryClosed, true, "an Exceptional No closes it");
  // it survives a save/reload, because it gates a control
  const reloaded = store.__setState(JSON.parse(store.exportJSON()));
  equal(derived.currentScene(reloaded.adventures[0]).discoveryClosed, true, "and it is persisted");
  // ...and the NEXT scene opens it again, which is the whole point of the rule
  sceneEngine.endScene(store.active(), "in");
  sceneEngine.testScene(store.active(), {});
  equal(derived.currentScene(store.active()).discoveryClosed, false, "the next scene opens it again");
});

test("the Discovery Fate Question decides how many times the table is rolled", () => {
  const answers = rules.progressTrack().discovery.answers;
  const by = (key) => answers.find((a) => a.key === key);
  equal(by("exceptional-yes").rolls, 2, "an Exceptional Yes rolls twice and combines");
  equal(by("yes").rolls, 1, "a Yes rolls once");
  equal(by("no").rolls, 0, "a No does not roll");
  equal(by("exceptional-no").rolls, 0, "nor an Exceptional No");
  equal(by("exceptional-no").closesScene, true, "which also shuts Discovery down for the scene");
  for (const key of ["yes", "no", "exceptional-yes"]) {
    assert(!by(key).closesScene, `${key} does not close the scene`);
  }
});

test("the Discovery Check table covers its range and only awards what the source states", () => {
  const rule = rules.progressTrack().discovery;
  equal(rule.minimumOdds, "50-50", "asked at no less than 50/50");
  const at = (total) => rule.rows.find((r) => total >= r.min && total <= r.max);
  equal(at(1).key, "progress-2", "1-9");
  equal(at(9).key, "progress-2", "to 9");
  equal(at(10).key, "flashpoint-2", "10");
  equal(at(14).key, "track-1", "11-14");
  equal(at(17).key, "progress-3", "15-17");
  equal(at(18).key, "flashpoint-3", "18");
  equal(at(19).key, "track-2", "19");
  equal(at(24).key, "strengthen-1", "20-24");
  equal(at(99).key, "strengthen-2", "25+");
  for (let total = -5; total <= 60; total += 1) assert(at(total), `total ${total} has a row`);
  // all eight results award points; the four that were once undefined are defined now
  deepEqual(rule.rows.map((r) => r.award.points), [2, 2, 1, 3, 3, 2, 1, 2],
    "every result awards the quoted points, reading down the table");
  deepEqual(rule.rows.map((r) => r.award.kind),
    ["progress", "flashpoint", "track", "progress", "flashpoint", "track", "strengthen", "strengthen"],
    "and each is the kind the book names - which matters, because only a flashpoint satisfies a phase");
  for (const row of rule.rows) assert(!/not stated|not in the source/i.test(row.text), `${row.key} no longer says the effect is unknown`);
});
