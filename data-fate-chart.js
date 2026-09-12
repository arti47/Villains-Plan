// Schemer — the Fate Chart, Mythic Game Master Emulator Second Edition. Cited GME2e.
// Transcribed from a photograph of the chart: nine odds rows by nine Chaos Factors.
//
// Each cell is [exceptionalYes, yes, exceptionalNo]. Roll 1d100 and read down:
//   roll <= exceptionalYes            -> Exceptional Yes
//   roll <= yes                       -> Yes
//   roll >= exceptionalNo             -> Exceptional No
//   anything else                     -> No
// `null` is the chart's "x": that result cannot happen at those odds and that chaos.
//
// Corroboration: the chaos-5 column is identical to the One-Page Mythic chart already in
// data-mythic.js, which was transcribed separately from a different page. The unit
// harness asserts that, so the two transcriptions check each other.

export const FATE_CHART = {
  id: "fate-chart",
  name: "Fate Chart",
  cite: "GME2e",
  die: 100,
  reading: "Roll 1d100. At or under the first number is an Exceptional Yes; at or under the second is a Yes; at or over the third is an Exceptional No; anything else is a No.",
  // rows are indexed by the odds key; each array is Chaos Factor 1..9
  rows: [
    { key: "certain", label: "Certain", cells: [
      [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99],
      [19, 95, 100], [20, 99, null], [20, 99, null], [20, 99, null]] },
    { key: "nearly-certain", label: "Nearly Certain", cells: [
      [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98],
      [18, 90, 99], [19, 95, 100], [20, 99, null], [20, 99, null]] },
    { key: "very-likely", label: "Very Likely", cells: [
      [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96],
      [17, 85, 98], [18, 90, 99], [19, 95, 100], [20, 99, null]] },
    { key: "likely", label: "Likely", cells: [
      [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94],
      [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100]] },
    { key: "50-50", label: "50/50", cells: [
      [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91],
      [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99]], default: true },
    { key: "unlikely", label: "Unlikely", cells: [
      [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88],
      [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98]] },
    { key: "very-unlikely", label: "Very Unlikely", cells: [
      [null, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86],
      [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96]] },
    { key: "nearly-impossible", label: "Nearly Impossible", cells: [
      [null, 1, 81], [null, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84],
      [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94]] },
    { key: "impossible", label: "Impossible", cells: [
      [null, 1, 81], [null, 1, 81], [null, 1, 81], [1, 5, 82], [2, 10, 83],
      [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91]] }
  ]
};

/**
 * The chart is one ladder of thirteen rungs, read at an offset set by the odds and the
 * Chaos Factor. This is NOT how the app reads the chart - the 81 cells above are - it is
 * a structural fact the harness uses to prove the transcription has no typo in it.
 */
export const FATE_LADDER = [
  [null, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88],
  [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99],
  [19, 95, 100], [20, 99, null]
];

/** Ladder index = chaos + this offset, clamped to the ends of the ladder. */
export const FATE_LADDER_OFFSETS = {
  "certain": 5, "nearly-certain": 4, "very-likely": 3, "likely": 2, "50-50": 1,
  "unlikely": 0, "very-unlikely": -1, "nearly-impossible": -2, "impossible": -3
};

/**
 * The three variant Fate Charts, transcribed from a photograph of the page that prints
 * all three side by side. Same cell shape as FATE_CHART: [exceptionalYes, yes,
 * exceptionalNo], `null` for the chart's "x".
 *
 * What differs is the columns. Instead of one column per Chaos Factor, each variant
 * groups the nine Chaos Factors into bands - five for Mid-Chaos, three for Low-Chaos, one
 * for No-Chaos - which is exactly how they compress chaos's pull on a question.
 *
 * These are transcriptions, not derivations: the app reads these cells. See
 * VARIANT_EQUIVALENCE below for what the harness then proves about them.
 */
export const CHART_VARIANTS = [
  {
    key: "mid-chaos", name: "Mid-Chaos Fate Chart", cite: "GME2e",
    columns: [{ min: 1, max: 1, label: "1" }, { min: 2, max: 3, label: "2-3" },
              { min: 4, max: 6, label: "4-6" }, { min: 7, max: 8, label: "7-8" },
              { min: 9, max: 9, label: "9" }],
    rows: [
      { key: "certain", cells: [
        [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100], [20, 99, null]] },
      { key: "nearly-certain", cells: [
        [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100]] },
      { key: "very-likely", cells: [
        [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99]] },
      { key: "likely", cells: [
        [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98]] },
      { key: "50-50", cells: [
        [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96]] },
      { key: "unlikely", cells: [
        [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94]] },
      { key: "very-unlikely", cells: [
        [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91]] },
      { key: "nearly-impossible", cells: [
        [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88]] },
      { key: "impossible", cells: [
        [null, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86]] }
    ]
  },
  {
    key: "low-chaos", name: "Low-Chaos Fate Chart", cite: "GME2e",
    columns: [{ min: 1, max: 2, label: "1-2" }, { min: 3, max: 7, label: "3-7" },
              { min: 8, max: 9, label: "8-9" }],
    rows: [
      { key: "certain", cells: [[17, 85, 98], [18, 90, 99], [19, 95, 100]] },
      { key: "nearly-certain", cells: [[15, 75, 96], [17, 85, 98], [18, 90, 99]] },
      { key: "very-likely", cells: [[13, 65, 94], [15, 75, 96], [17, 85, 98]] },
      { key: "likely", cells: [[10, 50, 91], [13, 65, 94], [15, 75, 96]] },
      { key: "50-50", cells: [[7, 35, 88], [10, 50, 91], [13, 65, 94]] },
      { key: "unlikely", cells: [[5, 25, 86], [7, 35, 88], [10, 50, 91]] },
      { key: "very-unlikely", cells: [[3, 15, 84], [5, 25, 86], [7, 35, 88]] },
      { key: "nearly-impossible", cells: [[2, 10, 83], [3, 15, 84], [5, 25, 86]] },
      { key: "impossible", cells: [[1, 5, 82], [2, 10, 83], [3, 15, 84]] }
    ]
  },
  {
    key: "no-chaos", name: "No-Chaos Fate Chart", cite: "GME2e",
    columns: [{ min: 1, max: 9, label: "any" }],
    rows: [
      { key: "certain", cells: [[18, 90, 99]] },
      { key: "nearly-certain", cells: [[17, 85, 98]] },
      { key: "very-likely", cells: [[15, 75, 96]] },
      { key: "likely", cells: [[13, 65, 94]] },
      { key: "50-50", cells: [[10, 50, 91]] },
      { key: "unlikely", cells: [[7, 35, 88]] },
      { key: "very-unlikely", cells: [[5, 25, 86]] },
      { key: "nearly-impossible", cells: [[3, 15, 84]] },
      { key: "impossible", cells: [[2, 10, 83]] }
    ]
  }
];

/**
 * A cross-check, not a rule the app applies.
 *
 * Every column of every variant chart turns out to be a column of the standard chart,
 * copied whole: Mid-Chaos is the standard chart's columns 3 to 7, Low-Chaos its columns 4
 * to 6, No-Chaos its column 5 alone. That was a hypothesis before the page arrived - the
 * Mid-Chaos Fate CHECK modifiers (+2/+1/0/-1/-2) are the standard Check modifiers for
 * chaos 7/6/5/4/3, which suggested the chart compressed the same way - and the photograph
 * confirmed it cell for cell.
 *
 * It is recorded here as a harness assertion because it makes the three transcriptions
 * check each other and the standard chart: 117 cells with no independent typo.
 *
 * It also settles ruling A31 with a printed page. No-Chaos was read at column 5 because
 * the book called that the "middle of the road percentiles"; the No-Chaos chart IS
 * column 5.
 */
export const VARIANT_EQUIVALENCE = {
  "mid-chaos": [3, 4, 5, 6, 7],
  "low-chaos": [4, 5, 6],
  "no-chaos": [5]
};
