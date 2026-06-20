let _valueEntryCtrl = null;

// arcFrom/arcTo define the sweep. When omitted the knob is a full 360° circle.
// startAt sets where the arc begins when arcFrom is not specified (default 0 = 12 o'clock).
function arcOf(ctrl) {
  const from = ctrl.arcFrom !== undefined ? ctrl.arcFrom
             : ctrl.startAt !== undefined ? ctrl.startAt
             : 0;
  const to   = ctrl.arcTo   !== undefined ? ctrl.arcTo : from + 360;
  return { from, to, span: to - from };
}

function valueToAngle(ctrl, value) {
  const { from, span } = arcOf(ctrl);
  if (ctrl.type === "knob") {
    const t = ctrl.reversed
      ? (ctrl.max - value) / (ctrl.max - ctrl.min)
      : (value - ctrl.min) / (ctrl.max - ctrl.min);
    return from + t * span;
  }
  // knob-labeled: snap to named position
  // Full circle: divide by N so last option doesn't overlap first.
  // Partial arc: divide by N-1 so first lands on arcFrom and last on arcTo.
  const idx = ctrl.options.indexOf(String(value));
  const i   = idx < 0 ? 0 : idx;
  const div = isFullCircle(ctrl) ? ctrl.options.length : ctrl.options.length - 1;
  return from + (i / div) * span;
}

function isFullCircle(ctrl) {
  return arcOf(ctrl).span >= 360;
}

function buildKnobSVG(ctrl, initValue) {
  const large    = ctrl.size === "large";
  const R        = large ? 70 : 46;
  const cx       = large ? 100 : 68;
  const cy       = large ? 100 : 68;
  const W        = cx * 2;
  const H        = cy * 2;
  const scaleR   = R + (large ? 22 : 15);
  const tickOut  = R + (large ? 16 : 11);
  const tickIn   = R + (large ? 6  : 4);
  const tickInMn = R + (large ? 3  : 2);
  const textSize = large ? 11 : 9;
  const ptrLen   = R - (large ? 14 : 10);
  const ptrW     = large ? 6 : 4;
  const full     = isFullCircle(ctrl);
  const { from: arcFrom, to: arcTo, span } = arcOf(ctrl);

  let ticks = "";
  if (ctrl.type === "knob") {
    if (ctrl.tickStep !== undefined) {
      const total = Math.round((ctrl.max - ctrl.min) / ctrl.tickStep);
      for (let i = 0; i <= total; i++) {
        const v     = ctrl.reversed ? ctrl.max - i * ctrl.tickStep : ctrl.min + i * ctrl.tickStep;
        const angle = valueToAngle(ctrl, v);
        const rad   = angle * Math.PI / 180;
        const x1 = cx + Math.sin(rad) * tickIn;
        const y1 = cy - Math.cos(rad) * tickIn;
        const x2 = cx + Math.sin(rad) * tickOut;
        const y2 = cy - Math.cos(rad) * tickOut;
        ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="scale-tick-major"/>`;
        const tx = cx + Math.sin(rad) * scaleR;
        const ty = cy - Math.cos(rad) * scaleR;
        ticks += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="scale-text" font-size="${textSize}">${v}</text>`;
      }
    } else {
      const total = (ctrl.max - ctrl.min) / ctrl.step;
      for (let i = 0; i <= total; i++) {
        const v       = ctrl.reversed ? ctrl.max - i * ctrl.step : ctrl.min + i * ctrl.step;
        const isMajor = Number.isInteger(v);
        const angle   = valueToAngle(ctrl, v);
        const rad     = angle * Math.PI / 180;
        const x1 = cx + Math.sin(rad) * (isMajor ? tickIn : tickInMn);
        const y1 = cy - Math.cos(rad) * (isMajor ? tickIn : tickInMn);
        const x2 = cx + Math.sin(rad) * tickOut;
        const y2 = cy - Math.cos(rad) * tickOut;
        ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${isMajor ? "scale-tick-major" : "scale-tick"}"/>`;
        if (isMajor) {
          const tx = cx + Math.sin(rad) * scaleR;
          const ty = cy - Math.cos(rad) * scaleR;
          ticks += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="scale-text" font-size="${textSize}">${v}</text>`;
        }
      }
    }
  } else {
    const div = isFullCircle(ctrl) ? ctrl.options.length : ctrl.options.length - 1;
    ctrl.options.forEach((lbl, i) => {
      const angle = arcFrom + (i / div) * span;
      const rad   = angle * Math.PI / 180;
      const x1 = cx + Math.sin(rad) * tickIn;
      const y1 = cy - Math.cos(rad) * tickIn;
      const x2 = cx + Math.sin(rad) * tickOut;
      const y2 = cy - Math.cos(rad) * tickOut;
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="scale-tick-major"/>`;
      const tx = cx + Math.sin(rad) * scaleR;
      const ty = cy - Math.cos(rad) * scaleR;
      ticks += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="scale-text" font-size="${textSize}">${lbl}</text>`;
    });
  }

  let arcPath = "";
  if (!full) {
    const a1  = arcFrom * Math.PI / 180;
    const a2  = arcTo   * Math.PI / 180;
    const arcR = R + 2;
    const sx = cx + Math.sin(a1) * arcR, sy = cy - Math.cos(a1) * arcR;
    const ex = cx + Math.sin(a2) * arcR, ey = cy - Math.cos(a2) * arcR;
    const lg  = span > 180 ? 1 : 0;
    arcPath = `<path d="M${sx.toFixed(1)},${sy.toFixed(1)} A${arcR},${arcR} 0 ${lg},1 ${ex.toFixed(1)},${ey.toFixed(1)}" class="arc-guide" fill="none" stroke-width="1"/>`;
  }

  const initAngle = valueToAngle(ctrl, initValue);
  const halfW     = ptrW / 2;
  const ptrPath   = `M ${cx} ${cy - R + 4} L ${cx - halfW} ${cy - R + 4 + ptrLen} L ${cx + halfW} ${cy - R + 4 + ptrLen} Z`;

  return `<svg class="knob-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-ctrl="${ctrl.id}" data-size="${large ? "large" : "small"}">
  <circle cx="${cx}" cy="${cy}" r="${R + 4}" class="knob-ring"/>
  ${arcPath}
  ${ticks}
  <circle cx="${cx}" cy="${cy}" r="${R}" class="knob-body"/>
  <g id="knob-indicator-${ctrl.id}" class="knob-indicator" style="transform:rotate(${initAngle}deg);transform-origin:${cx}px ${cy}px;transform-box:view-box">
    <path d="${ptrPath}" class="knob-pointer"/>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${large ? 11 : 7}" fill="#334155"/>
</svg>`;
}

function buildCounterHTML(ctrl, value) {
  const numDigits = ctrl.digits || String(ctrl.max).length;
  const padded = String(value).padStart(numDigits, '0');
  let cells = '';
  for (let i = 0; i < numDigits; i++) {
    cells += `<div class="counter-digit" id="counter-digit-${ctrl.id}-${i}">${padded[i]}</div>`;
  }
  const orientation = ctrl.orientation || "horizontal";
  return `<div class="counter-display counter-${orientation}" data-ctrl="${ctrl.id}">${cells}</div>`;
}

function setKnob(ctrl, value) {
  if (ctrl.type === "counter") {
    const numDigits = ctrl.digits || String(ctrl.max).length;
    const padded = String(value).padStart(numDigits, '0');
    for (let i = 0; i < numDigits; i++) {
      const el = document.getElementById(`counter-digit-${ctrl.id}-${i}`);
      if (el) el.textContent = padded[i];
    }
    currentValues[ctrl.id] = value;
    const valEl = document.getElementById("knob-value-" + ctrl.id);
    if (valEl) valEl.textContent = String(value);
    const dispEl = document.getElementById("values-display-" + ctrl.id);
    if (dispEl) dispEl.textContent = String(value);
    return;
  }

  const el = document.getElementById("knob-indicator-" + ctrl.id);
  if (!el) return;
  const cx    = ctrl.size === "large" ? 100 : 68;
  const cy    = ctrl.size === "large" ? 100 : 68;
  const angle = valueToAngle(ctrl, value);
  el.style.transform       = `rotate(${angle}deg)`;
  el.style.transformOrigin = `${cx}px ${cy}px`;
  currentValues[ctrl.id]   = value;

  const valEl = document.getElementById("knob-value-" + ctrl.id);
  if (valEl) valEl.textContent = String(value);
  const dispEl = document.getElementById("values-display-" + ctrl.id);
  if (dispEl) dispEl.textContent = String(value);
}

// ── Step knob by one increment (scroll wheel) ─
function stepKnob(ctrl, dir) {
  if (ctrl.type === "knob" || ctrl.type === "counter") {
    const next    = currentValues[ctrl.id] + dir * ctrl.step;
    const stepped = Math.round(next / ctrl.step) * ctrl.step;
    setKnob(ctrl, Math.max(ctrl.min, Math.min(ctrl.max, stepped)));
  } else {
    const idx    = ctrl.options.indexOf(String(currentValues[ctrl.id]));
    const newIdx = Math.max(0, Math.min(ctrl.options.length - 1, idx + dir));
    setKnob(ctrl, ctrl.options[newIdx]);
  }
  checkDirty();
}

// ── Drag interaction (vertical: up = increase) ─
function startDrag(e, ctrl) {
  e.preventDefault();
  const clientY    = e.touches ? e.touches[0].clientY : e.clientY;
  const startY     = clientY;
  const startValue = currentValues[ctrl.id];
  let hintDone = false;

  const onMove = (moveE) => {
    moveE.preventDefault();
    if (!hintDone) { dismissHint(); hintDone = true; }

    const y      = moveE.touches ? moveE.touches[0].clientY : moveE.clientY;
    const deltaY = startY - y;
    const fine   = moveE.shiftKey;

    if (ctrl.type === "knob" || ctrl.type === "counter") {
      const range   = ctrl.max - ctrl.min;
      const raw     = startValue + (deltaY / (fine ? 1000 : 200)) * range;
      const stepped = Math.round(raw / ctrl.step) * ctrl.step;
      setKnob(ctrl, Math.max(ctrl.min, Math.min(ctrl.max, stepped)));
    } else {
      const startIdx = ctrl.options.indexOf(String(startValue));
      const steps    = Math.round(deltaY / (fine ? 140 : 28));
      const newIdx   = Math.max(0, Math.min(ctrl.options.length - 1, startIdx + steps));
      setKnob(ctrl, ctrl.options[newIdx]);
    }
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup",   onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend",  onUp);
    checkDirty();
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup",   onUp);
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend",  onUp);
}

// ── Attach drag + scroll listeners to a knob ──
function attachKnobListeners(ctrl) {
  const el = ctrl.type === "counter"
    ? document.querySelector(`.counter-display[data-ctrl="${ctrl.id}"]`)
    : document.querySelector(`svg[data-ctrl="${ctrl.id}"]`);
  if (!el) return;
  el.addEventListener("mousedown",  e => startDrag(e, ctrl));
  el.addEventListener("touchstart", e => startDrag(e, ctrl), { passive: false });
  el.addEventListener("wheel", e => {
    e.preventDefault();
    stepKnob(ctrl, e.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  // Double-click (desktop)
  el.addEventListener("dblclick", e => { e.preventDefault(); openValueEntry(ctrl); });

  // Double-tap (mobile — two touchend within 300ms)
  let _lastTap = 0;
  el.addEventListener("touchend", e => {
    const now = Date.now();
    if (now - _lastTap < 300) { e.preventDefault(); openValueEntry(ctrl); }
    _lastTap = now;
  });
}

// ── Direct value entry (double-click / double-tap) ──
function openValueEntry(ctrl) {
  const overlay = document.getElementById("value-entry");
  const input   = document.getElementById("value-entry-input");
  const select  = document.getElementById("value-entry-select");
  const range   = document.getElementById("value-entry-range");

  document.getElementById("value-entry-label").textContent = ctrl.label;
  _valueEntryCtrl = ctrl;

  if (ctrl.type === "knob-labeled") {
    input.hidden  = true;
    range.hidden  = true;
    select.hidden = false;
    select.innerHTML = ctrl.options.map(o =>
      `<option value="${o}"${o === String(currentValues[ctrl.id]) ? " selected" : ""}>${o}</option>`
    ).join("");
    overlay.hidden = false;
    select.focus();
  } else {
    select.hidden = true;
    input.hidden  = false;
    range.hidden  = false;
    input.min     = ctrl.min;
    input.max     = ctrl.max;
    input.step    = ctrl.step;
    input.value   = currentValues[ctrl.id];
    range.textContent = `Range: ${ctrl.min} – ${ctrl.max}`;
    overlay.hidden = false;
    input.focus();
    input.select();
  }
}

function closeValueEntry(apply) {
  const overlay = document.getElementById("value-entry");
  const ctrl    = _valueEntryCtrl;
  _valueEntryCtrl = null;
  overlay.hidden  = true;

  if (!apply || !ctrl) return;

  if (ctrl.type === "knob-labeled") {
    const val = document.getElementById("value-entry-select").value;
    if (ctrl.options.includes(val)) { setKnob(ctrl, val); checkDirty(); }
  } else {
    const raw = parseFloat(document.getElementById("value-entry-input").value);
    if (!isNaN(raw)) {
      const stepped = Math.round(raw / ctrl.step) * ctrl.step;
      setKnob(ctrl, Math.max(ctrl.min, Math.min(ctrl.max, stepped)));
      checkDirty();
    }
  }
}

function initValueEntry() {
  const input  = document.getElementById("value-entry-input");
  const select = document.getElementById("value-entry-select");

  // mousedown on backdrop fires before input blur — cancel without applying
  document.getElementById("value-entry-backdrop").addEventListener("mousedown", e => {
    e.preventDefault();
    closeValueEntry(false);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter")  { e.preventDefault(); closeValueEntry(true); }
    if (e.key === "Escape") closeValueEntry(false);
  });
  input.addEventListener("blur", () => {
    if (!document.getElementById("value-entry").hidden) closeValueEntry(true);
  });

  select.addEventListener("change",  () => closeValueEntry(true));
  select.addEventListener("keydown", e => {
    if (e.key === "Escape") closeValueEntry(false);
  });
}
