// Schemer — scenes, the Chaos Factor, bookkeeping, and the Threads & Characters lists,
// from the Mythic Game Master Emulator Second Edition. Cited GME2e.
//
// PROVENANCE (§2.1): this source was supplied as a WRITTEN SUMMARY of the rules, not as
// page images. A summary corroborates; it never decides. Everything here is a value the
// summary states exactly - the scene test, the Chaos Factor range and its adjustment, the
// weighting cap, the list size, the cleanup rule - and each is marked `provisional: true`
// so a later page image can confirm or correct it. Anything the summary NAMES but does
// not specify is in NOT_SUPPLIED below and is not implemented: no ranges are invented.

export const SCENES_SOURCE = {
  title: "Mythic Game Master Emulator Second Edition",
  section: "Scenes, the Chaos Factor and Bookkeeping",
  publisher: "Word Mill Games",
  cite: "GME2e",
  provenance: "summary, since confirmed in part",
  provisional: true,
  note: "This subsystem arrived as a written summary rather than page images. The scene test has since been confirmed against a photograph of the Testing The Expected Scene table, and the Scene Adjustment and Event Focus tables arrived as photographs too. The Chaos Factor range, the bookkeeping steps and the list sizes are still summary-only, so they stay marked provisional."
};

// T19 — the Chaos Factor. GME2e, via summary.
export const CHAOS = {
  cite: "GME2e",
  provisional: true,
  min: 1,
  max: 9,
  start: 5,
  step: 1,
  fixedForMechanics: 5,   // a Fate Question standing in for a core RPG roll always uses 5
  text: "One to nine, starting at five. It measures how much control the characters have. High chaos means more interruptions and more surprises; low chaos means the adventure goes more as you expect.",
  controls: [
    { key: "in", label: "In control", delta: -1,
      text: "The characters made progress, succeeded, drove events. Chaos drops by one, to a floor of one." },
    { key: "out", label: "Out of control", delta: 1,
      text: "Setbacks, failures, fleeing, events driving them. Chaos rises by one, to a ceiling of nine." }
  ]
};

// T20 — the scene test. Roll 1d10 against the Chaos Factor. GME2e, via summary.
export const SCENE_TEST = {
  cite: "GME2e",
  provisional: true,
  die: 10,
  outcomes: [
    { key: "expected", label: "Expected Scene",
      text: "The scene begins exactly as you pictured it. Play it." },
    { key: "altered", label: "Altered Scene",
      text: "The scene happens, but not quite as you pictured: the next most expected way, or the same scene with one element twisted." },
    { key: "interrupt", label: "Interrupt Scene",
      text: "Your expectation is set aside. Something else happens instead, and the adventure goes somewhere you did not plan." }
  ],
  rule: "Roll over the Chaos Factor and the Expected Scene happens. Roll at or under it and an odd result alters the scene, an even result interrupts it."
};

// T21 — the Threads and Characters lists. GME2e, via summary.
export const LISTS = {
  cite: "GME2e",
  provisional: true,
  lines: 25,
  sections: 5,
  maxEntries: 3,          // an element may hold at most three lines
  cleanupTo: 2,           // on a clean-up transfer, three-entry elements drop to two
  kinds: [
    { key: "threads", label: "Threads", singular: "thread",
      text: "The goals, missions and questions the characters are pursuing. Mythic never invents a new thread for you - your character decides what matters.",
      placeholder: "Find out who is paying the diggers" },
    { key: "characters", label: "Characters", singular: "character",
      text: "The people who matter - and anything else that should be able to walk into a scene: a place, an object, a recurring event.",
      placeholder: "General Gorazon · the seized mine · a raid on the road" }
  ],
  weighting: "An element that played a prominent part in the scene earns another line, to a maximum of three. More lines mean more chance of being picked, which is the whole point of the weighting.",
  cleanup: "When the twenty-five lines are full, carry the live elements to a fresh sheet: anything holding three lines comes across with two."
};

// T22 — the bookkeeping phase. GME2e, via summary.
export const BOOKKEEPING = {
  cite: "GME2e",
  provisional: true,
  steps: [
    { key: "lists", title: "Update the lists",
      text: "Add goals and characters the scene introduced. Give another line to anything that was prominent, up to three. Cross out what is finished, abandoned or gone." },
    { key: "chaos", title: "Adjust the Chaos Factor",
      text: "Ask whether the characters were generally in control of that scene or not, and move the Chaos Factor one step accordingly." }
  ]
};

// Named by the summary, not specified by it. None of this is implemented or approximated.
// Named by the summary and since supplied: the Fate Chart (data-fate-chart.js), the
// Event Focus and Scene Adjustment tables (data-actions.js) and the list selection
// procedure. What is still missing:
export const NOT_SUPPLIED = [
  "The Thread Progress Track.",
  "The Mid-Chaos, No-Chaos and Random Chaos variants.",
  "The Fate Check, if the edition offers it as an alternative to the Fate Chart."
];
