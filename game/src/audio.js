// Every sound is synthesised with WebAudio at run time: short oscillator blips
// and filtered noise, no audio files and no network. The context is created on
// the first user gesture (browsers block sound before one) and stays quiet
// until then. M toggles mute.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let pad = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  /** One oscillator note with an exponential decay envelope. */
  function tone(freq, seconds, type, volume, slideTo) {
    const ac = ensure();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  /** A burst of filtered noise, for whooshes and splashes. */
  function noise(seconds, volume, filterFreq) {
    const ac = ensure();
    if (!ac) return;
    const now = ac.currentTime;
    const length = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
  }

  /** A soft ambient pad: two detuned sines under a low-pass, barely audible. */
  function startPad() {
    const ac = ensure();
    if (!ac || pad) return;
    const gain = ac.createGain();
    gain.gain.value = 0.05;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const a = ac.createOscillator();
    a.type = 'sine';
    a.frequency.value = 110;
    const b = ac.createOscillator();
    b.type = 'sine';
    b.frequency.value = 164.8;
    a.connect(filter);
    b.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    a.start();
    b.start();
    pad = { gain, a, b };
  }

  return {
    /** Call from any user gesture; safe to call often. */
    unlock() {
      try {
        ensure();
        startPad();
      } catch {
        // No audio on this browser: the game plays on silently.
      }
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    /** Pickup blip: the pitch climbs a semitone per combo step. */
    pickup(combo) {
      const step = Math.min(combo, 12);
      const freq = 523.25 * Math.pow(2, step / 12);
      tone(freq, 0.16, 'sine', 0.22);
      tone(freq * 2, 0.1, 'sine', 0.08);
    },
    power() {
      tone(392, 0.12, 'triangle', 0.2);
      tone(587.33, 0.2, 'triangle', 0.2, 880);
    },
    hurt() {
      tone(160, 0.3, 'sawtooth', 0.25, 55);
      noise(0.18, 0.2, 500);
    },
    dash() {
      noise(0.22, 0.16, 1800);
    },
    levelUp() {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.22, 'triangle', 0.2), i * 90);
      });
    },
    beacon() {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.5, 'sine', 0.2), i * 120);
      });
      noise(0.6, 0.08, 2400);
    },
    over() {
      [392, 311.13, 233.08].forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.5, 'triangle', 0.18), i * 220);
      });
    },
  };
}
