// Lumen Deep's rules and state, with no drawing and no browser in it: Luma the
// lanternfish, the drifting motes, the shadow eels, the urchins, the power-ups,
// the draining lantern light, combos, levels and the Sunken Beacon. step()
// advances one fixed step and returns what happened as bit flags, so the caller
// can react (sounds, announcements) without the world knowing about screens.
import {
  BEACON_LEVEL,
  BEACON_POINTS,
  COMBO_MAX,
  COMBO_WINDOW,
  EEL,
  FIELD,
  LEVEL_POINTS,
  LIGHT,
  LIVES,
  MOTE,
  MOTES_PER_LEVEL,
  PLAYER,
  POWERUP,
  URCHIN,
} from './config.js';

export const EVENT_MOTE = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_LEVEL = 8;
export const EVENT_BEACON = 16;
export const EVENT_POWER = 32;
export const EVENT_DASH = 64;
export const EVENT_BLOCK = 128;

const POWER_KINDS = ['shield', 'magnet', 'slow'];
const SNOW_COUNT = 70;

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function createWorld(random) {
  const state = {
    player: null,
    motes: [],
    eels: [],
    urchins: [],
    powerups: [],
    particles: [],
    popups: [],
    snow: [],
    score: 0,
    lives: LIVES,
    level: 1,
    motesCollected: 0,
    maxCombo: 0,
    combo: 0,
    comboT: 0,
    light: LIGHT.max,
    elapsed: 0,
    over: false,
    overCause: '',
    beaconLit: false,
    beaconT: 0,
    banner: null,
    bannerT: 0,
    shake: 0,
    flash: 0,
    moteT: 0,
    eelT: 0,
    urchinT: 0,
    powerT: 0,
    powerIndex: 0,
  };

  function reset() {
    state.player = {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: PLAYER.radius,
      dashCd: 0,
      dashT: 0,
      invuln: 0,
      shield: false,
      magnetT: 0,
      slowT: 0,
      tailPhase: 0,
    };
    state.motes.length = 0;
    state.eels.length = 0;
    state.urchins.length = 0;
    state.powerups.length = 0;
    state.particles.length = 0;
    state.popups.length = 0;
    state.snow.length = 0;
    for (let i = 0; i < SNOW_COUNT; i += 1) {
      state.snow.push({
        x: random() * FIELD.width,
        y: random() * FIELD.height,
        size: 1 + random() * 2.4,
        speed: 8 + random() * 22,
        drift: (random() - 0.5) * 12,
        phase: random() * Math.PI * 2,
      });
    }
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.motesCollected = 0;
    state.maxCombo = 0;
    state.combo = 0;
    state.comboT = 0;
    state.light = LIGHT.max;
    state.elapsed = 0;
    state.over = false;
    state.overCause = '';
    state.beaconLit = false;
    state.beaconT = 0;
    state.banner = null;
    state.bannerT = 0;
    state.shake = 0;
    state.flash = 0;
    state.moteT = 0.4;
    state.eelT = 2.2;
    state.urchinT = 4;
    state.powerT = POWERUP.interval;
    state.powerIndex = 0;
    for (let i = 0; i < 6; i += 1) spawnMote(true);
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const v = speed * (0.3 + random() * 0.7);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: 0.5 + random() * 0.5,
        maxLife: 1,
        size: 2 + random() * 3.5,
        color,
        kind: 'spark',
      });
    }
  }

  function bubbles(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x: x + (random() - 0.5) * 30,
        y: y + (random() - 0.5) * 20,
        vx: (random() - 0.5) * 14,
        vy: -26 - random() * 30,
        life: 0.8 + random() * 0.9,
        maxLife: 1.7,
        size: 2 + random() * 4,
        color: '#9fe8ff',
        kind: 'bubble',
      });
    }
  }

  function popup(x, y, text, color, size) {
    state.popups.push({ x, y, text, color, size: size || 20, life: 1.1 });
  }

  function setBanner(text, sub, seconds) {
    state.banner = { text, sub };
    state.bannerT = seconds;
  }

  function spawnMote(anywhere) {
    const gold = random() < MOTE.goldChance;
    const mote = {
      x: 40 + random() * (FIELD.width - 80),
      y: 50 + random() * (FIELD.height - 120),
      vx: (random() - 0.5) * 14,
      vy: 6 + random() * 12,
      r: gold ? MOTE.goldRadius : MOTE.radius,
      kind: gold ? 'gold' : 'cyan',
      phase: random() * Math.PI * 2,
    };
    if (!anywhere) {
      const p = state.player;
      if (dist(mote.x, mote.y, p.x, p.y) < 130) {
        mote.x = FIELD.width - mote.x;
        mote.y = FIELD.height - mote.y - 60;
      }
    }
    state.motes.push(mote);
  }

  function spawnEel() {
    const fromLeft = random() < 0.5;
    const speed = EEL.speed + EEL.speedPerLevel * (state.level - 1) + random() * 30;
    state.eels.push({
      x: fromLeft ? -EEL.length : FIELD.width + EEL.length,
      baseY: 70 + random() * (FIELD.height - 160),
      dir: fromLeft ? 1 : -1,
      speed,
      phase: random() * Math.PI * 2,
      amp: 26 + random() * 30,
      len: EEL.length,
      radius: EEL.radius,
    });
  }

  function spawnUrchin() {
    const edge = Math.floor(random() * 4);
    const urchin = { x: 0, y: 0, vx: 0, vy: 0, r: URCHIN.radius, rot: random() * Math.PI * 2, rotV: (random() - 0.5) * 1.6 };
    if (edge === 0) { urchin.x = -30; urchin.y = 60 + random() * (FIELD.height - 120); urchin.vx = URCHIN.speed; }
    if (edge === 1) { urchin.x = FIELD.width + 30; urchin.y = 60 + random() * (FIELD.height - 120); urchin.vx = -URCHIN.speed; }
    if (edge === 2) { urchin.x = 60 + random() * (FIELD.width - 120); urchin.y = -30; urchin.vy = URCHIN.speed; }
    if (edge === 3) { urchin.x = 60 + random() * (FIELD.width - 120); urchin.y = FIELD.height + 30; urchin.vy = -URCHIN.speed; }
    state.urchins.push(urchin);
  }

  function spawnPowerup() {
    const kind = POWER_KINDS[state.powerIndex % POWER_KINDS.length];
    state.powerIndex += 1;
    state.powerups.push({
      x: 90 + random() * (FIELD.width - 180),
      y: 90 + random() * (FIELD.height - 200),
      kind,
      phase: random() * Math.PI * 2,
    });
  }

  function collectMote(index) {
    const mote = state.motes[index];
    const p = state.player;
    state.motes.splice(index, 1);
    if (state.comboT > 0) state.combo = Math.min(state.combo + 1, COMBO_MAX);
    else state.combo = 1;
    state.comboT = COMBO_WINDOW;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    const base = mote.kind === 'gold' ? MOTE.goldPoints : MOTE.points;
    const gained = base * state.combo;
    state.score += gained;
    state.light = Math.min(LIGHT.max, state.light + (mote.kind === 'gold' ? LIGHT.gold : LIGHT.mote));
    state.motesCollected += 1;
    burst(mote.x, mote.y, mote.kind === 'gold' ? '#ffd76a' : '#5ff2ff', mote.kind === 'gold' ? 14 : 9, 120);
    popup(mote.x, mote.y - 14, `+${gained}`, mote.kind === 'gold' ? '#ffd76a' : '#8ff7ff', state.combo > 1 ? 24 : 20);
    if (state.motesCollected % MOTES_PER_LEVEL === 0) {
      state.level += 1;
      state.score += LEVEL_POINTS;
      setBanner(`LEVEL ${state.level}`, state.level === BEACON_LEVEL ? '' : 'The current quickens', 2.2);
      if (state.level === BEACON_LEVEL && !state.beaconLit) {
        state.beaconLit = true;
        state.beaconT = 3.5;
        state.score += BEACON_POINTS;
        setBanner('THE SUNKEN BEACON LIT!', `+${BEACON_POINTS} — the trench glows again`, 3.5);
        burst(p.x, p.y, '#ffd76a', 46, 260);
        bubbles(p.x, p.y, 18);
        return EVENT_MOTE | EVENT_LEVEL | EVENT_BEACON;
      }
      return EVENT_MOTE | EVENT_LEVEL;
    }
    return EVENT_MOTE;
  }

  function hitHazard() {
    const p = state.player;
    state.combo = 0;
    state.comboT = 0;
    state.lives -= 1;
    state.light = Math.max(0, state.light - LIGHT.hitLoss);
    p.invuln = PLAYER.hitInvuln;
    state.shake = 0.55;
    state.flash = 0.55;
    burst(p.x, p.y, '#ff5d7a', 18, 200);
    if (state.lives <= 0) {
      state.over = true;
      state.overCause = 'eaten';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function stepPlayer(dt, steer, dash, harmless) {
    const p = state.player;
    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.dashT > 0) p.dashT -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.magnetT > 0) p.magnetT -= dt;
    if (p.slowT > 0) p.slowT -= dt;
    p.tailPhase += dt * (6 + Math.hypot(p.vx, p.vy) / 40);

    let events = 0;
    if (dash && p.dashCd <= 0 && !harmless) {
      p.dashT = PLAYER.dashTime;
      p.dashCd = PLAYER.dashCooldown;
      p.invuln = Math.max(p.invuln, PLAYER.dashInvuln);
      const dir = steer && steer.kind === 'dir'
        ? steer
        : Math.hypot(p.vx, p.vy) > 20
          ? { x: p.vx / Math.hypot(p.vx, p.vy), y: p.vy / Math.hypot(p.vx, p.vy) }
          : { x: Math.cos(p.angle), y: Math.sin(p.angle) };
      p.vx = dir.x * PLAYER.dashSpeed;
      p.vy = dir.y * PLAYER.dashSpeed;
      bubbles(p.x, p.y, 6);
      events |= EVENT_DASH;
    }

    if (steer) {
      if (steer.kind === 'dir') {
        p.vx += steer.x * PLAYER.accel * dt;
        p.vy += steer.y * PLAYER.accel * dt;
      } else {
        const dx = steer.x - p.x;
        const dy = steer.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          const pull = Math.min(1, d / 140);
          p.vx += (dx / d) * PLAYER.accel * pull * dt;
          p.vy += (dy / d) * PLAYER.accel * pull * dt;
        }
      }
    }
    const damp = Math.max(0, 1 - PLAYER.drag * dt);
    p.vx *= damp;
    p.vy *= damp;
    const speed = Math.hypot(p.vx, p.vy);
    const cap = p.dashT > 0 ? PLAYER.dashSpeed : PLAYER.maxSpeed;
    if (speed > cap) {
      p.vx = (p.vx / speed) * cap;
      p.vy = (p.vy / speed) * cap;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx) * 0.4; }
    if (p.x > FIELD.width - p.radius) { p.x = FIELD.width - p.radius; p.vx = -Math.abs(p.vx) * 0.4; }
    if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy) * 0.4; }
    if (p.y > FIELD.height - p.radius) { p.y = FIELD.height - p.radius; p.vy = -Math.abs(p.vy) * 0.4; }
    if (Math.hypot(p.vx, p.vy) > 24) p.angle = Math.atan2(p.vy, p.vx);
    return events;
  }

  /**
   * One fixed step. `steer` is { kind: 'dir', x, y }, { kind: 'target', x, y }
   * or null; `dash` asks for a dash. With `harmless` set (the title screen's
   * backdrop) things drift but nothing is collected, nothing hurts Luma and
   * the light never drains.
   */
  function step(dt, steer, dash, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (state.bannerT > 0) state.bannerT -= dt;
    if (state.beaconT > 0) state.beaconT -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.flash > 0) state.flash -= dt;
    if (state.comboT > 0) {
      state.comboT -= dt;
      if (state.comboT <= 0) state.combo = 0;
    }

    events |= stepPlayer(dt, steer, dash, harmless);

    if (!harmless) {
      state.light -= (LIGHT.drain + LIGHT.drainPerLevel * (state.level - 1)) * dt;
      if (state.light <= 0) {
        state.light = 0;
        state.over = true;
        state.overCause = 'dark';
        burst(state.player.x, state.player.y, '#8ff7ff', 22, 160);
        return events | EVENT_OVER;
      }
    }

    for (const flake of state.snow) {
      flake.y += flake.speed * dt;
      flake.x += flake.drift * dt + Math.sin(state.elapsed + flake.phase) * 6 * dt;
      if (flake.y > FIELD.height + 4) {
        flake.y = -4;
        flake.x = random() * FIELD.width;
      }
    }

    // Motes: drift, bob, magnet pull, collection.
    state.moteT -= dt;
    const moteTarget = Math.min(MOTE.target + (state.level - 1) * MOTE.targetPerLevel, MOTE.targetMax);
    if (state.moteT <= 0) {
      if (state.motes.length < moteTarget) spawnMote(false);
      state.moteT = MOTE.spawnInterval;
    }
    const p = state.player;
    for (let i = state.motes.length - 1; i >= 0; i -= 1) {
      const mote = state.motes[i];
      mote.phase += dt * 3;
      if (p.magnetT > 0) {
        const d = dist(mote.x, mote.y, p.x, p.y);
        if (d < POWERUP.magnetRadius && d > 1) {
          mote.vx += ((p.x - mote.x) / d) * 900 * dt;
          mote.vy += ((p.y - mote.y) / d) * 900 * dt;
        }
      }
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt + Math.sin(mote.phase) * 8 * dt;
      mote.vx *= 0.995;
      mote.vy *= 0.995;
      if (mote.y > FIELD.height + 20 || mote.y < -20 || mote.x < -20 || mote.x > FIELD.width + 20) {
        state.motes.splice(i, 1);
        continue;
      }
      if (!harmless && dist(mote.x, mote.y, p.x, p.y) < p.radius + mote.r + 2) {
        events |= collectMote(i);
        if (state.over) return events;
      }
    }

    // Eels: sine-swim across, spawn faster as levels rise.
    state.eelT -= dt;
    const eelInterval = Math.max(EEL.minInterval, EEL.baseInterval * Math.pow(EEL.intervalScale, state.level - 1));
    if (state.eelT <= 0) {
      if (state.eels.length < Math.min(2 + state.level, EEL.maxCount)) spawnEel();
      state.eelT = eelInterval;
    }
    const slow = p.slowT > 0 ? POWERUP.slowFactor : 1;
    for (let i = state.eels.length - 1; i >= 0; i -= 1) {
      const eel = state.eels[i];
      eel.phase += dt * 2.2;
      eel.x += eel.dir * eel.speed * slow * dt;
      const y = eel.baseY + Math.sin(eel.phase) * eel.amp;
      if (eel.x < -EEL.length - 60 || eel.x > FIELD.width + EEL.length + 60) {
        state.eels.splice(i, 1);
        continue;
      }
      if (!harmless && p.invuln <= 0 && dist(eel.x, y, p.x, p.y) < p.radius + eel.radius - 4) {
        if (p.shield) {
          p.shield = false;
          state.eels.splice(i, 1);
          burst(eel.x, y, '#9fe8ff', 16, 180);
          popup(p.x, p.y - 30, 'SHIELD!', '#9fe8ff', 22);
          events |= EVENT_BLOCK;
        } else {
          events |= hitHazard();
          if (state.over) return events;
        }
      }
    }

    // Urchins: slow drifters from level 2, bouncing off the walls.
    if (state.level >= URCHIN.startLevel) {
      state.urchinT -= dt;
      if (state.urchinT <= 0) {
        if (state.urchins.length < URCHIN.maxCount) spawnUrchin();
        state.urchinT = URCHIN.interval;
      }
    }
    for (let i = state.urchins.length - 1; i >= 0; i -= 1) {
      const u = state.urchins[i];
      u.rot += u.rotV * dt;
      u.x += u.vx * slow * dt;
      u.y += u.vy * slow * dt;
      if (u.x < -40 || u.x > FIELD.width + 40) u.vx = -u.vx;
      if (u.y < -40 || u.y > FIELD.height + 40) u.vy = -u.vy;
      if (!harmless && p.invuln <= 0 && dist(u.x, u.y, p.x, p.y) < p.radius + u.r - 2) {
        if (p.shield) {
          p.shield = false;
          state.urchins.splice(i, 1);
          burst(u.x, u.y, '#9fe8ff', 16, 180);
          popup(p.x, p.y - 30, 'SHIELD!', '#9fe8ff', 22);
          events |= EVENT_BLOCK;
        } else {
          events |= hitHazard();
          if (state.over) return events;
        }
      }
    }

    // Power-ups: one every POWERUP.interval seconds, cycling kinds.
    state.powerT -= dt;
    if (state.powerT <= 0) {
      spawnPowerup();
      state.powerT = POWERUP.interval;
    }
    for (let i = state.powerups.length - 1; i >= 0; i -= 1) {
      const up = state.powerups[i];
      up.phase += dt * 2.5;
      if (!harmless && dist(up.x, up.y, p.x, p.y) < p.radius + 20) {
        if (up.kind === 'shield') {
          p.shield = true;
          popup(p.x, p.y - 30, 'SHIELD!', '#9fe8ff', 22);
        } else if (up.kind === 'magnet') {
          p.magnetT = POWERUP.magnetTime;
          popup(p.x, p.y - 30, 'MAGNET!', '#ffd76a', 22);
        } else {
          p.slowT = POWERUP.slowTime;
          popup(p.x, p.y - 30, 'SLOW CURRENT!', '#c9a7ff', 22);
        }
        burst(up.x, up.y, '#ffffff', 12, 140);
        state.powerups.splice(i, 1);
        events |= EVENT_POWER;
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const part = state.particles[i];
      part.life -= dt;
      if (part.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vx *= 0.98;
      part.vy *= 0.98;
    }
    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      const pop = state.popups[i];
      pop.life -= dt;
      pop.y -= 34 * dt;
      if (pop.life <= 0) state.popups.splice(i, 1);
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
