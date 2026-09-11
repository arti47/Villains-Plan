// Schemer — The Villain Crafter, Mythic Magazine Vol. 41, pp. 3-16. Cited MM41:p<page>.
// The article "The Villain's Plan" names this as where the villain itself comes from.
// Numbers verbatim, every description rewritten (§12).
//
// Provenance: the Minion column's merged cells were unreadable in the first
// transcription (42-44, 68-69, 75-76) and shipped marked `unrecovered` rather than
// guessed at. Page photographs of MM41:p14-15 then closed the gap: the Soldier cell is
// merged across 40-44 and the On A Mission cell across 68-76. All 23 bands are now read
// from the page (ruling A19, §2.1 - ask for the page, never reconstruct one).

export const CRAFTER_SOURCE = {
  title: "The Villain Crafter",
  publication: "Mythic Magazine",
  volume: 41,
  pages: "3-16",
  cite: "MM41"
};

// Special results that are procedures rather than archetypes.
export const SPECIAL = { meaning: "meaning-table", double: "double", upscale: "upscale" };

// T14 — Villain Archetype (d100, rolled with no modifier: the modifiers come from it).
// MM41:p6-7. mods are carried to the Organization (o), Lieutenant (l) and Minion (m) rolls.
export const VILLAIN_ARCHETYPES = {
  id: "villain-archetype",
  name: "Villain Archetype",
  cite: "MM41:p6-7",
  rows: [
    { min: 1, max: 6, key: "revenge", label: "Bent On Revenge", mods: { o: 0, l: 0, m: 0 },
      text: "Everything they do is aimed at whoever or whatever wronged them." },
    { min: 7, max: 16, key: "master-of-domain", label: "Master Of Their Domain", mods: { o: 10, l: 10, m: 10 },
      text: "Their reach runs far past themselves - people, money, business, politics." },
    { min: 17, max: 20, key: "domination", label: "The Domination Game", mods: { o: 10, l: 5, m: 5 },
      text: "They want the lot: a company, a country, a world - whatever the scope of their world is." },
    { min: 21, max: 22, key: "serves-another", label: "Serves Another", mods: { o: 5, l: 5, m: 5 },
      text: "They answer to a greater master who stays off the page but darkens everything." },
    { min: 23, max: 24, key: "conquest", label: "Conquest", mods: { o: 5, l: 5, m: 10 },
      text: "A conqueror in the military sense: the goal is taken by force." },
    { min: 25, max: 32, key: "schemer", label: "Schemer", mods: { o: 0, l: 0, m: 5 },
      text: "Plans and stratagems rather than a frontal assault." },
    { min: 33, max: 34, key: "brute", label: "The Brute", mods: { o: -5, l: -5, m: 0 },
      text: "Force first. Subtlety is someone else's problem." },
    { min: 35, max: 36, key: "doing-their-job", label: "Doing Their Job", mods: { o: 5, l: 0, m: 0 },
      text: "Whatever this is, they consider it work. No passion, no personal stake." },
    { min: 37, max: 38, key: "killer", label: "Killer", mods: { o: -5, l: -5, m: -5 },
      text: "Killing is the point, or at least the method by which the point is reached." },
    { min: 39, max: 40, key: "money", label: "Money Motive", mods: { o: -5, l: -5, m: -5 },
      text: "It is for the money. Wealth is the whole of the drive." },
    { min: 41, max: 42, key: "inscrutable", label: "Inscrutable", mods: { o: 5, l: 0, m: 0 },
      text: "Their goals can be understood; their reasons cannot. Madness, or a mind that does not work like yours." },
    { min: 43, max: 44, key: "thrill", label: "The Thrill Of It All", mods: { o: -10, l: -5, m: -5 },
      text: "In it for the excitement and the challenge - they want to test what they can do." },
    { min: 45, max: 46, key: "one-of-the-people", label: "One Of The People", mods: { o: 0, l: 5, m: 5 },
      text: "An ordinary person who, for reasons of their own, started doing this." },
    { min: 47, max: 48, key: "class-act", label: "Class Act", mods: { o: 5, l: 10, m: 10 },
      text: "Cultured, sophisticated, and quietly certain they are a cut above." },
    { min: 49, max: 52, key: "higher-purpose", label: "Higher Purpose", mods: { o: 5, l: 5, m: 5 },
      text: "A zealot for a faith, a creed or a code, and the goals follow from upholding it." },
    { min: 53, max: 56, key: "personal-need", label: "Personal Need", mods: { o: -5, l: -5, m: -5 },
      text: "One need of their own drives all of it - love, obsession, something they must have." },
    { min: 57, max: 58, key: "no-choice", label: "Has No Choice", mods: { o: 10, l: 0, m: 5 },
      text: "No free will in the matter: programmed, compelled, or controlled by something else." },
    { min: 59, max: 60, key: "i-am-the-best", label: "I Am The Best", mods: { o: -10, l: -10, m: 0 },
      text: "They intend to prove they are the best by beating whoever currently holds that title." },
    { min: 61, max: 62, key: "making-a-point", label: "Making A Point", mods: { o: 0, l: 5, m: 5 },
      text: "The whole scheme is an argument: that everyone is wrong, that something is weaker than it looks." },
    { min: 63, max: 70, key: "power", label: "Power", mods: { o: 10, l: 5, m: 10 },
      text: "They want far more power, and will do whatever getting it takes." },
    { min: 71, max: 74, key: "duty-bound", label: "Duty Bound", mods: { o: -5, l: -5, m: 5 },
      text: "A duty demands this of them - laid on them by someone else, or taken up themselves." },
    { min: 75, max: 80, key: SPECIAL.meaning, label: "Meaning Table", mods: { o: 0, l: 0, m: 0 }, special: SPECIAL.meaning,
      text: "Roll on the Action meaning table and read an archetype out of the word." },
    { min: 81, max: 100, key: SPECIAL.double, label: "Double Archetypes", mods: { o: 0, l: 0, m: 0 }, special: SPECIAL.double,
      text: "Roll two archetypes and combine them, modifiers included. Roll this again and it is ignored and re-rolled." }
  ]
};

// T15 — Villain Organization (d100 + the archetype's o modifier). MM41:p10-11.
// The top and bottom bands are open-ended, which is what absorbs the modifiers.
export const VILLAIN_ORGANIZATIONS = {
  id: "villain-organization",
  name: "Villain Organization",
  cite: "MM41:p10-11",
  rows: [
    { min: -Infinity, max: 8, key: "none", label: "None", mods: { l: -10, m: -10 },
      text: "No organization, formal or otherwise - the villain and whoever happens to work with them." },
    { min: 9, max: 16, key: "gang", label: "Gang", mods: { l: -5, m: -10 },
      text: "Individuals banded together for the villain's ends and their own." },
    { min: 17, max: 22, key: "hired-hands", label: "Hired Hands", mods: { l: 0, m: -5 },
      text: "Most of them are there because they are paid to be. Nothing else holds it together." },
    { min: 23, max: 25, key: "followers", label: "Followers", mods: { l: -10, m: -5 },
      text: "Loose and informal, made of people who admire the villain and follow them." },
    { min: 26, max: 28, key: "family", label: "Family", mods: { l: -5, m: -10 },
      text: "The villain's family, or something that works exactly like one." },
    { min: 29, max: 31, key: "cult", label: "Cult", mods: { l: 0, m: 0 },
      text: "Followers, but formalised and devout: every member believes, and is there on purpose." },
    { min: 32, max: 40, key: "organized-crime", label: "Organized Crime", mods: { l: 5, m: 0 },
      text: "A coordinated effort to profit outside the law - like a company, but clandestine." },
    { min: 41, max: 43, key: "secret-society", label: "Secret Society", mods: { l: 10, m: 5 },
      text: "It operates unseen, behind everything, which takes real coordination to sustain." },
    { min: 44, max: 45, key: "army", label: "Army", mods: { l: 5, m: 5 },
      text: "Militarised and disciplined, built for destruction and suppression above all else." },
    { min: 46, max: 47, key: "professionals", label: "Professionals", mods: { l: 5, m: 10 },
      text: "The same shape as a firm or a syndicate, staffed by specialists in one expertise." },
    { min: 48, max: 53, key: "company", label: "The Company", mods: { l: 10, m: 10 },
      text: "It runs like a profitable business, except that the business is the villain's goals." },
    { min: 54, max: 56, key: "corrupted", label: "Corrupted Organization", mods: { l: 10, m: 5 },
      text: "Once legitimate - a firm, an agency, a government body - and since turned, probably by the villain." },
    { min: 57, max: 62, key: "syndicate", label: "Syndicate", mods: { l: 10, m: 5 },
      text: "Several organizations with one shared purpose; lieutenants may each head one of them." },
    { min: 63, max: 65, key: "sprawling", label: "Subversive & Sprawling", mods: { l: 10, m: 10 },
      text: "It is everywhere: operatives in any agency, legitimate-looking or not." },
    { min: 66, max: 68, key: "government", label: "Government", mods: { l: 10, m: 10 },
      text: "An actual government, which makes the villain its ruler or someone very near the top." },
    { min: 69, max: 74, key: SPECIAL.upscale, label: "Upscale", mods: { l: 5, m: 5 }, special: SPECIAL.upscale,
      text: "Roll again and scale the result up in size and scope, applying both sets of modifiers. Upscale or Double rolled again is re-rolled." },
    { min: 75, max: 80, key: SPECIAL.meaning, label: "Meaning Table", mods: { l: 0, m: 0 }, special: SPECIAL.meaning,
      text: "Roll on the Action meaning table and read an organization out of the word." },
    { min: 81, max: Infinity, key: SPECIAL.double, label: "Double Archetypes", mods: { l: 0, m: 0 }, special: SPECIAL.double,
      text: "Roll two and combine them, adding all modifiers together. Rolled again, it is ignored and re-rolled." }
  ]
};

// T16 — Villainous Lieutenants & Minions (d100 + the accumulated l or m modifier).
// MM41:p14-15. One table, two columns; many bands read the same for both.
// `unrecovered: true` marks a cell the supplied page did not yield (ruling A19).
export const UNDERLINGS = {
  id: "underlings",
  name: "Villainous Lieutenants & Minions",
  cite: "MM41:p14-15",
  kinds: [
    { key: "lieutenant", label: "Lieutenant",
      blurb: "A stand-in for the villain: real authority, much the same resources, and minions of their own. A serious fight." },
    { key: "minion", label: "Minion",
      blurb: "Low-level opposition carrying out instructions. An obstacle, not a wall." }
  ],
  rows: [
    { min: -Infinity, max: 20, key: "as-expected", label: "As Expected", shared: true,
      text: "Exactly what this villain and this organization would produce. Build them to fit the need in front of you." },
    { min: 21, max: 25, key: "hired-hand", label: "Hired Hand", shared: true,
      text: "They work for the villain because they are paid to. Mercenaries, not believers." },
    { min: 26, max: 27, key: "groveler", label: "Groveler", shared: true,
      text: "Defined by their subservience - the one who agrees with everything." },
    { min: 28, max: 29, key: "no-choice", label: "Has No Choice", shared: true,
      text: "No free will in it: built, bound or controlled into service." },
    { min: 30, max: 31, key: "anger-issues", label: "Anger Issues",
      text: "Defined by their anger, and glad of somewhere to put it.",
      minion: { key: "soldier", label: "Soldier", text: "A soldier, probably one of many, ready to fight for the villain." } },
    { min: 32, max: 33, key: "frenemy", label: "Frenemy", shared: true,
      text: "They cannot stand the villain, and serve them anyway - for some reason." },
    { min: 34, max: 36, key: "promise-made", label: "A Promise Made", shared: true,
      text: "They serve because something was promised: payment, a reward, something personal." },
    { min: 37, max: 39, key: "true-believer", label: "True Believer", shared: true,
      text: "They believe in the villain's mission, sincerely, and are here to serve it." },
    { min: 40, max: 41, key: "personal-reasons", label: "Personal Reasons",
      text: "An emotional reason binds them - a debt, a family history, something owed.",
      minion: { key: "soldier", label: "Soldier", text: "A soldier, probably one of many, ready to fight for the villain." } },
    { min: 42, max: 44, key: "tough-stuff", label: "Tough Stuff",
      text: "Intimidation and force are the whole approach.",
      minion: { key: "soldier", label: "Soldier", text: "A soldier, probably one of many, ready to fight for the villain." } },
    { min: 45, max: 49, key: "specialist", label: "Specialist", shared: true,
      text: "Extremely good at one thing, which is the thing they are here for." },
    { min: 50, max: 52, key: "a-little-different", label: "A Little Different",
      text: "Unusual in some flavourful way - a signature weapon, a way of dressing.",
      minion: { key: "soldier", label: "Soldier", text: "A soldier, probably one of many, ready to fight for the villain." } },
    { min: 53, max: 55, key: "fight-club", label: "Fight Club",
      text: "Whatever else they are for, what they want is to fight the player character.",
      minion: { key: "functional", label: "Functional", text: "A specific mundane job - medic, signals, quartermaster - that the organization needs doing." } },
    { min: 56, max: 58, key: "science", label: "Science!",
      text: "A thinker, engineer or inventor, making the important things the villain needs.",
      minion: { key: "functional", label: "Functional", text: "A specific mundane job - medic, signals, quartermaster - that the organization needs doing." } },
    { min: 59, max: 60, key: "teamwork", label: "Teamwork", shared: true, special: "teamwork",
      text: "Two or more of them work together. Roll another archetype and either give it to all of them or roll one each. Teamwork rolled again reads as As Expected." },
    { min: 61, max: 65, key: "team-leader", label: "Team Leader",
      text: "They command a group of minions. Roll on the Action meaning table for what that group is for.",
      minion: { key: "functional", label: "Functional", text: "A specific mundane job - medic, signals, quartermaster - that the organization needs doing." } },
    { min: 66, max: 67, key: "family-tie", label: "Family Tie", shared: true,
      text: "Related to the villain, or close to them in some personal way." },
    { min: 68, max: 69, key: "protege", label: "Protege",
      text: "A rising star in the organization, and the villain's favourite.",
      minion: { key: "on-a-mission", label: "On A Mission", text: "One specific important job, handed down: plant the thing, deliver the thing, be somewhere at a time." } },
    { min: 70, max: 72, key: "right-hand", label: "Right Hand",
      text: "Second only to the villain, and able to stand in for them.",
      minion: { key: "on-a-mission", label: "On A Mission", text: "One specific important job, handed down: plant the thing, deliver the thing, be somewhere at a time." } },
    { min: 73, max: 74, key: "necessary", label: "Necessary To The Plan",
      text: "Not just a servant - integral. Some attribute, role or skill makes them irreplaceable.",
      minion: { key: "on-a-mission", label: "On A Mission", text: "One specific important job, handed down: plant the thing, deliver the thing, be somewhere at a time." } },
    { min: 75, max: 76, key: "mini-ruler", label: "Mini-Ruler",
      text: "A minor villain in their own right, running a domain of their own.",
      minion: { key: "on-a-mission", label: "On A Mission", text: "One specific important job, handed down: plant the thing, deliver the thing, be somewhere at a time." } },
    { min: 77, max: 82, key: SPECIAL.meaning, label: "Meaning Table", shared: true, special: SPECIAL.meaning,
      text: "Roll on a meaning table and read an underling out of the word." },
    { min: 83, max: Infinity, key: SPECIAL.double, label: "Double Archetypes", shared: true, special: SPECIAL.double,
      text: "Roll two and combine them. Rolled again, it is ignored and re-rolled." }
  ]
};

export const CRAFTER_GUIDANCE = {
  interpret: {
    title: "Read it to fit, or set it aside",
    cite: "MM41:p9",
    text: "These read like specific structures - Secret Society, Government - but they work like a meaning table with more detail. Take whatever fits the situation you are in, twist what nearly fits, and ignore what cannot be made to mean anything. A mind-controlling spore running organized crime is a stranger and better answer than re-rolling for a tidier one."
  },
  stages: {
    title: "All at once, or as you go",
    cite: "MM41:p3",
    text: "Rolling the villain, the organization and the underlings up front hands you a great deal of context to start from. Holding each one back until your character actually learns it keeps the discovery in play. Both are supported; the app just remembers where you got to."
  },
  modifiers: {
    title: "Modifiers carry forward",
    cite: "MM41:p9",
    text: "The archetype modifies the organization roll, and both of them modify the lieutenant and minion rolls. The app carries the arithmetic and shows its working - a double archetype adds both sets together."
  },
  underlings: {
    title: "Lieutenants vary, minions usually do not",
    cite: "MM41:p13",
    text: "Roll a fresh archetype for each new lieutenant; for minions you can either roll each time for variety or take the first roll as what this organization's rank and file are like."
  },
  stats: {
    title: "Statistics are your game's business",
    cite: "MM41:p8",
    text: "The article converts a villain into numbers by guessing the value and asking the Game Master whether that is what it is - Yes takes the guess, Exceptional Yes raises it, No lowers it. This app has no attached system and holds no stat blocks, so that stays at your table."
  },
  provenance: {
    title: "Where these tables came from",
    cite: "MM41:p14-15",
    text: "Three bands of the Minion column were unreadable in the text this app was first built from, and shipped saying so rather than guessed at. Photographs of the page closed the gap: the Soldier entry is one cell spanning 40-44, and On A Mission spans 68-76. Every band here is now read from the page."
  }
};
