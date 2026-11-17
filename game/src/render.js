// Every pixel of Lumen Deep, drawn on one canvas: the deep-sea backdrop with
// god rays and marine snow, the glowing motes, the shadow eels, Luma the
// lanternfish, the particles, the HUD and the four screens (title, play,
// paused, game over). The field is 1280x800 and the canvas letterboxes it.
import { COMBO_MAX, FIELD, LIGHT, rankFor } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.max(2, Math.floor(FIELD.width * scale * dpr));
    canvas.height = Math.max(2, Math.floor(FIELD.height * scale * dpr));
    canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  function text(str, x, y, size, color, align, weight, glow, glowColor) {
    ctx.font = `${weight || 700} ${size}px ${FONT}`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (glow) {
      ctx.shadowColor = glowColor || color;
      ctx.shadowBlur = glow;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.shadowBlur = 0;
  }

  function heart(x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 16, size / 16);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
    ctx.bezierCurveTo(6, -12, 11, -4, 0, 5);
    ctx.closePath();
    ctx.fillStyle = filled ? '#ff5d7a' : 'rgba(255,93,122,0.18)';
    ctx.strokeStyle = '#ff5d7a';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBackground(state) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, '#0b3547');
    g.addColorStop(0.55, '#082a40');
    g.addColorStop(1, '#020812');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // God rays swaying down from the surface.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i += 1) {
      const sway = Math.sin(state.elapsed * 0.22 + i * 2.1) * 60;
      const x = 260 + i * 380 + sway;
      const ray = ctx.createLinearGradient(x, 0, x + 90, FIELD.height);
      ray.addColorStop(0, 'rgba(120,220,255,0.10)');
      ray.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x - 26, 0);
      ctx.lineTo(x + 26, 0);
      ctx.lineTo(x + 130, FIELD.height);
      ctx.lineTo(x - 40, FIELD.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Rocky floor.
    ctx.fillStyle = '#0a1a26';
    ctx.beginPath();
    ctx.moveTo(0, FIELD.height);
    ctx.lineTo(0, FIELD.height - 46);
    ctx.quadraticCurveTo(220, FIELD.height - 84, 430, FIELD.height - 48);
    ctx.quadraticCurveTo(640, FIELD.height - 92, 860, FIELD.height - 52);
    ctx.quadraticCurveTo(1080, FIELD.height - 80, FIELD.width, FIELD.height - 44);
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.closePath();
    ctx.fill();

    // Swaying seaweed silhouettes.
    ctx.strokeStyle = '#0e2f23';
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i += 1) {
      const x = 70 + i * 145;
      const sway = Math.sin(state.elapsed * 0.7 + i * 1.3) * 22;
      const h = 60 + ((i * 37) % 70);
      ctx.lineWidth = 7 - (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, FIELD.height - 30);
      ctx.quadraticCurveTo(x + sway * 0.4, FIELD.height - 30 - h * 0.6, x + sway, FIELD.height - 30 - h);
      ctx.stroke();
    }

    // Marine snow.
    ctx.fillStyle = 'rgba(200,235,255,0.55)';
    for (const flake of state.snow) {
      ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(state.elapsed + flake.phase));
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMote(mote, time) {
    const pulse = 1 + 0.18 * Math.sin(mote.phase);
    const gold = mote.kind === 'gold';
    const color = gold ? '#ffd76a' : '#5ff2ff';
    const core = gold ? '#fff3c4' : '#d9fbff';
    const glow = ctx.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.r * 3.2 * pulse);
    glow.addColorStop(0, gold ? 'rgba(255,215,106,0.55)' : 'rgba(95,242,255,0.5)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r * 3.2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r * 0.62 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawEel(eel, time) {
    const y = eel.baseY + Math.sin(eel.phase) * eel.amp;
    const headX = eel.x;
    const segs = 12;
    const pts = [];
    for (let s = 0; s <= segs; s += 1) {
      const t = s / segs;
      pts.push({
        x: headX - eel.dir * t * eel.len,
        y: eel.baseY + Math.sin(eel.phase - t * 2.4) * eel.amp * (0.4 + 0.6 * t),
      });
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(headX, y, 0, headX, y, 60);
    glow.addColorStop(0, 'rgba(120,40,160,0.20)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(headX, y, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // One continuous tapered body: a thick line through the body points, then
    // a heavier front third, so the eel reads as a solid serpent, not beads.
    function strokeBody(from, to, width) {
      ctx.strokeStyle = '#170a24';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[from].x, pts[from].y);
      for (let i = from + 1; i <= to; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    strokeBody(0, segs, eel.radius * 1.5);
    strokeBody(0, Math.floor(segs * 0.45), eel.radius * 1.9);
    ctx.fillStyle = '#241031';
    ctx.beginPath();
    ctx.arc(headX, y, eel.radius, 0, Math.PI * 2);
    ctx.fill();
    // Red eyes on the head.
    const eyeY = y - 5;
    const eyeX = headX + eel.dir * 7;
    ctx.fillStyle = '#ff3b4e';
    ctx.shadowColor = '#ff3b4e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawUrchin(u) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(u.rot);
    ctx.strokeStyle = '#3a2b52';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * u.r * 0.5, Math.sin(a) * u.r * 0.5);
      ctx.lineTo(Math.cos(a) * (u.r + 9), Math.sin(a) * (u.r + 9));
      ctx.stroke();
    }
    ctx.fillStyle = '#241533';
    ctx.beginPath();
    ctx.arc(0, 0, u.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a7a';
    ctx.beginPath();
    ctx.arc(-4, -4, u.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerup(up) {
    const bob = Math.sin(up.phase) * 4;
    const y = up.y + bob;
    ctx.save();
    ctx.globalAlpha = 0.9;
    const glow = ctx.createRadialGradient(up.x, y, 0, up.x, y, 34);
    glow.addColorStop(0, 'rgba(159,232,255,0.35)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(up.x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,245,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(up.x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(up.x - 6, y - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#eafcff';
    ctx.strokeStyle = '#eafcff';
    if (up.kind === 'shield') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(up.x, y + 2, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(up.x - 7, y - 3);
      ctx.lineTo(up.x, y + 10);
      ctx.lineTo(up.x + 7, y - 3);
      ctx.closePath();
      ctx.fill();
    } else if (up.kind === 'magnet') {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(up.x, y - 1, 7, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(up.x - 7, y - 1);
      ctx.lineTo(up.x - 7, y + 7);
      ctx.moveTo(up.x + 7, y - 1);
      ctx.lineTo(up.x + 7, y + 7);
      ctx.stroke();
    } else {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(up.x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(up.x, y);
      ctx.lineTo(up.x, y - 5);
      ctx.moveTo(up.x, y);
      ctx.lineTo(up.x + 4, y + 2);
      ctx.stroke();
    }
  }

  function drawPlayer(p, state) {
    const blink = p.invuln > 0 && Math.floor(state.elapsed * 14) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;

    // Halo of light around Luma.
    const haloR = 74 + Math.sin(state.elapsed * 3) * 5;
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
    halo.addColorStop(0, 'rgba(140,240,255,0.34)');
    halo.addColorStop(0.6, 'rgba(140,240,255,0.10)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Light cone ahead.
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const cone = ctx.createLinearGradient(0, 0, 150, 0);
    cone.addColorStop(0, 'rgba(255,240,180,0.26)');
    cone.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(150, -52);
    ctx.lineTo(150, 52);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body, tail and fins, pointing along the angle of travel.
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const wag = Math.sin(p.tailPhase) * 7;
    ctx.fillStyle = '#2fb7c9';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-30, -11 + wag);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-30, 11 + wag);
    ctx.closePath();
    ctx.fill();
    const body = ctx.createLinearGradient(0, -14, 0, 14);
    body.addColorStop(0, '#d9fbff');
    body.addColorStop(0.55, '#7fe3f2');
    body.addColorStop(1, '#2b8fa8');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,60,80,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lantern stalk and glowing bulb.
    ctx.strokeStyle = '#2b8fa8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.quadraticCurveTo(16, -22, 24, -20);
    ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(25, -20, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Eye.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9, -4, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#062033';
    ctx.beginPath();
    ctx.arc(10.5, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dash cooldown ring.
    if (p.dashCd > 0) {
      const frac = 1 - p.dashCd / 2.2;
      ctx.strokeStyle = 'rgba(159,232,255,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    // Shield bubble.
    if (p.shield) {
      ctx.strokeStyle = 'rgba(159,232,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30 + Math.sin(state.elapsed * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(state) {
    for (const part of state.particles) {
      const alpha = Math.max(0, part.life / part.maxLife);
      if (part.kind === 'bubble') {
        ctx.strokeStyle = `rgba(200,245,255,${0.7 * alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * alpha + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const pop of state.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.life));
      ctx.shadowColor = pop.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = pop.color;
      ctx.font = `700 ${pop.size}px ${FONT}`;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawHud(state, best, muted) {
    // Score, top left.
    text('SCORE', 36, 34, 16, '#8fd8e8', 'left', 700);
    text(String(state.score), 36, 66, 46, '#ffffff', 'left', 800, 14, '#5ff2ff');
    text(`BEST ${Math.max(best, state.score)}`, 36, 100, 15, '#9fb8c8', 'left', 600);

    // Light meter, top centre.
    const barW = 320;
    const barX = FIELD.width / 2 - barW / 2;
    text('LIGHT', FIELD.width / 2, 30, 15, '#ffe9a8', 'center', 700);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(barX - 2, 42, barW + 4, 20);
    ctx.strokeStyle = 'rgba(255,233,168,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 2, 42, barW + 4, 20);
    const frac = Math.max(0, state.light / LIGHT.max);
    const low = frac < 0.25;
    const fill = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (low) {
      fill.addColorStop(0, '#ff5d7a');
      fill.addColorStop(1, '#ff9d5c');
    } else {
      fill.addColorStop(0, '#5ff2ff');
      fill.addColorStop(1, '#ffd76a');
    }
    ctx.fillStyle = fill;
    const pulse = low ? 0.75 + 0.25 * Math.sin(state.elapsed * 8) : 1;
    ctx.globalAlpha = pulse;
    ctx.fillRect(barX, 44, barW * frac, 16);
    ctx.globalAlpha = 1;

    // Lives and level, top right.
    for (let i = 0; i < 3; i += 1) heart(FIELD.width - 36 - i * 34, 52, 15, i < state.lives);
    text(`LEVEL ${state.level}`, FIELD.width - 36, 88, 17, '#c9a7ff', 'right', 700);

    // Combo badge.
    if (state.combo >= 2) {
      const cx = FIELD.width / 2;
      text(`COMBO ×${state.combo}`, cx, 96, 26, '#ffd76a', 'center', 800, 16, '#ffd76a');
      const cw = 120 * (state.comboT / 2.5);
      ctx.fillStyle = 'rgba(255,215,106,0.8)';
      ctx.fillRect(cx - 60, 112, cw, 5);
    }

    // Active effects, bottom left.
    let ey = FIELD.height - 30;
    if (state.player.magnetT > 0) {
      text(`MAGNET ${Math.ceil(state.player.magnetT)}s`, 36, ey, 15, '#ffd76a', 'left', 700);
      ey -= 22;
    }
    if (state.player.slowT > 0) {
      text(`SLOW CURRENT ${Math.ceil(state.player.slowT)}s`, 36, ey, 15, '#c9a7ff', 'left', 700);
      ey -= 22;
    }
    text(muted ? 'M — SOUND OFF' : 'M — SOUND ON', FIELD.width - 36, FIELD.height - 30, 13, '#6f8b9b', 'right', 600);

    // Banner (level up, beacon).
    if (state.banner && state.bannerT > 0) {
      const a = Math.min(1, state.bannerT);
      ctx.globalAlpha = a;
      text(state.banner.text, FIELD.width / 2, 210, 44, '#ffd76a', 'center', 800, 22, '#ffd76a');
      if (state.banner.sub) text(state.banner.sub, FIELD.width / 2, 252, 20, '#eafcff', 'center', 600);
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(2,8,18,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text('LUMEN DEEP', FIELD.width / 2, 240, 96, '#ffd76a', 'center', 800, 30, '#ffd76a');
    text('Feed the light. Dodge the dark.', FIELD.width / 2, 306, 26, '#8ff7ff', 'center', 600, 10, '#5ff2ff');
    text('Collect glowing motes to keep your lantern lit — chain them for combos.', FIELD.width / 2, 380, 20, '#d7ecf5', 'center', 600);
    text('Shadow eels and urchins cost a life. Light the Sunken Beacon at level 5!', FIELD.width / 2, 412, 20, '#d7ecf5', 'center', 600);
    text('MOUSE or WASD / ARROWS to swim  ·  SPACE or CLICK to dash', FIELD.width / 2, 470, 19, '#9fb8c8', 'center', 700);
    text('P pause  ·  M sound', FIELD.width / 2, 500, 17, '#6f8b9b', 'center', 600);
    if (best > 0) text(`BEST ${best}`, FIELD.width / 2, 556, 22, '#ffd76a', 'center', 700);
    const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
    ctx.globalAlpha = blink;
    text('CLICK OR PRESS ENTER TO DIVE', FIELD.width / 2, 620, 26, '#ffffff', 'center', 800, 16, '#5ff2ff');
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(2,8,18,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text('PAUSED', FIELD.width / 2, 360, 64, '#ffffff', 'center', 800, 20, '#5ff2ff');
    text('Press P or click to keep swimming', FIELD.width / 2, 430, 22, '#9fb8c8', 'center', 600);
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(2,8,18,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const dark = state.overCause === 'dark';
    text(dark ? 'THE LIGHT FADES' : 'THE DARK TOOK LUMA', FIELD.width / 2, 190, 58, '#ff8ba0', 'center', 800, 24, '#ff5d7a');
    text(dark ? 'Your lantern ran out of light.' : 'Three hits from the shadows.', FIELD.width / 2, 244, 20, '#d7ecf5', 'center', 600);
    text('SCORE', FIELD.width / 2, 310, 16, '#8fd8e8', 'center', 700);
    text(String(state.score), FIELD.width / 2, 356, 72, '#ffffff', 'center', 800, 24, '#5ff2ff');
    const isBest = state.score >= best && state.score > 0;
    text(isBest ? `NEW BEST!` : `BEST ${best}`, FIELD.width / 2, 412, 20, '#ffd76a', 'center', 700);
    const stats = [
      ['MOTES', String(state.motesCollected)],
      ['MAX COMBO', `×${state.maxCombo}`],
      ['LEVEL', String(state.level)],
      ['TIME', `${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`],
    ];
    const startX = FIELD.width / 2 - 330;
    stats.forEach(([label, value], i) => {
      const x = startX + i * 220;
      text(label, x + 110, 480, 14, '#8fd8e8', 'center', 700);
      text(value, x + 110, 512, 30, '#ffffff', 'center', 800);
    });
    text(rankFor(state.score), FIELD.width / 2, 566, 24, '#c9a7ff', 'center', 700, 12, '#c9a7ff');
    const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
    ctx.globalAlpha = blink;
    text('PRESS R OR CLICK TO DIVE AGAIN', FIELD.width / 2, 636, 24, '#ffffff', 'center', 800, 14, '#5ff2ff');
    ctx.globalAlpha = 1;
  }

  function draw(state, screen, best, muted) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.save();
    if (state.shake > 0) {
      const s = state.shake * 14;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    drawBackground(state);
    for (const up of state.powerups) drawPowerup(up);
    for (const mote of state.motes) drawMote(mote, state.elapsed);
    for (const u of state.urchins) drawUrchin(u);
    for (const eel of state.eels) drawEel(eel, state.elapsed);
    if (state.player) drawPlayer(state.player, state);
    drawParticles(state);
    ctx.restore();

    // The beacon's golden beam, while it celebrates.
    if (state.beaconT > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(0, 0, 0, FIELD.height);
      beam.addColorStop(0, `rgba(255,215,106,${0.28 * Math.min(1, state.beaconT)})`);
      beam.addColorStop(1, 'rgba(255,215,106,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(FIELD.width / 2 - 90, 0);
      ctx.lineTo(FIELD.width / 2 + 90, 0);
      ctx.lineTo(FIELD.width / 2 + 260, FIELD.height);
      ctx.lineTo(FIELD.width / 2 - 260, FIELD.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best, muted);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_OVER) drawOver(state, best);

    // Vignette.
    const v = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.42,
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.85,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(1,4,10,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // Red flash on a hit; pulsing red edge when the light is nearly out.
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,60,90,${state.flash * 0.28})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (screen === SCREEN_PLAY && state.light / LIGHT.max < 0.25 && !state.over) {
      const a = 0.1 + 0.08 * Math.sin(state.elapsed * 6);
      ctx.strokeStyle = `rgba(255,60,90,${a})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  return { draw };
}
