// ── Shared state ─────────────────────────────
let currentModel    = null;
let currentValues   = {};
let activePresetRow = null;

// Dirty-state tracking — set by loadPreset, read by checkDirty
let _loadedPresetValues = null;
let _loadedPresetSource = null;
let _loadedPresetIdx    = null;
let _loadedPresetLabel  = null;

function clearActiveRow() {
  if (activePresetRow) { activePresetRow.classList.remove("active"); activePresetRow = null; }
  _loadedPresetValues = null;
  _loadedPresetSource = null;
  _loadedPresetIdx    = null;
  _loadedPresetLabel  = null;
  const bar = document.getElementById("preset-mod-bar");
  if (bar) bar.classList.remove("visible");
}

// ── Theme toggle ─────────────────────────────
const _THEME_KEY = "transmatch_theme";
const _ICON_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const _ICON_SUN  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.innerHTML = dark ? _ICON_SUN : _ICON_MOON;
}

function initTheme() {
  const saved      = localStorage.getItem(_THEME_KEY);
  const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved === "dark" || (saved === null && preferDark));

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    localStorage.setItem(_THEME_KEY, dark ? "light" : "dark");
    applyTheme(!dark);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (!localStorage.getItem(_THEME_KEY)) applyTheme(e.matches);
  });
}

// ── Toast notifications ───────────────────────
let _toastTimer = null;
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(_toastTimer);
  toast.textContent = message;
  toast.className = `visible ${type}`;
  _toastTimer = setTimeout(() => { toast.className = ""; }, 2500);
}

// ── Interaction hint (dismisses after first drag) ─
function initHint() {
  const hint = document.getElementById("knob-hint");
  if (hint && localStorage.getItem("transmatch_hintSeen")) hint.style.display = "none";
}
function dismissHint() {
  const hint = document.getElementById("knob-hint");
  if (!hint || hint.style.display === "none") return;
  hint.style.display = "none";
  localStorage.setItem("transmatch_hintSeen", "1");
}

// ── Tab switching ─────────────────────────────
function activateTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
}

// ── Mobile drawer (≤599px) ───────────────────
function initMobileDrawer() {
  const panel    = document.getElementById("right-panel");
  const backdrop = document.getElementById("mobile-backdrop");

  function openDrawer(tab) {
    activateTab(tab);
    panel.classList.add("drawer-open");
    backdrop.classList.add("visible");
    document.querySelectorAll(".mobile-tab-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === tab));
  }

  function closeDrawer() {
    panel.classList.remove("drawer-open");
    backdrop.classList.remove("visible");
    document.querySelectorAll(".mobile-tab-btn").forEach(b => b.classList.remove("active"));
  }

  document.querySelectorAll(".mobile-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const isOpen    = panel.classList.contains("drawer-open");
      const isSameTab = document.getElementById("tab-" + btn.dataset.tab)?.classList.contains("active");
      (isOpen && isSameTab) ? closeDrawer() : openDrawer(btn.dataset.tab);
    });
  });

  document.getElementById("drawer-close-btn")?.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
}

// ── Session persistence ───────────────────────
const _SESSION_KEY = "transmatch_session";

function saveSession() {
  try {
    localStorage.setItem(_SESSION_KEY, JSON.stringify({
      model:  currentModel,
      values: Object.assign({}, currentValues)
    }));
  } catch {}
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(_SESSION_KEY)) || {}; }
  catch { return {}; }
}

// ── Dirty-state detection ─────────────────────
function checkDirty() {
  saveSession();

  const bar = document.getElementById("preset-mod-bar");
  if (!bar || !_loadedPresetValues) return;

  const dirty = tunerDB[currentModel].controls.some(ctrl =>
    String(currentValues[ctrl.id]) !== String(_loadedPresetValues[ctrl.id])
  );

  const mobileBtn = document.querySelector('.mobile-tab-btn[data-tab="presets"]');
  if (mobileBtn) mobileBtn.classList.toggle("has-badge", dirty);

  if (dirty) {
    document.getElementById("mod-preset-name").textContent = _loadedPresetLabel;
    const upd = document.getElementById("mod-update-btn");
    if (upd) upd.style.display = _loadedPresetSource === "presets" ? "" : "none";
    bar.classList.add("visible");
  } else {
    bar.classList.remove("visible");
  }
}

// ── Modification bar actions ──────────────────
function initModBar() {
  document.getElementById("mod-update-btn").addEventListener("click", () => {
    if (_loadedPresetSource !== "presets" || _loadedPresetIdx === null) return;
    const arr = loadCustom(currentModel);
    tunerDB[currentModel].controls.forEach(ctrl => {
      arr[_loadedPresetIdx][ctrl.id] = currentValues[ctrl.id];
    });
    saveCustom(currentModel, arr);
    _loadedPresetValues = Object.assign({}, currentValues);
    checkDirty();
    renderUserPresets();
    showToast("Preset updated");
  });

  document.getElementById("mod-save-new-btn").addEventListener("click", () => {
    activateTab("presets");
    const inp = document.getElementById("preset-name-input");
    inp.value = _loadedPresetSource === "presets"
      ? `${_loadedPresetLabel} (copy)`
      : _loadedPresetLabel;
    inp.focus();
    inp.select();
  });

  document.getElementById("mod-revert-btn").addEventListener("click", () => {
    if (!_loadedPresetValues) return;
    tunerDB[currentModel].controls.forEach(ctrl => setKnob(ctrl, _loadedPresetValues[ctrl.id]));
    checkDirty();
  });
}

// ── Load a preset onto the knobs ─────────────
function loadPreset(preset, rowEl, source, idx) {
  tunerDB[currentModel].controls.forEach(ctrl => {
    if (preset[ctrl.id] !== undefined) setKnob(ctrl, preset[ctrl.id]);
  });
  if (activePresetRow) activePresetRow.classList.remove("active");
  if (rowEl) { rowEl.classList.add("active"); activePresetRow = rowEl; }

  _loadedPresetValues = Object.assign({}, currentValues);
  _loadedPresetSource = source || null;
  _loadedPresetIdx    = idx !== undefined ? idx : null;
  _loadedPresetLabel  = source === "suggestions"
    ? (typeof preset.freq === "number" ? `${preset.freq} MHz` : preset.freq)
    : (preset.name || "Preset");
  checkDirty();
}

// ── Render the device face for a model ───────
function renderModel(modelName) {
  clearActiveRow();
  currentModel  = modelName;
  currentValues = {};

  const model = tunerDB[modelName];
  const face  = document.getElementById("device-face");
  face.innerHTML = "";

  const labelEl = document.getElementById("device-label");
  if (labelEl) labelEl.textContent = modelName;

  const firstPreset = (model.factorySuggestions || [])[0] || {};

  model.controls.forEach(ctrl => {
    const initVal = firstPreset[ctrl.id] !== undefined
      ? firstPreset[ctrl.id]
      : (ctrl.type === "knob" || ctrl.type === "counter" ? ctrl.min : ctrl.options[0]);

    currentValues[ctrl.id] = initVal;

    const col = document.createElement("div");
    col.className = "control-col";

    const valSpan = `<span class="knob-value" id="knob-value-${ctrl.id}">${initVal}</span>`;

    if (ctrl.type === "counter") {
      const inner = `<div class="control-label">${ctrl.label}</div>${buildCounterHTML(ctrl, initVal)}${valSpan}`;
      col.innerHTML = ctrl.boxed ? `<div class="knob-box">${inner}</div>` : inner;
    } else if (ctrl.boxed) {
      col.innerHTML = `<div class="knob-box">
        <div class="control-label">${ctrl.label}</div>
        ${buildKnobSVG(ctrl, initVal)}
        ${valSpan}
      </div>`;
    } else {
      col.innerHTML =
        `<div class="control-label">${ctrl.label}</div>` +
        buildKnobSVG(ctrl, initVal) +
        valSpan;
    }

    face.appendChild(col);
    attachKnobListeners(ctrl);
  });

  renderSuggestions();
  renderUserPresets();
  renderValuesPanel();

  const firstRow = document.querySelector("#suggestions-tbody tr");
  if (firstRow) firstRow.click();
}

// ── Current-values readout panel ─────────────
function renderValuesPanel() {
  const el = document.getElementById("device-values");
  if (!el) return;
  el.innerHTML = tunerDB[currentModel].controls.map(ctrl =>
    `<div class="val-item">
      <span class="val-label">${ctrl.label}</span>
      <span class="val-value" id="values-display-${ctrl.id}">${currentValues[ctrl.id]}</span>
    </div>`
  ).join("");
}

// ── Bootstrap ────────────────────────────────
function init() {
  const sel     = document.getElementById("model-select");
  const session = loadSession();

  Object.keys(tunerDB).forEach(name => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = name;
    sel.appendChild(opt);
  });

  if (session.model && tunerDB[session.model]) sel.value = session.model;

  sel.addEventListener("change", () => renderModel(sel.value));
  initTheme();
  initTabs();
  initMobileDrawer();
  initHint();
  initModBar();
  renderModel(sel.value);

  if (session.model === currentModel && session.values) {
    tunerDB[currentModel].controls.forEach(ctrl => {
      const v = session.values[ctrl.id];
      if (v !== undefined) setKnob(ctrl, v);
    });
    checkDirty();
  }
}

init();
