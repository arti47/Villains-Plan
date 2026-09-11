// firebase-config.js — PLACEHOLDER. Phase 5 (multiplayer sync) is gated and NOT built:
// Stage B chose local-first, and this subsystem is single-seat (a solo player emulating
// a GM). The shape is here so the phase needs no migration, and so the schema in
// database.rules.json has something to point at.
//
// Never commit real keys. Dropping real values here and flipping FIREBASE_ENABLED does
// nothing until src/sync.js exists.

export const FIREBASE_ENABLED = false;

export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  databaseURL: "https://REPLACE_ME.firebaseio.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
