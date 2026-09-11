// Schemer — the Fate Check, Mythic Game Master Emulator Second Edition. Cited GME2e.
// Quoted from the source: an alternative to the Fate Chart, not an addition to it.
//
// "You still roll 2d10, but this time you add the dice together instead of treating them
// like a percentile", modified by the Odds and by the Chaos Factor.

export const FATE_CHECK = {
  id: "fate-check",
  name: "Fate Check",
  cite: "GME2e",
  dice: { count: 2, sides: 10 },
  alternativeTo: "fate-chart",

  // Quoted tables.
  oddsModifiers: {
    "certain": 5, "nearly-certain": 4, "very-likely": 2, "likely": 1, "50-50": 0,
    "unlikely": -1, "very-unlikely": -2, "nearly-impossible": -4, "impossible": -5
  },
  chaosModifiers: { 9: 5, 8: 4, 7: 2, 6: 1, 5: 0, 4: -1, 3: -2, 2: -4, 1: -5 },

  // Mid-Chaos, quoted: the same ladder flattened. Note what it is: +2/+1/0/-1/-2 are the
  // standard modifiers for chaos 7/6/5/4/3, so Mid-Chaos compresses the Chaos Factor into
  // the middle of its range rather than changing the maths.
  // Low-Chaos Fate Check modifiers (GME2e), printed as bands: 8-9 is +1, 3-7 is none,
  // 1-2 is -1. Expanded per Chaos Factor here, the way the standard ladder is stored.
  lowChaosModifiers: { 9: 1, 8: 1, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: -1, 1: -1 },
  lowChaosBands: [
    { min: 8, max: 9, mod: 1 }, { min: 3, max: 7, mod: 0 }, { min: 1, max: 2, mod: -1 }
  ],
  midChaosModifiers: { 9: 2, 8: 1, 7: 1, 6: 0, 5: 0, 4: 0, 3: -1, 2: -1, 1: -2 },
  midChaosBands: [
    { chaos: [9, 9], modifier: 2 }, { chaos: [7, 8], modifier: 1 }, { chaos: [4, 6], modifier: 0 },
    { chaos: [2, 3], modifier: -1 }, { chaos: [1, 1], modifier: -2 }
  ],

  /**
   * The printed answer table reads 18-20 Exceptional Yes, 11 or more Yes, 10 or less No,
   * 2-4 Exceptional No. Those are the ranges of an unmodified 2d10; the modifiers run
   * -10 to +10, so a real total can land anywhere from -8 to 30. The app therefore reads
   * the table as thresholds, which is the only coherent way to take it (ruling A34).
   */
  answers: [
    { key: "exceptional-yes", atLeast: 18, label: "Exceptional Yes", printed: "18-20" },
    { key: "yes", atLeast: 11, label: "Yes", printed: "11 or more" },
    { key: "exceptional-no", atMost: 4, label: "Exceptional No", printed: "2-4" },
    { key: "no", label: "No", printed: "10 or less" }
  ],

  // "If both dice come up as the same number (11, 22, 33, etc.), and the single digit
  // value (1, 2, 3, etc.) is within the Chaos Factor range, then you get a Random Event."
  randomEvent: {
    text: "Both dice the same, and that number at or under the Chaos Factor, also gives a random event.",
    note: "A double 10 can never trigger one, because the Chaos Factor stops at 9."
  }
};
