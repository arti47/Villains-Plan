// Schemer — rules library, tutorial and worked examples.
// One library entry per rule the app automates or surfaces (CLAUDE.md §9.1a).
// All prose is in the app's own words; the source is cited, never quoted.

export const LIBRARY_GROUPS = [
  { key: "start", label: "Before you begin" },
  { key: "earning", label: "Earning a reveal" },
  { key: "phase", label: "Revealing a phase" },
  { key: "endgoal", label: "The End Goal" },
  { key: "arc", label: "Arcs and foiling" },
  { key: "pivot", label: "The Pivot" },
  { key: "scenes", label: "Scenes and chaos" },
  { key: "crafter", label: "Crafting the villain" },
  { key: "oracle", label: "The Mythic oracle" },
  { key: "app", label: "How the app behaves" }
];

export const LIBRARY = [
  { id: "what-this-is", group: "start", title: "What this tool is for", cite: "MM69:p16",
    body: "You already know there is a villain and that something is being planned. This tool reveals that plan a layer at a time, so the investigation is the adventure rather than a single moment of guessing right. Bring it in once your character is aware of the villain and suspects a scheme." },

  { id: "arcs", group: "start", title: "The three arcs", cite: "MM69:p25",
    body: "Discovery: earn reveals until the End Goal surfaces. Foiling: the plan is known, so go and spoil it - expect this to run as long as the Discovery arc did. Pivot: optional, and only if the villain can still act. The app tracks which arc you are in and what the next boundary is." },

  { id: "earned-discovery", group: "earning", title: "Reveals are earned, not rolled", cite: "MM69:p18",
    body: "You decide when a reveal is due - after the ambush survived, the lead followed, the room entered under a dead assassin's name. The rules deliberately keep this off the dice, because you have already decided the mystery is the spine of the adventure. The app never rolls to see whether you learn something and never nags you to. There is one button, and you press it when you have earned it." },

  { id: "reveal-sequence", group: "phase", title: "The order of a reveal", cite: "MM69:p22",
    body: "The End Goal Roll comes first, before anything else is rolled: it decides whether this reveal is another phase or the finale. Then the Focus roll for context, then two keywords. The app performs them in that order and the roll log records them that way." },

  { id: "villain-plan-focus", group: "phase", title: "Villain Plan Focus", cite: "MM69:p21",
    body: "A d100 table of seven contexts - marching, relocating, searching, gathering resources, teamwork, collecting, construction - plus a fifth of the range that declines to steer you at all. It answers what this piece of the plan looks like from outside, not what it is for." },

  { id: "plot-twists", group: "phase", title: "Plot Twists keywords", cite: "MM69:p21",
    body: "A hundred single words; you roll two and read them against the Focus and against what you already know. They are meaning, not instructions: 'Mental, Missing' next to Gathering Resources became agents amassing a hoard while missing any idea of why." },

  { id: "no-context", group: "phase", title: "No Context is a result", cite: "MM69:p21",
    body: "The top fifth of the Villain Plan Focus table, and the top sixth of the End Goal table, give you no context. That is a real answer and never a re-roll: the two keywords carry the whole reveal. The app shows the roll and simply gives you no Focus line." },

  { id: "doubles", group: "phase", title: "Doubled keywords", cite: "MM69:p21",
    body: "Both dice can land on the same word. Plot Twists is a meaning table, so read a double as amplification - that word, harder - rather than rolling again. The app flags the double and leaves the reading to you." },

  { id: "partial-reveal", group: "phase", title: "Explain something, ask something", cite: "MM69:p20",
    body: "A phase is a portion of the plan, never the whole of it. Interpret so that one thing becomes clear and another becomes newly puzzling. The puzzling half is your next scene - write it in as a lead, and the dossier will keep it in front of you until you resolve it." },

  { id: "end-goal-roll", group: "endgoal", title: "The End Goal Roll", cite: "MM69:p22",
    body: "Before generating a reveal, roll a d10 and add 2 for every phase you already know. Eleven or more and this reveal is the End Goal. So the first reveal can never be the finale (ten is the most a d10 can give), the second needs a 9, the third a 7, the fourth a 5, the fifth a 3, and the sixth arrives whatever you roll. The app shows the number you need before you roll it." },

  { id: "end-goal-focus", group: "endgoal", title: "End Goal Focus", cite: "MM69:p22",
    body: "The finale rolls on its own d100 table: acquisition, something personal, self-advancement, destruction, a monstrous new order, a villain behind the villain, or survival at everyone else's expense - plus a sixth of the range with no context at all." },

  { id: "coherence", group: "endgoal", title: "The End Goal must explain the rest", cite: "MM69:p24",
    body: "The finale does two jobs: it names the last piece, and it makes every earlier phase make sense in hindsight. Gorazon's hired swords, stolen relics and seized mine only cohered once his grudge against his own king surfaced. When the app reveals your End Goal it lists every phase you already have, and every one of them stays editable - revising backwards is the rule working, not cheating." },

  { id: "pivot-gate", group: "pivot", title: "When a pivot is possible", cite: "MM69:p26",
    body: "Somebody has to be left to enact it: the villain survived, important underlings are at large, or a failsafe was set in advance. The app asks which of the three is true and refuses the pivot if none of them are - that refusal is the rule, not a limitation of the app." },

  { id: "pivot-focus", group: "pivot", title: "Pivot Plan Focus", cite: "MM69:p25",
    body: "Four results: a diminished version of the original plan, spite that ruins the thing for everyone, petty revenge, or an outright surprise read from the keywords. Revenge covers thirty points of the range because it is the most likely thing a beaten villain does." },

  { id: "pivot-timing", group: "pivot", title: "Reveal it immediately, keep it short", cite: "MM69:p25",
    body: "Put the Plan B in the scene right after the plan falls - the celebration, the debrief - because a pivot you know is coming and are waiting for reads as padding. One to three scenes. If you would rather be surprised, ask a Fate Question in that cleanup scene instead and record the answer here." },

  { id: "chaos-factor", group: "scenes", title: "The Chaos Factor", cite: "GME2e",
    body: "One number, one to nine, starting at five, measuring how much control your character has over events. It is what the scene test is rolled against: high chaos means more scenes that are not the one you pictured. At the end of every scene you decide whether the characters were generally in control - progress and successes - or not, and it moves one step, floor of one, ceiling of nine. Note that it does not touch this app's Ask The Game Master odds: those come from One-Page Mythic, whose chart has no Chaos Factor in it." },

  { id: "scene-test", group: "scenes", title: "Testing the expected scene", cite: "GME2e",
    body: "Say how you expect the next scene to open - usually whatever your character means to do - then roll one d10 against the Chaos Factor. Over it, and the scene runs as you pictured. At or under it, an odd roll alters the scene and an even roll interrupts it. The expectation has to exist before the roll, because both of the other outcomes are defined against it." },

  { id: "altered-scene", group: "scenes", title: "Altered scenes", cite: "GME2e",
    body: "The scene still happens, but not as you saw it. Roll 1d10 on the Scene Adjustment Table: remove a character, add one, reduce or remove an activity, increase one, remove an object, add one - and on a 7 or more, make two adjustments, which means rolling twice more. Asking the Game Master or rolling a meaning word are both fair ways to settle what the adjustment actually means." },

  { id: "interrupt-scene", group: "scenes", title: "Interrupt scenes", cite: "GME2e",
    body: "Your expectation is set aside and something else happens instead. An interrupt is built exactly like a random event: roll the Event Focus, then two Action words for its meaning, and read them into the situation you are in. Move Toward A Thread is called out in the book as especially useful here - the adventure has stalled and this is the push." },

  { id: "bookkeeping", group: "scenes", title: "The bookkeeping phase", cite: "GME2e",
    body: "When the action of a scene wraps up, two things happen before the next one. Update the lists: add what the scene introduced, give another line to anything prominent, cross out what is finished. Then move the Chaos Factor one step by whether the characters held control. The app fires both as one step with a summary and one undo." },

  { id: "progress-track", group: "scenes", title: "The Thread Progress Track", cite: "GME2e",
    body: "Pick one active thread as your focus and give it a track of 10, 15 or 20 points. Making any progress toward it in a scene is worth 2 points, and so is a flashpoint - a dramatic event directly involving it. Until the track fills, the thread carries plot armour: it cannot be finally resolved, however close things look. Fill it and you get the Conclusion, which is a flashpoint with the armour off: roll a random event with an automatic focus of Current Context and read it toward something that can end the thread, now or in the next scene. The book's Discovery Check, for when progress stalls, is not in what this app was built from, so the app does not roll it." },

  { id: "chaos-variants", group: "scenes", title: "Other ways to run chaos", cite: "GME2e",
    body: "No-Chaos takes the Chaos Factor out of your questions entirely: answers come from the odds alone, read at the chart's middle column, while chaos keeps running underneath because scenes are still tested against it. Random Chaos takes the judgement out of your hands: at the end of a scene roll a d10, and equal-or-under drops the Chaos Factor by one while over raises it. Mid-Chaos is not offered here - its modifiers are written for the Fate Check, and this app asks on the Fate Chart, so converting them would be inventing a rule." },

  { id: "fate-question-mechanic", group: "oracle", title: "Asking instead of a game rule", cite: "GME2e",
    body: "When a Fate Question stands in for something your game system would normally roll - a to-hit, a saving throw - treat the Chaos Factor as 5 regardless of what it actually is. The tension of the story should not decide whether a sword connects. Tick the box on the Ask screen and the chart is read at its middle column for that question only." },

  { id: "list-selection", group: "scenes", title: "Rolling on a list", cite: "GME2e",
    body: "Sections go active as the lines fill, five lines at a time, top to bottom. Roll a die sized to the active sections - no roll for one section, a d4 for two, a d6 for three, a d8 for four, a d10 for five - then a d10 for the line inside it, two faces per line. Land on a blank line and the result is Choose: take whichever entry fits what is happening, or roll again. Because an element can hold three lines, the weighting decides how often it comes up." },

  { id: "threads-characters", group: "scenes", title: "Threads and Characters", cite: "GME2e",
    body: "Two lists of twenty-five lines each. Threads are the goals your character is chasing - Mythic never invents one for you. Characters are the people who matter, and anything else that should be able to walk into a scene: a place, an object, a recurring event. Something prominent earns another line, to a maximum of three, so the busiest parts of the story are likeliest to come back. When the lines fill up you clean up: everything you are keeping comes across with a single line, except anything holding three, which comes across with two - so the list resets without losing the sense of what matters most." },

  { id: "villain-archetype", group: "crafter", title: "Villain Archetype", cite: "MM41:p6-7",
    body: "A d100 for who the villain is and what drives them - revenge, domination, duty, money, a need they cannot put down, or no free will at all. It is rolled flat, with no modifier, because the modifiers come out of it: every archetype carries three, one each for the organization, lieutenant and minion rolls that follow. Roll 81 or more and you take two archetypes and combine them, modifiers included." },

  { id: "villain-organization", group: "crafter", title: "Villain Organization", cite: "MM41:p10-11",
    body: "What stands behind the villain, from nothing at all through a gang, a cult, organized crime, a company, a syndicate, up to an actual government - rolled at the archetype's modifier, which is why this one comes second. The bands at the top and bottom are open-ended, so a large modifier cannot fall off the table. Upscale means roll again and read the result bigger, keeping both sets of modifiers." },

  { id: "underlings", group: "crafter", title: "Lieutenants and minions", cite: "MM41:p13-15",
    body: "One table, two columns, rolled at the archetype's modifier plus the organization's. A lieutenant stands in for the villain and should be a real fight; a minion is an obstacle. The article suggests a fresh roll for each lieutenant, and either a roll per minion for variety or one roll that defines what this organization's rank and file are like. Teamwork means a pair or more: roll again and share the result between them, or roll one each." },

  { id: "crafter-modifiers", group: "crafter", title: "How the modifiers carry", cite: "MM41:p9",
    body: "The archetype modifies the organization roll. The archetype and the organization both modify the lieutenant and minion rolls, added together. A double archetype adds both of its halves. The app carries this for you and prints the arithmetic on the screen - for the article's own example, Has No Choice plus One Of The People plus The Company gives +15 for lieutenants and +20 for minions." },

  { id: "crafter-stages", group: "crafter", title: "All at once, or as you go", cite: "MM41:p3",
    body: "Rolling everything up front gives you a great deal to start from. Holding each piece back until your character learns it keeps the discovery in play - the article supports both, and this app simply remembers where you got to. Lieutenants and minions can be rolled as you meet them." },

  { id: "crafter-interpret", group: "crafter", title: "Read it to fit", cite: "MM41:p9",
    body: "These results look specific - Secret Society, Government - but they work like a meaning table with more detail. Take what fits, twist what nearly fits, ignore what cannot be made to mean anything. The article's own example runs a mind-controlling alien spore as organized crime, and is better for it." },

  { id: "crafter-stats", group: "crafter", title: "Statistics stay at your table", cite: "MM41:p8",
    body: "The article turns a villain into numbers by guessing a value and asking the Game Master whether that is it - Yes takes the guess, Exceptional Yes raises it, No lowers it, and a random event means the statistic comes with a condition. This app has no game system attached and holds no stat blocks, so it does not do that part for you." },

  { id: "villain-details", group: "crafter", title: "The villain's details", cite: "MM41:p5",
    body: "The archetype paints the general picture and not much else, so the Crafter sends you to Mythic's Elements meaning tables for who the villain actually is: identity, skills, motivations, personality, appearance, traits and flaws, background. Roll a word, read it against what you already know, and roll another if one is not enough. Those seven tables are on the Villain screen, and every other Elements table is a fold away." },

  { id: "elements-tables", group: "oracle", title: "The Elements tables", cite: "GME2e",
    body: "Twelve hundred-word tables from Mythic Second Edition, each aimed at one kind of question: who someone is, what they can do, what they want, how they act in a fight or out of one, what a conversation is like, what a city is like. They are the detail tables the Crafter points at, and they sit alongside Discover Meaning on the Meaning screen - same roll, same log, same one-word-at-a-time rule." },

  { id: "crafter-provenance", group: "crafter", title: "Where these tables came from", cite: "MM41:p14-15",
    body: "Three bands of the Minion column - 42-44, 68-69 and 75-76 - were unreadable in the text this app was first built from, and it shipped saying so rather than filling them in. Photographs of the page closed the gap: Soldier is one cell spanning 40-44, and On A Mission spans 68-76. Every band you can roll here is now read from the page." },

  { id: "fate-chart", group: "oracle", title: "The Fate Chart", cite: "GME2e",
    body: "Nine odds rows from Certain to Impossible, nine Chaos Factor columns, one d100. Every cell gives three numbers: at or under the first is an Exceptional Yes, at or under the second a Yes, at or over the third an Exceptional No, and anything else is a No. The Chaos Factor moves you along the row - a 50 at 50/50 is a No at chaos 1 and a Yes at chaos 9 - which is the whole reason chaos exists. Some cells have an x: at Certain and high chaos you cannot fail exceptionally at all. The app shows the bands for your odds at your current chaos before you roll." },

  { id: "ask-chart", group: "oracle", title: "Asking the question", cite: "GME2e",
    body: "Form a Yes/No question and know what you expect the answer to be. Set the odds honestly - 50/50 is for even chances and for not knowing. Roll, read the chart at your Chaos Factor, and take the answer back into the fiction. One-Page Mythic's chart, which this app was first built on, turns out to be exactly the Fate Chart's chaos-5 column: the app checks that the two transcriptions agree, cell for cell." },

  { id: "ask-answers", group: "oracle", title: "The four answers", cite: "OPM",
    body: "Yes and No both send you back to the expectation you had when you asked - which is why the rules want you to have one. The Exceptional results go past that expectation in the same direction. If a No lands and you cannot see how it plays out, the rules send you to Discover Meaning rather than to a re-roll." },

  { id: "ask-odds", group: "oracle", title: "Choosing odds", cite: "OPM",
    body: "50/50 covers even odds and, just as importantly, not knowing. The good side runs Likely, Very Likely, Nearly Certain, Certain; the bad side Unlikely, Very Unlikely, Nearly Impossible, Impossible. Reaching for Very Likely because you want a Yes is how an oracle stops being one - the app defaults to 50/50 every time you open the screen." },

  { id: "random-events", group: "oracle", title: "Random events", cite: "GME2e",
    body: "A double-digit result on an Ask - 11, 22, 33 up to 99 - throws a random event into the same moment. The answer still stands; the event happens as well. Mythic builds one in two rolls: the Event Focus says what kind of thing happens - a remote event, a new NPC, an NPC acting, a thread moving toward you or away from you, something good or bad for your character - and then two Action words say what it is. Where the focus names a thread or an NPC, roll on that list for which one. A flat 100 is not a double." },

  { id: "action-tables", group: "oracle", title: "The Action meaning tables", cite: "GME2e",
    body: "Two hundred-word columns rolled together: the first says what happens, the second what it happens to or about. This is the pair a random event's meaning is read from, and the table the Villain Crafter means when it tells you to roll for an archetype on Mythic's Action tables." },

  { id: "discover-meaning", group: "oracle", title: "Discover Meaning", cite: "OPM",
    body: "Detail without a question: fifty rows, two columns, one d100. The Action column says what an active part of the adventure does; the Description column says what something is like. One word is often enough - when it is not, roll another and read them together, for as long as it takes. Nothing rolls a second word for you." },

  { id: "not-in-source", group: "app", title: "What this app deliberately does not do", cite: "MM69:p26",
    body: "Two sources are in here: the Villain's Plan article and One-Page Mythic, which supplies the Fate Question, random events and Discover Meaning. Still missing, and still never guessed at: the Chaos Factor - which the one-page edition drops by design - scene setup, the Bookkeeping phase, the Threads and Characters lists, and the Villain Crafter." },

  { id: "dice-honesty", group: "app", title: "About the dice", cite: null,
    body: "Every die uses the browser's cryptographic random source, never Math.random. Every roll shows its individual faces, which table it was read on, and what modified it, and the roll log keeps the record with a per-face distribution view so you can check the app instead of arguing with it. A roll happens once and is stored; nothing re-rolls behind your back." },

  { id: "backup", group: "app", title: "Your data", cite: null,
    body: "Everything lives in this browser. Settings exports the lot as plain readable JSON and imports it back, which is also how you move to another device. Nothing is sent anywhere." }
];

export const TUTORIAL = [
  { id: "t1", title: "Start an adventure",
    body: "Dossier - Adventures - New. Name the adventure and the villain, and write down what your character already knows. You need no stats: this tool tracks a plan, not a character. You can keep as many adventures as you like and come back to old ones as records." },
  { id: "t2", title: "Read the header",
    body: "The bar under the title is the whole state of the investigation: how many phases you know, what the End Goal Roll needs next, which arc you are in, and how many leads are still open. It follows you onto every screen because those numbers decide what you do next." },
  { id: "t3", title: "Play, then earn the first reveal",
    body: "Go and play your scene in Mythic as normal. When your character has genuinely got somewhere - survived something, followed something, talked their way in - come back and press Earn a reveal. There is no roll for this and the app will never ask you for one." },
  { id: "t4", title: "Read the reveal card",
    body: "The card shows the End Goal Roll first (the d10, the bonus, the number you needed), then the Focus and its two keywords. Note that the first reveal can never be the End Goal - eleven is out of a d10's reach with no bonus." },
  { id: "t5", title: "Write what it means",
    body: "The dice hand you raw material; you decide what it means in the adventure you are already in. Write the interpretation on the card. Aim for a reading that explains one thing and raises another." },
  { id: "t6", title: "Write the lead",
    body: "The thing that got more puzzling is your next scene: the seized mine, the hired sword, the enemy nobody named. Add it as a lead. Leads stay counted in the header until you tick them off, so the adventure always has somewhere to go." },
  { id: "t7", title: "Keep going until the End Goal",
    body: "Each phase you know adds 2 to the next End Goal Roll, so the finale gets closer on its own. When it fires, the card lists every phase you already have: the End Goal's job is to make all of them make sense, and you may revise them to fit." },
  { id: "t8", title: "Foil the plan",
    body: "Once the End Goal is out, the Arc screen moves you to Foiling. Expect this arc to run as long as the Discovery arc did. When the plan actually falls, mark the plan defeated - the app summarises what changed and gives you one step of undo." },
  { id: "t9", title: "Decide about a pivot",
    body: "If the villain survived, or their lieutenants are loose, or they set a failsafe, tick it on the Arc screen and roll the Pivot Plan - or, if you would rather be surprised, ask a Fate Question in your cleanup scene and record the answer. Keep the pivot to a scene or three, then conclude the adventure." },
  { id: "t2b", title: "Craft the villain, if you want one up front",
    body: "Dossier - Villain rolls the villain's archetype, the organization behind them, and the lieutenants and minions you will actually meet. Each roll feeds a modifier into the next and the app shows the arithmetic. You can do all three now for a running start, or leave them until your character learns each piece - nothing downstream needs them." },
  { id: "t2c", title: "Give the villain details",
    body: "The archetype says what kind of villain they are; step 4 on the Villain screen says who they are. Pick a table - identity, skills, motivations, personality, appearance, traits and flaws, background - roll a word, and read it against everything you have. Lieutenants and minions can take details too, which is how a Tough Stuff lieutenant becomes a specific gargoyle." },
  { id: "t7b", title: "Run the adventure as scenes",
    body: "The Scene screen is Mythic's own loop. Write what you expect to happen next, roll the d10 against the Chaos Factor, and take what you get: the scene you pictured, a twisted version, or an interruption that sends you somewhere else. When the scene is done, End the scene - that is bookkeeping: it asks whether you were in control, moves the Chaos Factor, and points you at the lists." },
  { id: "t7c", title: "Keep the two lists",
    body: "Threads are what you are chasing; Characters are who and what can walk into a scene - people, places, a recurring event. Add what a scene introduced, give another line to whatever was prominent (three lines maximum), and cross out what is finished. More lines mean more chance of coming back when you pick at random." },
  { id: "t9b", title: "Ask when you do not know",
    body: "The Oracle tab is Mythic itself: type a Yes/No question, pick the odds honestly - 50/50 is for not knowing - and roll. Yes and No follow whatever you expected when you asked; the Exceptional results overshoot it. Roll a double and a random event lands in the same moment, on top of the answer. When you want detail rather than an answer, Discover Meaning rolls a word: Action for what something does, Description for what it is like." },
  { id: "t10", title: "Back it up",
    body: "Settings - Export exports every adventure as plain JSON you can read. Do that before you delete anything, and to carry your adventures to another device." }
];

// The article's two worked examples, summarised. MM69:p19-28.
export const EXAMPLES = [
  { id: "gorazon", title: "A general who did not go home", genre: "Fantasy", cite: "MM69:p19-25",
    setup: "A victorious imperial general stays camped at his defeated enemy's stronghold and starts absorbing that enemy's surviving henchmen. The player character is sent to find out why.",
    reveals: [
      { roll: "Gathering Resources + Mental, Missing",
        reading: "Impersonating a dead assassin at a secret meeting, the character hears operatives report on hoarded relics, hired mercenaries and a quietly seized ore mine - and realises none of them know what any of it is for." },
      { roll: "(further phases)",
        reading: "An operative is sent into a lethal ruin for a powerful relic; the general's scattered troops are being organised into an army." },
      { roll: "d10 5 +6 = 11 - End Goal: Personal + Limit, Power",
        reading: "The war was started by the general's own king, out of greed for his enemy's dark power. The general means to limit that king's power for good - by waging an equally selfish war, with the ore enhancing the relics to offset the king's strength." }
    ],
    outcome: "The character destroys the mine and most of the relics, leaving the general's army exposed - but the general escapes.",
    pivot: "Revenge + Diminish, Mystery: the general raids the character's storehouse, kills the guards and takes two relics of unknown function, just as the king's forces arrive with the king himself." },

  { id: "cold-rock", title: "A billionaire and a very cold mineral", genre: "Spy thriller", cite: "MM69:p27-28",
    setup: "A spy works his way into the investor circle of a billionaire who has bought himself an island nation and is building something on it.",
    reveals: [
      { roll: "Construction + Rare, Enemy",
        reading: "A drunk investor at a party lets slip that the thing being built will destroy the billionaire's most hated enemies, and that the world has never seen anything like it." },
      { roll: "d10 4 +2 = 6 - Gathering Resources + Problem, Failure",
        reading: "The construction is a vast mine for a mineral found nowhere else, with notes about heat transfer and fusion: the mineral solves the problem of a sustained fusion reaction." },
      { roll: "d10 8 +4 = 12 - End Goal: Destruction + Personal, Unknown",
        reading: "The mineral swallows heat without warming. Fusion is only the charging mechanism: a thimble of the stuff becomes an untraceable bomb, and the plan is to plant them among rivals worldwide and kill them all at once, undetectably." }
    ],
    outcome: "Discovered and pursued into the freezing heart of the island, the spy sets a charge on processed ore and escapes by helicopter as the island tears itself apart.",
    pivot: "Revenge + Incapacitate, Repair: during a hotel air-conditioning outage, the repair technician at the door is the billionaire, with a tranquilliser gun and one last ampule." }
];
