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
  note: "This subsystem arrived as a written summary and shipped marked provisional. The scene test was then confirmed against a photograph, and the Chaos Factor, list and bookkeeping rules against direct quotations from the book - which corrected the clean-up rule in the process. How a random event picks an entry from a list has since been quoted too, so nothing here rests on the summary any more."
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
// Mid-Chaos works on the Fate CHECK, where its modifiers are quoted. The book also has a
// Mid-Chaos Fate CHART, but its cells were not supplied - only that its columns read
// 1, 2-3, 4-6, 7-8, 9 - so the app does not offer Mid-Chaos on the chart (ruling A32).
export const CHAOS_MODES = [
  { key: "standard", label: "Standard", cite: "GME2e", default: true,
    text: "The Chaos Factor moves by whether the characters were in control, and the Fate Chart is read at it." },
  { key: "low-chaos", label: "Low-Chaos", cite: "GME2e", chart: "low-chaos",
    text: "Chaos barely leans on a question at all: its nine values collapse into three bands, so the pull runs +1 down to -1. A quieter story where the odds you set are nearly the whole answer." },
  { key: "mid-chaos", label: "Mid-Chaos", cite: "GME2e", chart: "mid-chaos",
    text: "The extremes are trimmed: the nine Chaos Factors collapse into five bands, so chaos pulls a question by +2 down to -2 instead of +5 down to -5." },
  { key: "no-chaos", label: "No-Chaos", cite: "GME2e", chart: "no-chaos",
    text: "Answers come purely from the odds: the chart has one column and chaos never skews a question. The Chaos Factor is still tracked in the background, because scenes are still tested against it and random events still trigger." },
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
  focusThread: "Copy a thread you want to focus on. It is a copy, not a move: the thread stays on the Threads List and random events can still call on it.",
  // The track is phases of 5 points each, and each phase asks whether a flashpoint
  // happened in it. If one has not by the time you cross out of the phase, the track
  // makes one happen.
  phaseSize: 5,
  phaseFlashpoint: {
    text: "If a flashpoint has not happened by the end of a phase, the track triggers one: a random event with an automatic Event Focus of Current Context, involving the focus thread dramatically but without resolving it.",
    timing: "Cross the threshold while playing a scene and the flashpoint happens right then. Cross it during end-of-scene bookkeeping and it happens at the start of the next scene - you still generate and test that scene as normal, but it carries the flashpoint.",
    both: "A moment can be both progress and a flashpoint; call it whichever you like, because either is 2 points. Calling it a flashpoint means the phase has had one, so the track will not trigger another."
  },
  plotArmor: "Until the track is full the focus thread carries plot armour: it cannot be finally resolved, however close things look. Plot armour also covers a random event whose focus is Close A Thread - play the event out, but the thread does not actually close.",
  plotArmorClosesThread: "Close A Thread",
  conclusion: "Reaching the end of the track is a flashpoint with the plot armour removed. Generate a random event with an automatic Event Focus of Current Context, read toward an event that can finally end this thread.",
  conclusionDelay: "If the conclusion can happen in the scene that triggered it, have it happen right then. If it cannot, delay it to the next scene: imagine that scene as usual, with the conclusion in it, and do NOT test it against the Chaos Factor - the track guarantees it begins as you imagine it.",
  discovery: {
    cite: "GME2e",
    when: "Make one when forward momentum has stalled and you are out of ideas for how to proceed - and your character has to do something that presents an opportunity for a discovery.",
    gate: "Ask the Game Master \"Is something discovered?\" at odds of no less than 50/50. What the answer buys you is on the Discovery Fate Question table.",
    minimumOdds: "50-50",
    // The Discovery Fate Question table: what each of the four answers does. An
    // Exceptional No is the only one with a lasting effect - it shuts Discovery down
    // for the rest of the scene.
    answers: [
      { key: "exceptional-yes", rolls: 2, label: "Exceptional Yes",
        text: "Roll twice on the Thread Discovery Check table and combine the results." },
      { key: "yes", rolls: 1, label: "Yes",
        text: "Roll once on the Thread Discovery Check table." },
      { key: "no", rolls: 0, label: "No",
        text: "Nothing useful is found. There is no roll on the table." },
      { key: "exceptional-no", rolls: 0, closesScene: true, label: "Exceptional No",
        text: "Nothing useful is found, there is no roll, and you cannot make another Discovery Check for the rest of this scene. Your character has hit a dead end and must search again in another scene." }
    ],
    die: 10,
    addProgress: true,
    rows: [
      { min: -Infinity, max: 9, key: "progress-2", label: "Progress +2", award: { kind: "progress", points: 2 },
        text: "You discover something that moves you closer to the focus thread." },
      { min: 10, max: 10, key: "flashpoint-2", label: "Flashpoint +2", award: { kind: "flashpoint", points: 2 },
        text: "You discover something that involves the focus thread in an important and dramatic way." },
      { min: 11, max: 14, key: "track-1", label: "Track +1", award: { kind: "track", points: 1 },
        text: "You discover nothing useful, but the act of trying moves you 1 point along the track." },
      { min: 15, max: 17, key: "progress-3", label: "Progress +3", award: { kind: "progress", points: 3 },
        text: "You discover something that moves you closer to the focus thread." },
      { min: 18, max: 18, key: "flashpoint-3", label: "Flashpoint +3", award: { kind: "flashpoint", points: 3 },
        text: "You discover something that involves the focus thread in an important and dramatic way." },
      { min: 19, max: 19, key: "track-2", label: "Track +2", award: { kind: "track", points: 2 },
        text: "You discover nothing useful, but the act of trying moves you 2 points along the track." },
      { min: 20, max: 24, key: "strengthen-1", label: "Strengthen Progress +1", award: { kind: "strengthen", points: 1 },
        text: "Progress already made is reinforced, for 1 point. Read it as a discovery that ties back into an earlier one." },
      { min: 25, max: Infinity, key: "strengthen-2", label: "Strengthen Progress +2", award: { kind: "strengthen", points: 2 },
        text: "Progress already made is reinforced, for 2 points. Read it as a discovery that ties back into an earlier one." }
    ],
    // A roll here IS a random event, with this table standing in for the Event Focus
    // table; the meaning words are rolled the same way and read the same way.
    asRandomEvent: "A successful Discovery Check is a random event that uses this table instead of the Event Focus table. It tells you what to hone in on and what the track gains; roll on a meaning table as usual to read what it actually was.",
    allDefined: "All eight results award points - 2, 2, 1, 3, 3, 2, 1, 2 reading down. Track means you found nothing useful but the act of trying moved you along; Strengthen Progress means earlier progress was reinforced, tied back to a discovery you already made."
  }
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
// Nothing. Every rule this app automates is read from a page or a direct quotation.
//
// This list has been wrong in the other direction before (docs/AUDIT.md F45), so: if a
// rule arrives that the app cannot build, add it HERE, and add an assertion for it in the
// same change. An empty list is a claim, and the suite checks it.
export const NOT_SUPPLIED = [];
