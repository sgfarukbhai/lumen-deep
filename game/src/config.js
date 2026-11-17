// Lumen Deep: every tuning number in one place, so the game can be balanced
// without touching the rules or the drawing. Times are seconds, speeds are
// field units per second, sizes are field units.
export const FIELD = { width: 1280, height: 800 };

/** Fixed simulation step, seconds. */
export const STEP = 1 / 60;

/** Lives Luma starts with. */
export const LIVES = 3;

/** localStorage key for the best score. */
export const BEST_KEY = 'lumen-deep-best';

/** The lantern light: it drains, motes refill it, and at zero the run ends. */
export const LIGHT = {
  max: 100,
  drain: 0.55,
  drainPerLevel: 0.07,
  mote: 7,
  gold: 12,
  hitLoss: 12,
};

/** Motes collected to reach the next level; level 5 lights the Sunken Beacon. */
export const MOTES_PER_LEVEL = 15;
export const BEACON_LEVEL = 5;
export const BEACON_POINTS = 500;
export const LEVEL_POINTS = 50;

/** Chain pickups inside this window to raise the combo multiplier. */
export const COMBO_WINDOW = 2.5;
export const COMBO_MAX = 8;

export const PLAYER = {
  radius: 16,
  accel: 1500,
  maxSpeed: 340,
  drag: 2.4,
  dashSpeed: 880,
  dashTime: 0.22,
  dashCooldown: 2.2,
  dashInvuln: 0.35,
  hitInvuln: 1.2,
};

export const MOTE = {
  radius: 10,
  goldRadius: 13,
  points: 10,
  goldPoints: 25,
  target: 12,
  targetPerLevel: 1,
  targetMax: 16,
  spawnInterval: 0.75,
  goldChance: 0.14,
};

export const EEL = {
  baseInterval: 3.4,
  minInterval: 1.5,
  intervalScale: 0.92,
  speed: 95,
  speedPerLevel: 14,
  length: 92,
  radius: 14,
  maxCount: 9,
};

export const URCHIN = {
  startLevel: 2,
  interval: 6,
  speed: 26,
  radius: 16,
  maxCount: 4,
};

/** Power-ups cycle shield, magnet, slow current, one every POWERUP.interval seconds. */
export const POWERUP = {
  interval: 18,
  magnetRadius: 240,
  magnetTime: 6,
  slowTime: 6,
  slowFactor: 0.45,
};

/** Rank titles shown on the results screen, by score. */
export const RANKS = [
  [0, 'Plankton Drifter'],
  [500, 'Glow Seeker'],
  [1500, 'Trench Diver'],
  [3000, 'Abyssal Guide'],
  [6000, 'Keeper of the Light'],
];

export function rankFor(score) {
  let title = RANKS[0][1];
  for (const [at, name] of RANKS) if (score >= at) title = name;
  return title;
}
