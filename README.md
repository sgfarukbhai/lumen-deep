# Lumen Deep

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/sgfarukbhai/lumen-deep/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/sgfarukbhai/lumen-deep/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A deep-sea arcade game: you are Luma, a little lanternfish in a bioluminescent trench. Collect glowing motes to keep your lantern lit — chain them for combos — dodge shadow eels and spiky urchins, grab shield, magnet and slow-current power-ups, and light the Sunken Beacon at level 5. The light always drains, so every run ends; the question is how bright you burn before it does. Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network: the game is plain static files under `game/`, all sounds synthesised with WebAudio at run time.

## Controls

- **Mouse** or **WASD / arrow keys** — swim
- **Space or click** — dash (brief burst, brief invulnerability)
- **P** — pause, **M** — sound on/off, **R** — dive again after game over

## Rules

- Motes feed your light (+7, golden motes +12) and score points, multiplied by your combo (up to ×8) for chained pickups.
- Shadow eels and urchins cost a life and 12 light. Three hits ends the run.
- Every 15 motes raises the level: faster eels, more hazards, faster drain.
- Level 5 lights the Sunken Beacon (+500) and the run continues in endless mode.

## Files

- `game/index.html` + `game/src/` — the game: `config.js` (tuning), `random.js` (seeded RNG), `audio.js` (synth sounds), `input.js` (keyboard/mouse), `world.js` (rules), `render.js` (drawing), `shots.js` (staged screenshots), `main.js` (loop)
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — real renders of the game in a browser (play, title, beacon, game over)

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
