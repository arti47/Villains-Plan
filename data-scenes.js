// Schemer — scenes, the Chaos Factor, bookkeeping, and the Threads & Characters lists,
// from the Mythic Game Master Emulator Second Edition. Cited GME2e.
//
// PROVENANCE (§2.1): this subsystem arrived first as a WRITTEN SUMMARY, and shipped with
// every value marked provisional. The scene test has since been confirmed against a
// photograph, and the Chaos Factor rules, the list rules and the bookkeeping procedure
// have been confirmed against DIRECT QUOTATIONS from the book - which also corrected the
// clean-up rule the summary had blurred (see LISTS.cleanupEntries, docs/AUDIT.md F41).
// Those values are no longer provisional. LIST_SELECTION in data-actions.js is still
// summary-only and still marked. Anything named but not specified is in NOT_SUPPLIED.

export const SCENES_SOURCE = {
  title: "Mythic Game Master Emulator Second Edition",
  section: "Scenes, the Chaos Factor and Bookkeeping",
  publisher: "Word Mill Games",
  cite: "GME2e",
  provenance: "summary, since confirmed by quotation",
  provisional: false,
  note: "This subsystem arrived as a written summary and shipped marked provisional. The scene test was then confirmed against a photograph, and the Chaos Factor, list and bookkeeping rules against direct quotations from the book - which corrected the clean-up rule in the process. What remains summary-only is how a random event picks an entry from a list, which is still marked provisional where it lives."
};

// T19 — the Chaos Factor. GME2e, via summary.
export const CHAOS = {
  cite: "GME2e",
  provisional: false,   // confirmed by quotation
  min: 1,
  max: 9,
  start: 5,
  step: 1,
  // Quoted: "Treat the Chaos Factor as a value of 5 for these Questions, regardless of
  // what the actual Chaos Factor value is right now." Wired to a per-question control on
  // the Ask screen, so the rule fires instead of sitting here (docs/AUDIT.md F42).
  fixedForMechanics: 5,
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
  provisional: false,   // confirmed by photograph and by quotation
  die: 10,
  outcomes: [
    { key: "expected", label: "Expected Scene",
      text: "The scene begins exactly as you pictured it. Play it." },
    { key: "altered", label: "Altered Scene",
      text: "The scene happens, but not quite as you pictured: the next most expected way, or the same scene with one element twisted." },
    { key: "interrupt", label: "Interrupt Scene",
      text: "Your expectation is set aside. Something else happens instead, and the adventure goes somewhere you did not plan." }
  ],
  rule: "Roll over the Chaos Factor and the Expected Scene happens. Roll at or under it and an odd result alters the scene, an even result interrupts it.",
  note: "A 10 always clears the chart, because the Chaos Factor never exceeds 9 - which is why the book lists the even results as 2, 4, 6 and 8."
};

// T21 — the Threads and Characters lists. GME2e, via summary.
export const LISTS = {
  cite: "GME2e",
  provisional: false,   // confirmed by quotation, which corrected the clean-up rule
  lines: 25,
  sections: 5,
  maxEntries: 3,          // an element may hold at most three lines
  // The clean-up transfer, in the book's own terms: every element carried across gets a
  // single entry, EXCEPT ones that held three, which get two. So 1 -> 1, 2 -> 1, 3 -> 2.
  cleanupEntries: { 1: 1, 2: 1, 3: 2 },
  kinds: [
    { key: "threads", label: "Threads", singular: "thread",
      text: "The goals, missions and questions the characters are pursuing. Mythic never invents a new thread for you - your character decides what matters.",
      placeholder: "Find out who is paying the diggers" },
    { key: "characters", label: "Characters", singular: "character",
      text: "The people who matter - and anything else that should be able to walk into a scene: a place, an object, a recurring event.",
      placeholder: "General Gorazon · the seized mine · a raid on the road" }
  ],
  weighting: "An element that played a prominent part in the scene earns another line, to a maximum of three. More lines mean more chance of being picked, which is the whole point of the weighting.",
  cleanup: "When the twenty-five lines are full, carry the live elements to a fresh sheet with one entry each - except anything that held three lines, which comes across with two. That resets the lists while keeping the most prominent elements weighted."
};

// T28 — the Chaos Factor variants. GME2e, quoted.
// Mid-Chaos is NOT here: the rule as supplied is expressed as Fate CHECK modifiers
// (CF 9 = +2, 7-8 = +1, 4-6 = 0, 2-3 = -1, CF 1 = -2), and this app asks on the Fate
// CHART. Applying those numbers to the chart would be inventing a conversion, so it is
// listed in NOT_SUPPLIED instead (ruling A32).
export const CHAOS_MODES = [
  { key: "standard", label: "Standard", cite: "GME2e", default: true,
    text: "The Chaos Factor moves by whether the characters were in control, and the Fate Chart is read at it." },
  { key: "no-chaos", label: "No-Chaos", cite: "GME2e",
    text: "Answers come purely from the odds: the chart is read at its middle column and chaos never skews a question. The Chaos Factor is still tracked in the background, because scenes are still tested against it and random events still trigger.",
    readsChartAt: 5 },
  { key: "random-chaos", label: "Random Chaos", cite: "GME2e",
    text: "The pacing is taken out of your hands. At the end of a scene, roll a d10: equal to the Chaos Factor or under and it drops by one, over it and it rises by one - the same floor and ceiling.",
    rollsAtSceneEnd: true }
];

// T29 — the Thread Progress Track. GME2e, quoted.
export const PROGRESS_TRACK = {
  cite: "GME2e",
  lengths: [10, 15, 20],
  awards: [
    { key: "progress", label: "Progress in a scene", points: 2,
      text: "Making any progress toward resolving the focus thread in a scene awards 2 points." },
    { key: "flashpoint", label: "Flashpoint", points: 2,
      text: "A dramatic, important event directly involving the focus thread. Also 2 points." }
  ],
  plotArmor: "Until the track is full the focus thread carries plot armour: it cannot be finally resolved, however close things look.",
  conclusion: "Reaching the end of the track is a flashpoint with the plot armour removed. Generate a random event with an automatic Event Focus of Current Context, read toward an event that can finally end this thread - now, or in the next scene if that sits better.",
  notSupplied: "The Discovery Check, which the book offers when progress stalls, is named but its procedure and its point values are not in what was supplied here - so the app does not roll it."
};

// T22 — the bookkeeping phase. GME2e, via summary.
export const BOOKKEEPING = {
  cite: "GME2e",
  provisional: false,   // confirmed by quotation
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
  "The Fate Check. The edition does have one - the Mid-Chaos rule is written in its modifiers - but its dice and its procedure were not supplied, so the app asks on the Fate Chart only.",
  "Mid-Chaos. Its modifiers are given for the Fate Check (+2 at chaos 9 down to -2 at chaos 1); converting those to Fate Chart columns would be inventing a rule, so the app does not offer it.",
  "The Discovery Check, which pushes a stalled Thread Progress Track along. Named, with example point values, but not its procedure."
];
