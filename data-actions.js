// Schemer — Meaning Tables: Actions, Mythic Game Master Emulator Second Edition.
// Cited GME2e. Transcribed from a photograph of the page.
//
// Two d100 columns rolled together: an action and what it acts on. This is the table
// "The Villain Crafter" means by "roll on Mythic's Action Meaning Tables", and the one a
// random event's meaning is read from.

export const ACTION_TABLES = [
  {
    id: "action-1", label: "Action 1", cite: "GME2e",
    use: "What happens.",
    words: ["Abandon", "Accompany", "Activate", "Agree", "Ambush", "Arrive", "Assist", "Attack", "Attain", "Bargain", "Befriend", "Bestow", "Betray", "Block", "Break", "Carry", "Celebrate", "Change", "Close", "Combine", "Communicate", "Conceal", "Continue", "Control", "Create", "Deceive", "Decrease", "Defend", "Delay", "Deny", "Depart", "Deposit", "Destroy", "Dispute", "Disrupt", "Distrust", "Divide", "Drop", "Easy", "Energize", "Escape", "Expose", "Fail", "Fight", "Flee", "Free", "Guide", "Harm", "Heal", "Hinder", "Imitate", "Imprison", "Increase", "Indulge", "Inform", "Inquire", "Inspect", "Invade", "Leave", "Lure", "Misuse", "Move", "Neglect", "Observe", "Open", "Oppose", "Overthrow", "Praise", "Proceed", "Protect", "Punish", "Pursue", "Recruit", "Refuse", "Release", "Relinquish", "Repair", "Repulse", "Return", "Reward", "Ruin", "Separate", "Start", "Stop", "Strange", "Struggle", "Succeed", "Support", "Suppress", "Take", "Threaten", "Transform", "Trap", "Travel", "Triumph", "Truce", "Trust", "Use", "Usurp", "Waste"]
  },
  {
    id: "action-2", label: "Action 2", cite: "GME2e",
    use: "What it happens to, or about.",
    words: ["Advantage", "Adversity", "Agreement", "Animal", "Attention", "Balance", "Battle", "Benefits", "Building", "Burden", "Bureaucracy", "Business", "Chaos", "Comfort", "Completion", "Conflict", "Cooperation", "Danger", "Defense", "Depletion", "Disadvantage", "Distraction", "Elements", "Emotion", "Enemy", "Energy", "Environment", "Expectation", "Exterior", "Extravagance", "Failure", "Fame", "Fear", "Freedom", "Friend", "Goal", "Group", "Health", "Hindrance", "Home", "Hope", "Idea", "Illness", "Illusion", "Individual", "Information", "Innocent", "Intellect", "Interior", "Investment", "Leadership", "Legal", "Location", "Military", "Misfortune", "Mundane", "Nature", "Needs", "News", "Normal", "Object", "Obscurity", "Official", "Opposition", "Outside", "Pain", "Path", "Peace", "People", "Personal", "Physical", "Plot", "Portal", "Possessions", "Poverty", "Power", "Prison", "Project", "Protection", "Reassurance", "Representative", "Riches", "Safety", "Strength", "Success", "Suffering", "Surprise", "Tactic", "Technology", "Tension", "Time", "Trial", "Value", "Vehicle", "Victory", "Vulnerability", "Weapon", "Weather", "Work", "Wound"]
  }
];

// T25 — Random Event Focus (d100). GME2e, from a photograph.
export const EVENT_FOCUS = {
  id: "event-focus",
  name: "Random Event Focus",
  cite: "GME2e",
  // `list` says which list the focus points at, when it points at one.
  rows: [
    { min: 1, max: 5, key: "remote-event", label: "Remote Event",
      reason: "Your character is expecting word from elsewhere, and now is a good moment for it to arrive." },
    { min: 6, max: 10, key: "ambiguous-event", label: "Ambiguous Event",
      reason: "The adventure has slowed and you want a mystery to chase." },
    { min: 11, max: 20, key: "new-npc", label: "New NPC", list: "characters",
      reason: "There is a sensible reason for someone new to walk in right now." },
    { min: 21, max: 40, key: "npc-action", label: "NPC Action", list: "characters",
      reason: "Your character is waiting on what other people do." },
    { min: 41, max: 45, key: "npc-negative", label: "NPC Negative", list: "characters",
      reason: "You want the adventure to turn on an NPC for a while - and new storylines to come of it." },
    { min: 46, max: 50, key: "npc-positive", label: "NPC Positive", list: "characters",
      reason: "You want the adventure to turn on an NPC for a while - and new storylines to come of it." },
    { min: 51, max: 55, key: "move-toward-thread", label: "Move Toward A Thread", list: "threads",
      reason: "The adventure has stalled and needs a push - especially useful in an Interrupt Scene." },
    { min: 56, max: 65, key: "move-away-thread", label: "Move Away From A Thread", list: "threads",
      reason: "You want a new problem for your character to face." },
    { min: 66, max: 70, key: "close-thread", label: "Close A Thread", list: "threads",
      reason: "Things have got complicated and you want to thin the Threads list out." },
    { min: 71, max: 80, key: "pc-negative", label: "PC Negative",
      reason: "You want a new problem for your character to face." },
    { min: 81, max: 85, key: "pc-positive", label: "PC Positive",
      reason: "Your character is having a hard time and could use a break." },
    { min: 86, max: 100, key: "current-context", label: "Current Context",
      reason: "The event can explain a Fate Question result, or cut across what is happening now." }
  ]
};

// T26 — the Scene Adjustment Table (1d10). GME2e, from a photograph.
export const SCENE_ADJUSTMENT_TABLE = {
  id: "scene-adjustment",
  name: "Scene Adjustment Table",
  cite: "GME2e",
  die: 10,
  rows: [
    { min: 1, max: 1, key: "remove-character", label: "Remove A Character", text: "Someone you expected to be here is not." },
    { min: 2, max: 2, key: "add-character", label: "Add A Character", text: "Someone is here who you did not expect." },
    { min: 3, max: 3, key: "reduce-activity", label: "Reduce or Remove An Activity", text: "Less is going on than you pictured, or something has stopped." },
    { min: 4, max: 4, key: "increase-activity", label: "Increase An Activity", text: "More is going on than you pictured." },
    { min: 5, max: 5, key: "remove-object", label: "Remove An Object", text: "Something you expected to be here is missing." },
    { min: 6, max: 6, key: "add-object", label: "Add An Object", text: "Something is here that you did not expect." },
    { min: 7, max: 10, key: "two-adjustments", label: "Make 2 Adjustments", special: "double",
      text: "Roll twice more and apply both." }
  ]
};

/**
 * T27 — picking an entry from a Threads or Characters list. GME2e, supplied as a written
 * The procedure is now quoted from the book ("Lists As Random Tables"), so it is no
 * longer provisional. One detail still is not quoted: how the section die's faces map
 * onto the sections. The printed Adventure Lists sheet settles it - see `inferred`.
 *
 * Sections go active as lines fill, top to bottom. Roll for the section with a die sized
 * to the active sections, then 1d10 for the line within it. A blank line is a "Choose"
 * result: take whichever entry fits, or roll again.
 */
export const LIST_SELECTION = {
  cite: "GME2e",
  provisional: false,
  provenance: "quotation",
  sectionDice: [
    { sections: 1, die: null, note: "Up to 5 elements: only the first section is active, so there is nothing to roll for." },
    { sections: 2, die: 4 },
    { sections: 3, die: 6 },
    { sections: 4, die: 8 },
    { sections: 5, die: 10 }
  ],
  lineDie: 10,
  // 1d10 to a line within the five-line section
  lineBands: [
    { min: 1, max: 2, line: 1 }, { min: 3, max: 4, line: 2 }, { min: 5, max: 6, line: 3 },
    { min: 7, max: 8, line: 4 }, { min: 9, max: 10, line: 5 }
  ],
  chooseText: "The line is blank. Take whichever entry on the list fits what is happening, or roll again until you land on a filled line.",
  inferred: "No quoted rule maps the section die's faces onto the sections, but the printed Adventure Lists sheet settles it: its left margin reads 1-2 beside the first section, 3-4 beside the second, then 5-6, 7-8 and 9-10. The app pairs them that way."
};
