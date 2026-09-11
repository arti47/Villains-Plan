// Schemer — One-Page Mythic Game Master Emulator.
// Second source (Word Mill Games, one-page edition), cited as OPM. This is the Mythic
// core that "The Villain's Plan" leans on and does not contain: Ask The Game Master,
// Random Events and Discover Meaning. Numbers verbatim, prose paraphrased (§12).

export const MYTHIC_SOURCE = {
  title: "One-Page Mythic Game Master Emulator",
  publisher: "Word Mill Games",
  cite: "OPM"
};

// T10 — Ask The Game Master. Nine odds rows, four answer bands each. OPM.
// Ranges are verbatim; the harness asserts each row covers 1-100 without a gap.
export const ASK_ODDS = [
  { key: "certain", label: "Certain", exYes: [1, 18], yes: [19, 90], no: [91, 98], exNo: [99, 100] },
  { key: "nearly-certain", label: "Nearly Certain", exYes: [1, 17], yes: [18, 85], no: [86, 97], exNo: [98, 100] },
  { key: "very-likely", label: "Very Likely", exYes: [1, 15], yes: [16, 75], no: [76, 95], exNo: [96, 100] },
  { key: "likely", label: "Likely", exYes: [1, 13], yes: [14, 65], no: [66, 93], exNo: [94, 100] },
  { key: "50-50", label: "50/50 or Unknown", exYes: [1, 10], yes: [11, 50], no: [51, 90], exNo: [91, 100], default: true },
  { key: "unlikely", label: "Unlikely", exYes: [1, 7], yes: [8, 35], no: [36, 87], exNo: [88, 100] },
  { key: "very-unlikely", label: "Very Unlikely", exYes: [1, 5], yes: [6, 25], no: [26, 85], exNo: [86, 100] },
  { key: "nearly-impossible", label: "Nearly Impossible", exYes: [1, 3], yes: [4, 15], no: [16, 83], exNo: [84, 100] },
  { key: "impossible", label: "Impossible", exYes: [1, 2], yes: [3, 10], no: [11, 82], exNo: [83, 100] }
];

// The four answers, and what each one asks of you. OPM.
export const ASK_ANSWERS = [
  { key: "exceptional-yes", label: "Exceptional Yes", yes: true, exceptional: true,
    text: "Yes, and more besides - go past what you were expecting." },
  { key: "yes", label: "Yes", yes: true, exceptional: false,
    text: "Yes. Follow the expectation you had when you asked." },
  { key: "no", label: "No", yes: false, exceptional: false,
    text: "No. Follow your expectations; if you cannot see how a No plays out here, Discover Meaning for an answer." },
  { key: "exceptional-no", label: "Exceptional No", yes: false, exceptional: true,
    text: "No, and further than that - past what you were expecting." }
];

export const ASK_PROCEDURE = {
  cite: "OPM",
  steps: [
    { title: "Form a question", text: "Ask something with a Yes or No answer, and know what you expect the answer to be." },
    { title: "Assign odds", text: "50/50 if the odds are even or you have no idea. Likely, Very Likely, Nearly Certain or Certain when they are good; Unlikely, Very Unlikely, Nearly Impossible or Impossible when they are bad." },
    { title: "Roll and read the chart", text: "One d100, read against the row for those odds." },
    { title: "Interpret", text: "Take the answer back into the fiction. Follow your expectations, or go beyond them on an Exceptional result." }
  ]
};

// T11 — Random Events. A double-digit roll on an Ask fires one. OPM.
export const RANDOM_EVENT = {
  cite: "OPM",
  doubles: [11, 22, 33, 44, 55, 66, 77, 88, 99],
  text: "A double-digit result on an Ask The Game Master roll - 11, 22, 33 and so on - also generates a Random Event. Discover Meaning for what happens, then read it as an event in the situation you are already in.",
  note: "The answer to your question still stands. The event happens as well as the answer, not instead of it."
};

// T12 — Discover Meaning. Fifty rows, two columns, rolled 1d100. OPM.
// Action words describe what active elements of the adventure do; Description words
// describe things. Index i holds the row for rolls (i*2)+1 and (i*2)+2.
export const DISCOVER_MEANING = {
  cite: "OPM",
  columns: [
    { key: "action", label: "Action", use: "What an active part of the adventure does." },
    { key: "description", label: "Description", use: "What something is like." }
  ],
  rows: [
    ["Attain", "Artificial"], ["Benefit", "Beautiful"], ["Betray", "Bleak"], ["Break", "Bright"],
    ["Burden", "Clean"], ["Change", "Cold"], ["Character", "Colorful"], ["Communicate", "Damaged"],
    ["Competition", "Dangerous"], ["Conclude", "Dark"], ["Conflict", "Dirty"], ["Control", "Disagreeable"],
    ["Create", "Empty"], ["Danger", "Extravagant"], ["Deceit", "Feeble"], ["Decrease", "Fragrant"],
    ["Delay", "Frightening"], ["Distant", "Full"], ["Emotions", "Healthy"], ["Enemies", "Heavy"],
    ["Environment", "Helpful"], ["Expectations", "Important"], ["Failure", "Incomplete"], ["Fears", "Lacking"],
    ["Fight", "Large"], ["Gain", "Light"], ["Goals", "Loud"], ["Good", "Mechanical"],
    ["Harm", "Modern"], ["Help", "Mundane"], ["Increase", "Mysterious"], ["Information", "Natural"],
    ["Leave", "New"], ["Move", "Official"], ["Mundane", "Old"], ["Nature", "Peaceful"],
    ["Negative", "Perfect"], ["NPC", "Powerful"], ["Object", "Quiet"], ["Obstacle", "Reassuring"],
    ["Official", "Rotten"], ["PC", "Rough"], ["Positive", "Ruined"], ["Progress", "Rustic"],
    ["Setback", "Simple"], ["Start", "Small"], ["Stop", "Strange"], ["Strange", "Stylish"],
    ["Surprise", "Valuable"], ["Uncertain", "Warm"]
  ]
};

export const MYTHIC_GUIDANCE = {
  odds: {
    title: "Picking odds honestly",
    cite: "OPM",
    text: "The odds are your read of the situation before the dice land. If you genuinely do not know, that is what 50/50 is for - reaching for Very Likely because you want a Yes is how an oracle stops being one."
  },
  expectations: {
    title: "Have an expectation first",
    cite: "OPM",
    text: "Know what you think will happen before you roll. A Yes follows that expectation and an Exceptional Yes goes past it, so without one the answer has nothing to land on."
  },
  moreWords: {
    title: "Keep rolling until it comes clear",
    cite: "OPM",
    text: "One word is often enough. When it is not, roll another and read them together - the rules say to keep going until an interpretation comes clear, so there is no limit here and nothing rolls a second word on your behalf."
  },
  event: {
    title: "The event happens as well as the answer",
    cite: "OPM",
    text: "A double does not overturn what you asked. Take the answer, then read the event into the same moment."
  },
  noMeaning: {
    title: "A No you cannot read",
    cite: "OPM",
    text: "When a No does not obviously play out, the rules send you to Discover Meaning rather than to a re-roll."
  }
};

// What One-Page Mythic left out, and where each of those things ended up.
//
// This list is EMPTY, and that is the point: every item it once held - the Fate Chart, the
// Event Focus table, the Scene Adjustment Table's ranges, the Thread Progress Track and
// the chaos variants - has since been supplied and built. It stayed stale through four
// sources because the unit test only ever read NOT_SUPPLIED (docs/AUDIT.md F45), so the
// Rules screen went on telling the reader that five shipped subsystems were missing.
//
// What is genuinely unsupplied now lives in NOT_SUPPLIED in data-scenes.js, which is the
// one list to add to. If something goes here again, test it here too.
export const STILL_NOT_IN_SOURCE = [];
