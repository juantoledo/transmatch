# Transmatch — Antenna Tuner Configurator

**Live:** https://juantoledo.github.io/transmatch/

A single-page web app for ham radio operators to configure and save settings for antenna tuners (transmatches).

## Features

- **Visual rotary knobs** — drag, scroll wheel, or Shift+drag for fine control; double-click to type a value directly
- **Odometer counter** — for tuners with numeric roller-style inductors (e.g. Palstar AT2KD)
- **Factory Suggestions** — pre-loaded band/frequency settings per tuner model
- **My Presets** — save, update, and revert your own antenna configurations
- **Export / Import presets** — back up and restore all presets as a single JSON file
- **Dirty-state tracking** — amber bar appears when you tweak a loaded preset, with Update / Save as new / Revert actions
- **Unsaved-change warnings** — native browser prompt on page close or model switch when a preset has been modified
- **Session persistence** — last-used model and knob positions are restored on next visit
- **Light & dark theme** — follows system preference, manually toggleable
- **Adaptive layout** — two-column panel on desktop; bottom-sheet drawers (Presets, Suggestions, Help) on mobile

## Supported Tuners

| Model | Controls |
|-------|----------|
| Zetagi TM535 | TRANSMITTER knob, ANTENNA knob, INDUCTOR SELECTOR (A–L) |
| Palstar AT2KD | MAIN knob (100→0), INDUCTOR counter (30–329) |

## Usage

Open `index.html` directly in a browser — no build step, no server required.

### Interactions

| Action | Result |
|--------|--------|
| Drag up/down | Increase / decrease value |
| Scroll wheel | Step one increment |
| Shift + drag | Fine control (10× slower) |
| Double-click / double-tap | Open direct value entry |

## Adding a Tuner Model

Edit `data.js` and add an entry to `tunerDB`:

```js
"Brand Model": {
  controls: [
    { id: "cap1", label: "CAPACITOR", type: "knob",         min: 1, max: 10, step: 0.5, size: "large", arcFrom: -90, arcTo: 90 },
    { id: "ind",  label: "INDUCTOR",  type: "knob-labeled", options: ["A","B","C","D"],  size: "small", boxed: true, startAt: -90 },
    { id: "pos",  label: "POSITION",  type: "counter",      min: 0, max: 999, step: 1,  orientation: "horizontal", digits: 3 }
  ],
  factorySuggestions: [
    { freq: 7, cap1: 5, ind: "B", pos: 42 }
  ]
}
```

### Control types

| Property | Values | Description |
|----------|--------|-------------|
| `type` | `knob` | Continuous numeric knob |
| `type` | `knob-labeled` | Stepped knob with named positions |
| `type` | `counter` | Odometer-style digit display |
| `size` | `large` / `small` | Knob diameter |
| `arcFrom` / `arcTo` | degrees | Sweep range (omit for full 360°) |
| `startAt` | degrees | Start angle when no arc is specified |
| `reversed` | `true` | Flip scale so max is on the left |
| `tickStep` | number | Tick/label density (independent of `step`) |
| `boxed` | `true` | Draws a box around the knob |
| `orientation` | `horizontal` / `vertical` | Counter digit direction |
| `digits` | number | Counter digit count |

### Preset file format (export/import)

```json
{
  "version": 1,
  "app": "transmatch",
  "models": {
    "Zetagi TM535": [
      { "name": "40m DX", "antennaModel": "Dipole 40m", "transmitter": 7, "antenna": 7, "inductor": "F" }
    ]
  }
}
```

Import merges by preset name — existing presets with the same name are kept untouched.
