// Shared timing constant for the ZNU Pulse Home redesign's entrance
// animations (Home.jsx + PulseCard.jsx) — a short pause before
// anything starts moving, so the page reads as "here, then revealing"
// rather than everything popping in the instant React mounts. Kept in
// one place so every animated element on Home stays in sync if this
// value is ever tuned.
export const ENTRANCE_PAUSE = 0.45
