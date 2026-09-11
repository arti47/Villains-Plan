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
  chaosRange: [1, 9],
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
