// Keyboard, mouse and touch input in one place. The fish is steered by the
// pointer (it follows it) or by WASD / arrow keys; Space or a click dashes.
// Enter / Space / click confirms on the title and results screens, P pauses,
// M mutes. Actions are edge-triggered: takeActions returns what happened since
// the last call, then clears it.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_DASH = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  const pointer = { x: FIELD.width / 2, y: FIELD.height / 2, active: false };

  /** Convert a client position to field coordinates through the letterbox. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  function onKeyDown(event) {
    const code = event.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) event.preventDefault();
    if (event.repeat) return;
    keys.add(code);
    if (code === 'Enter' || code === 'Space') actions |= ACTION_CONFIRM;
    if (code === 'KeyP' || code === 'Escape') actions |= ACTION_PAUSE;
    if (code === 'KeyM') actions |= ACTION_MUTE;
    if (code === 'Space') actions |= ACTION_DASH;
    if (code === 'KeyR') actions |= ACTION_CONFIRM;
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerMove(event) {
    const p = toField(event.clientX, event.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
  }

  function onPointerDown(event) {
    const p = toField(event.clientX, event.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
    actions |= ACTION_CONFIRM | ACTION_DASH;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** Keyboard steering vector, or null when no movement key is held. */
    direction() {
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (dx === 0 && dy === 0) return null;
      const length = Math.hypot(dx, dy);
      return { x: dx / length, y: dy / length };
    },
    /** The pointer's field position, when the pointer has been used. */
    pointer() {
      return pointer.active ? { x: pointer.x, y: pointer.y } : null;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
