# Transmatch — Antenna Tuner Configurator

**Live:** https://juantoledo.github.io/transmatch/

A single-page web app for ham radio operators to configure and save settings for antenna tuners (transmatches).

## Features

- **Visual rotary knobs** — drag, scroll wheel, or Shift+drag for fine control
- **Factory Suggestions** — pre-loaded frequency settings per tuner model
- **My Presets** — save, update, and revert your own antenna configurations
- **Dirty-state tracking** — amber bar appears when you tweak a loaded preset, with Update / Save as new / Revert actions
- **Light & dark theme** — follows system preference, manually toggleable
- **Responsive** — works from desktop down to iPhone screen widths

## Usage

Open `index.html` directly in a browser — no build step, no server required.

## Adding a Tuner Model

Edit `data.js` and add an entry to `tunerDB`:

```js
"Brand Model": {
  controls: [
    { id: "cap1", label: "CAPACITOR", type: "knob", min: 1, max: 10, step: 0.5, size: "large", arcFrom: -90, arcTo: 90 },
    { id: "ind",  label: "INDUCTOR",  type: "knob-labeled", options: ["A","B","C","D"], size: "small", boxed: true, startAt: -90 }
  ],
  factorySuggestions: [
    { freq: 7, cap1: 5, ind: "B" }
  ]
}
```

### Control types

| Property | Values | Description |
|----------|--------|-------------|
| `type` | `knob` | Continuous numeric knob |
| `type` | `knob-labeled` | Stepped knob with named positions |
| `size` | `large` / `small` | Knob diameter |
| `arcFrom` / `arcTo` | degrees | Sweep range (omit for full 360°) |
| `startAt` | degrees | Start angle when no arc is specified |
| `boxed` | `true` | Draws a box around the knob |
