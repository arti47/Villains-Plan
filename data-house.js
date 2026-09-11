// Schemer — house aids (§2.2). Nothing here comes from a published table; each is an
// app convenience, isolated in this file, flagged, and labelled as a house aid wherever
// it is used.

export const HOUSE_AID = true;

/**
 * Picking an entry from a Threads or Characters list.
 *
 * GME2e rolls on these lists during random events, but the supplied summary does not give
 * the selection roll, so the app does not reproduce it. This is the app's own method:
 * every LINE is equally likely, which is exactly what makes the book's weighting bite -
 * an element holding three lines is three times as likely as one holding a single line.
 */
export const WEIGHTED_PICK = {
  id: "weighted-pick",
  houseAid: true,
  label: "Pick at random (house aid)",
  text: "Every line on the list has the same chance, so an element with three lines comes up three times as often as one with a single line. Mythic's own selection roll is not in the source this app was built from, so this is the app's method, not the book's."
};
