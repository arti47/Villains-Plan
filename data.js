// Schemer — rules data.
// Every value here comes from "The Villain's Plan", Mythic Magazine Vol. 69, pp. 16-28,
// extracted in docs/villains-plan.md. Citations read MM69:p<page>.
// Prose is paraphrased, never reproduced (CLAUDE.md §12).

export const SOURCE = {
  title: "The Villain's Plan",
  publication: "Mythic Magazine",
  volume: 69,
  pages: "16-28",
  cite: "MM69"
};

// T5 — the End Goal Roll. MM69:p22.
export const END_GOAL_ROLL = {
  die: 10,
  perPhase: 2,          // +2 for each phase already discovered
  threshold: 11,        // total >= 11 reveals the End Goal
  cite: "MM69:p22"
};

// T1 — Villain Plan Focus (d100). MM69:p21.
export const VILLAIN_PLAN_FOCUS = {
  id: "villain-plan-focus",
  name: "Villain Plan Focus",
  question: "What is this phase of the plan about?",
  cite: "MM69:p21",
  rows: [
    { min: 1, max: 16, key: "on-the-march", label: "On the March",
      text: "The villain, or their henchmen and armies, are mobilising for what looks like an ambitious offensive." },
    { min: 17, max: 24, key: "relocating", label: "Relocating",
      text: "The villain is leaving the place or position they normally occupy for somewhere else, for some reason." },
    { min: 25, max: 40, key: "searching", label: "Searching",
      text: "The villain is hunting for something or someone, and is going to great lengths to find it." },
    { min: 41, max: 52, key: "gathering-resources", label: "Gathering Resources",
      text: "The villain is collecting resources - weapons, allies, equipment - massing strength for something big." },
    { min: 53, max: 60, key: "teamwork", label: "Teamwork",
      text: "The villain is courting or working with someone toward a shared goal: a peer, an enemy, or a specialist." },
    { min: 61, max: 72, key: "collecting", label: "Collecting",
      text: "The villain is gathering specific objects or people that do not obviously belong together, and hold no obvious value to them, so they must matter to the plan." },
    { min: 73, max: 80, key: "construction", label: "Construction",
      text: "The villain is building something - a structure, an excavation, a vehicle - for an unknown reason." },
    { min: 81, max: 100, key: "no-context", label: "No Context", noContext: true,
      text: "No extra context applies. Read the phase from the two keywords alone." }
  ]
};

// T2 — End Goal Focus (d100). MM69:p22.
export const END_GOAL_FOCUS = {
  id: "end-goal-focus",
  name: "End Goal Focus",
  question: "What is the plan actually for?",
  cite: "MM69:p22",
  rows: [
    { min: 1, max: 18, key: "acquisition", label: "Acquisition",
      text: "An ambitious grab: conquer a nation, take control of a corporation, own the thing outright." },
    { min: 19, max: 36, key: "personal", label: "Personal",
      text: "Something deeply personal drives it: revenge, raising a loved one from the dead, righting an old wrong." },
    { min: 37, max: 50, key: "advancement", label: "Advancement",
      text: "The villain means to elevate themself: sole heir to the throne, ascension to godhood, raw power increased." },
    { min: 51, max: 61, key: "destruction", label: "Destruction",
      text: "Destruction for its own sake - a world, an installation, an organisation - and the villain has a reason why it must be so." },
    { min: 62, max: 72, key: "new-order", label: "A New Order",
      text: "The villain sees a broken world and intends to fix it monstrously: end crime by watching every thought, end a war by erasing a country." },
    { min: 73, max: 76, key: "villain-behind", label: "Villain Behind the Villain",
      text: "This villain is only the public face. Someone else is running them - work out who, and why." },
    { min: 77, max: 83, key: "survival", label: "Survival",
      text: "The villain is under threat and the scheme is meant to save them, possibly at monstrous cost to everyone else." },
    { min: 84, max: 100, key: "no-context", label: "No Context", noContext: true,
      text: "No extra context applies. Read the End Goal from the two keywords alone." }
  ]
};

// T3 — Pivot Plan Focus (d100). MM69:p25.
export const PIVOT_PLAN_FOCUS = {
  id: "pivot-plan-focus",
  name: "Pivot Plan Focus",
  question: "With the plan in ruins, what does the villain do?",
  cite: "MM69:p25",
  rows: [
    { min: 1, max: 40, key: "what-they-can", label: "They Do What They Can",
      text: "The villain proceeds with a much diminished version of the original plan - sacking one town instead of conquering the nation." },
    { min: 41, max: 65, key: "no-one-can", label: "If I Can't Have It, No One Can",
      text: "They ruin it for everybody: having failed to steal the thing, they set about destroying it." },
    { min: 66, max: 95, key: "revenge", label: "Revenge",
      text: "Petty revenge - striking at whoever stopped them, or causing harm that gains them nothing at all." },
    { min: 96, max: 100, key: "surprise-move", label: "Surprise Move", noContext: true,
      text: "Something unexpected, possibly an entirely different goal. Read it from the two keywords." }
  ]
};

export const FOCUS_TABLES = [VILLAIN_PLAN_FOCUS, END_GOAL_FOCUS, PIVOT_PLAN_FOCUS];

// T4 — Plot Twists keywords (d100), rolled in pairs. MM69:p21.
// Index i holds the entry for a roll of i+1.
export const PLOT_TWISTS = {
  id: "plot-twists",
  name: "Plot Twists",
  question: "Two keywords to interpret.",
  cite: "MM69:p21",
  words: [
    "Action", "Attack", "Bad", "Barrier", "Betray", "Business", "Change", "Character",
    "Conclude", "Conditional", "Conflict", "Connection", "Consequence", "Control", "Danger",
    "Death", "Delay", "Destroy", "Diminish", "Disaster", "Discover", "Emotion", "Enemy",
    "Enhance", "Enter", "Escape", "Evidence", "Failure", "Family", "Free", "Friend", "Good",
    "Group", "Harm", "Headquarters", "Help", "Helpless", "Hidden", "Idea", "Immediate",
    "Impending", "Important", "Incapacitate", "Information", "Injustice", "Leader", "Legal",
    "Lethal", "Lie", "Limit", "Location", "Lucky", "Mental", "Missing", "Mundane", "Mystery",
    "Necessary", "News", "Object", "Oppose", "Outcast", "Overcome", "Past", "Peace",
    "Personal", "Persuade", "Physical", "Plan", "Power", "Prepare", "Problem", "Promise",
    "Protect", "Public", "Pursue", "Rare", "Remote", "Repair", "Repeat", "Require", "Rescue",
    "Resource", "Response", "Reveal", "Revenge", "Reversal", "Reward", "Skill", "Social",
    "Solution", "Strange", "Success", "Tension", "Trap", "Travel", "Unknown", "Unlikely",
    "Unusual", "Urgent", "Useful"
  ]
};

// The pivot gate. MM69:p26 - a pivot is possible when the villain survives the defeat of
// the main plan, important underlings are still at large, or a failsafe was set in advance.
export const PIVOT_GATE = {
  cite: "MM69:p26",
  conditions: [
    { key: "survived", label: "The villain survived the defeat of the plan" },
    { key: "underlings", label: "Important underlings are still at large" },
    { key: "failsafe", label: "A backup plan was set in advance, to launch on defeat" }
  ],
  refusal: "A Pivot Plan needs someone left to enact it. Tick at least one of the three conditions the rules allow, or let the adventure end here."
};

// The arcs the subsystem defines. MM69:p25.
export const ARC_STAGES = [
  { key: "discovery", label: "Discovery",
    blurb: "Earn reveals and piece the plan together, one phase at a time, until the End Goal surfaces.",
    next: "foiling", nextLabel: "End Goal revealed", cite: "MM69:p25" },
  { key: "foiling", label: "Foiling",
    blurb: "The plan is known. Now work to spoil it - a scene, or a span of scenes as long as the Discovery arc was.",
    next: "pivot", nextLabel: "The plan is defeated", cite: "MM69:p25" },
  { key: "pivot", label: "Pivot",
    blurb: "The plan is in ruins. If the villain can still act, they get a Plan B - and it should be short: a scene or three.",
    next: "concluded", nextLabel: "Conclude the adventure", cite: "MM69:p25" },
  { key: "concluded", label: "Concluded",
    blurb: "The adventure is over. It stays here as a record.",
    next: null, nextLabel: null, cite: "MM69:p25" }
];

// T6 — procedure and guidance text the app surfaces. All paraphrased.
export const GUIDANCE = {
  earned: {
    title: "Reveals are earned, not rolled",
    cite: "MM69:p18",
    text: "Discovery is your call, not the dice's. When your character has done enough - survived the ambush, followed the lead, walked into the room where people talk - you grant the reveal. The rules deliberately keep this away from a Fate Question: you already decided the mystery was the point of the adventure, so let the momentum carry it."
  },
  interpret: {
    title: "Focus plus two keywords",
    cite: "MM69:p19",
    text: "Roll the Focus for context, roll two keywords, then read all of it against what you already know. The dice give you the raw material; the adventure you are already in decides what it means."
  },
  partial: {
    title: "A phase explains something and asks something",
    cite: "MM69:p20",
    text: "You are uncovering a portion of the plan, never the whole of it. Interpret so that something becomes clear and something new becomes puzzling - that new question is where your character goes next."
  },
  leads: {
    title: "Every phase leaves a lead",
    cite: "MM69:p20",
    text: "A seized mine, a hired sword, an unnamed enemy. Write the leads down as you find them: they are the next scenes."
  },
  coherence: {
    title: "The End Goal has to explain the rest",
    cite: "MM69:p24",
    text: "Whatever the End Goal turns out to be, it should not only name the last piece - it should pull every earlier phase together so the whole thing makes sense. If it does not, revise the earlier phases until it does. That is allowed and expected."
  },
  doubles: {
    title: "Two of the same keyword",
    cite: "MM69:p21",
    text: "Plot Twists is a meaning table, so a doubled keyword is amplification, not a misfire. Read it as that word, harder."
  },
  noContext: {
    title: "No Context",
    cite: "MM69:p21",
    text: "A real result, not a re-roll. The table is declining to steer you; read the phase from the two keywords alone."
  },
  pivotTiming: {
    title: "Reveal the pivot immediately",
    cite: "MM69:p26",
    text: "Put the Plan B in the scene right after the main plan falls - the celebration, the debrief, the loose ends. Delaying it makes the adventure feel padded, because you already know it is coming."
  },
  pivotLength: {
    title: "Keep the pivot short",
    cite: "MM69:p25",
    text: "A desperate measure, a grab at a partial win, or plain revenge. One to three scenes. It is a coda, not a second adventure."
  }
};

// Mythic core the subsystem leans on but this source does not contain. The app records
// these and never rolls them (CLAUDE.md ruling A7).
export const NOT_IN_SOURCE = {
  fateQuestion: {
    label: "Fate Question",
    text: "The surprise route to a pivot asks a Fate Question, whose odds live in Mythic's core rules - not in this article. Resolve it with your own Mythic tools and record the answer here.",
    cite: "MM69:p26"
  },
  items: [
    "Fate Questions, the Fate Chart and Fate Check odds",
    "Chaos Factor",
    "Scene setup: Expected, Altered and Interrupt scenes",
    "The Bookkeeping phase",
    "Discover Meaning (Action and Descriptor tables)",
    "Random Events",
    "Threads and Characters lists",
    "The Villain Crafter (Mythic Magazine #41)"
  ]
};

export const FATE_ANSWERS = [
  { key: "exceptional-yes", label: "Exceptional Yes", pivot: true },
  { key: "yes", label: "Yes", pivot: true },
  { key: "no", label: "No", pivot: false },
  { key: "exceptional-no", label: "Exceptional No", pivot: false }
];

export const LOG_CAP = 200;
