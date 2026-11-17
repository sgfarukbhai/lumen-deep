// The screenshot scenes behind ?shot=start|play|beacon|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by
// an autopilot (chase the nearest mote, keep clear of eels and urchins, dash
// when one gets too close), so the frame is what a short game really looks
// like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const BEACON_LIMIT_SECONDS = 420;
const BEACON_HOLD_SECONDS = 1.2;
const END_LIMIT_SECONDS = 600;

/** The eel's head position right now. */
function eelHead(eel) {
  return { x: eel.x, y: eel.baseY + Math.sin(eel.phase) * eel.amp };
}

/** True when a hazard is within `radius` of (x, y). */
function hazardNear(state, x, y, radius) {
  for (const eel of state.eels) {
    const head = eelHead(eel);
    for (let t = 0; t <= 1; t += 0.5) {
      const bx = head.x - eel.dir * t * eel.len;
      const by = eel.baseY + Math.sin(eel.phase - t * 2.4) * eel.amp * (0.4 + 0.6 * t);
      if (Math.hypot(bx - x, by - y) < radius + eel.radius) return true;
    }
  }
  for (const u of state.urchins) {
    if (Math.hypot(u.x - x, u.y - y) < radius + u.r) return true;
  }
  return false;
}

/**
 * Steer Luma: toward the nearest mote, pushed away from any hazard close by.
 * `avoidRadius` is how far ahead it looks; the end scene's pilot looks only a
 * moment ahead, so it is caught out once the trench fills up, as a hurried
 * player is. Returns { steer, dash }.
 */
function autopilot(state, avoidRadius, useDash) {
  const p = state.player;
  let mote = null;
  let bestD = Infinity;
  for (const m of state.motes) {
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bestD) {
      bestD = d;
      mote = m;
    }
  }
  let sx = 0;
  let sy = 0;
  if (mote) {
    sx = (mote.x - p.x) / Math.max(1, bestD);
    sy = (mote.y - p.y) / Math.max(1, bestD);
  } else {
    sx = (FIELD.width / 2 - p.x) / FIELD.width;
    sy = (FIELD.height / 2 - p.y) / FIELD.height;
  }
  let nearestHazard = Infinity;
  for (const eel of state.eels) {
    const head = eelHead(eel);
    nearestHazard = Math.min(nearestHazard, Math.hypot(head.x - p.x, head.y - p.y));
    const aheadX = p.x + sx * 90;
    const aheadY = p.y + sy * 90;
    if (Math.hypot(head.x - aheadX, head.y - aheadY) < avoidRadius) {
      const away = Math.hypot(head.x - p.x, head.y - p.y) || 1;
      sx += ((p.x - head.x) / away) * 1.8;
      sy += ((p.y - head.y) / away) * 1.8;
    }
  }
  for (const u of state.urchins) {
    nearestHazard = Math.min(nearestHazard, Math.hypot(u.x - p.x, u.y - p.y));
    const aheadX = p.x + sx * 90;
    const aheadY = p.y + sy * 90;
    if (Math.hypot(u.x - aheadX, u.y - aheadY) < avoidRadius) {
      const away = Math.hypot(u.x - p.x, u.y - p.y) || 1;
      sx += ((p.x - u.x) / away) * 1.8;
      sy += ((p.y - u.y) / away) * 1.8;
    }
  }
  const len = Math.hypot(sx, sy) || 1;
  const dash = useDash && nearestHazard < 78 && p.dashCd <= 0;
  return { steer: { kind: 'dir', x: sx / len, y: sy / len }, dash };
}

/**
 * Set `world` to the named scene (start, play, beacon or end) and return the
 * screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'beacon' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, null, false, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'beacon') {
    for (let i = 0; i < BEACON_LIMIT_SECONDS / STEP; i += 1) {
      const { steer, dash } = autopilot(world.state, 150, true);
      world.step(STEP, steer, dash, false);
      if (world.state.beaconLit) {
        for (let j = 0; j < BEACON_HOLD_SECONDS / STEP; j += 1) world.step(STEP, null, false, false);
        break;
      }
      if (world.state.over) break;
    }
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const avoid = name === 'end' ? 90 : 150;
  const useDash = name !== 'end';
  for (let i = 0; i < limit / STEP; i += 1) {
    const { steer, dash } = autopilot(world.state, avoid, useDash);
    if (world.step(STEP, steer, dash, false) & EVENT_OVER) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
