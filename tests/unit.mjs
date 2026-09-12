// Harness A — parse gate, data invariants, engine invariants, dead-data scan.
// Runs in seconds and gates every change (CLAUDE.md §11.4). One file per section, in
// tests/unit/, sharing the modules under test through tests/unit/shared.mjs.
import { report } from "./harness.mjs";

const FILES = [
  "./unit/01-the-build-number.mjs",
  "./unit/02-inert-rules-mechanically.mjs",
  "./unit/03-the-spec-cannot-lie-about-gaps.mjs",
  "./unit/04-parse-gate.mjs",
  "./unit/05-bans.mjs",
  "./unit/06-table-completeness.mjs",
  "./unit/07-the-threshold.mjs",
  "./unit/08-engine.mjs",
  "./unit/09-one-page-mythic.mjs",
  "./unit/10-scenes-chaos-gme2e.mjs",
  "./unit/11-the-fate-check.mjs",
  "./unit/12-backups.mjs",
  "./unit/13-chaos-modes-the-track.mjs",
  "./unit/14-elements-gme2e.mjs",
  "./unit/15-the-villain-crafter.mjs",
  "./unit/16-the-pivot-gate.mjs",
  "./unit/17-arcs.mjs",
  "./unit/18-leads-record.mjs",
  "./unit/19-storage.mjs",
  "./unit/20-dead-data-scan.mjs",
];

for (const file of FILES) await import(file);

process.exit(report("unit") ? 0 : 1);

