// ── localStorage helpers ──────────────────────
function lsKey(model)      { return "transmatch_custom_" + model; }
function loadCustom(model) {
  try { return JSON.parse(localStorage.getItem(lsKey(model))) || []; }
  catch { return []; }
}
function saveCustom(model, arr) {
  localStorage.setItem(lsKey(model), JSON.stringify(arr));
}

// ── Shared table header builder ───────────────
function buildthead(trEl, firstCol) {
  const model   = tunerDB[currentModel];
  const isUser  = firstCol === "Name";
  const extraTh = isUser ? "<th>Antenna Model</th>" : "";
  trEl.innerHTML = `<th>${firstCol}</th>${extraTh}` +
    model.controls.map(c => `<th>${c.label}</th>`).join("") +
    "<th></th>";
}

// ── Antenna model datalist ────────────────────
function refreshAntennaDatalist() {
  const dl = document.getElementById("antenna-models-list");
  if (!dl) return;
  const saved  = loadCustom(currentModel).map(p => p.antennaModel).filter(Boolean);
  const merged = [...new Set([...antennaModels, ...saved])];
  dl.innerHTML = merged.map(m => `<option value="${m}">`).join("");
}

// ── Attach keyboard nav to a table row ───────
function addRowKeyNav(tr, loadFn) {
  tr.setAttribute("tabindex", "0");
  tr.addEventListener("keydown", e => {
    if (e.key === "Enter") { loadFn(); }
    if (e.key === "ArrowDown") { e.preventDefault(); tr.nextElementSibling?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); tr.previousElementSibling?.focus(); }
  });
}

// ── Factory Suggestions ───────────────────────
function renderSuggestions() {
  const model = tunerDB[currentModel];
  const thead = document.getElementById("suggestions-thead-row");
  const tbody = document.getElementById("suggestions-tbody");

  buildthead(thead, model.suggestionHeader || "MHz");
  tbody.innerHTML = "";

  (model.factorySuggestions || []).forEach(suggestion => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td class="col-first">${suggestion.freq}</td>` +
      model.controls.map(c => `<td>${suggestion[c.id] !== undefined ? suggestion[c.id] : "—"}</td>`).join("") +
      `<td></td>`;
    const loadThis = () => loadPreset(suggestion, tr, "suggestions");
    tr.addEventListener("click", loadThis);
    addRowKeyNav(tr, loadThis);
    tbody.appendChild(tr);
  });
}

// ── User Presets ──────────────────────────────
function renderUserPresets() {
  const model   = tunerDB[currentModel];
  const thead   = document.getElementById("presets-thead-row");
  const tbody   = document.getElementById("presets-tbody");
  const presets = loadCustom(currentModel);

  buildthead(thead, "Name");
  tbody.innerHTML = "";
  refreshAntennaDatalist();

  const emptyEl = document.getElementById("presets-empty");
  const tableEl = document.getElementById("presets-table");

  if (presets.length === 0) {
    if (emptyEl) emptyEl.style.display = "";
    if (tableEl) tableEl.style.display = "none";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
  if (tableEl) tableEl.style.display = "";

  presets.forEach((preset, idx) => {
    const tr = document.createElement("tr");
    const summary = model.controls
      .map(c => `${c.label}: ${preset[c.id] !== undefined ? preset[c.id] : "—"}`)
      .join(" · ");
    tr.innerHTML =
      `<td class="col-first">${preset.name}</td>` +
      `<td class="col-antenna">${preset.antennaModel || ""}</td>` +
      model.controls.map(c => `<td class="col-ctrl">${preset[c.id] !== undefined ? preset[c.id] : "—"}</td>`).join("") +
      `<td class="col-ctrl-summary">${summary}</td>` +
      `<td class="col-del"></td>`;

    const delCell = tr.querySelector(".col-del");
    const btn     = document.createElement("button");
    btn.className = "del-btn";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", "Delete preset");

    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (btn.dataset.confirm === "1") {
        const arr = loadCustom(currentModel);
        arr.splice(idx, 1);
        saveCustom(currentModel, arr);
        renderUserPresets();
      } else {
        btn.dataset.confirm = "1";
        btn.classList.add("del-confirm");
        btn.textContent = "Sure?";
        setTimeout(() => {
          if (btn.isConnected) {
            delete btn.dataset.confirm;
            btn.classList.remove("del-confirm");
            btn.textContent = "✕";
          }
        }, 2000);
      }
    });

    delCell.appendChild(btn);

    const loadThis = () => loadPreset(preset, tr, "presets", idx);
    tr.addEventListener("click", e => {
      if (e.target.closest(".del-btn")) return;
      loadThis();
    });
    addRowKeyNav(tr, loadThis);

    tbody.appendChild(tr);
  });
}

// ── Export all presets ────────────────────────
function exportPresets() {
  const models = {};
  Object.keys(tunerDB).forEach(model => {
    const arr = loadCustom(model);
    if (arr.length > 0) models[model] = arr;
  });
  if (Object.keys(models).length === 0) {
    showToast("No presets to export", "error");
    return;
  }
  const json = JSON.stringify({ version: 1, app: "transmatch", models }, null, 2);
  const a    = Object.assign(document.createElement("a"), {
    href:     URL.createObjectURL(new Blob([json], { type: "application/json" })),
    download: "transmatch-presets.json"
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Presets exported");
}

// ── Import from file ──────────────────────────
function importPresets(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.app !== "transmatch" || !data.models || typeof data.models !== "object") {
        showToast("Not a valid Transmatch preset file", "error");
        return;
      }
      let count = 0;
      Object.entries(data.models).forEach(([model, incoming]) => {
        if (!tunerDB[model] || !Array.isArray(incoming)) return;
        const existing = loadCustom(model);
        incoming.forEach(p => {
          if (p && typeof p.name === "string" && !existing.some(x => x.name === p.name)) {
            existing.push(p);
            count++;
          }
        });
        saveCustom(model, existing);
      });
      renderUserPresets();
      showToast(count > 0
        ? `Imported ${count} preset${count === 1 ? "" : "s"}`
        : "No new presets found (all names already exist)");
    } catch {
      showToast("Could not read preset file", "error");
    }
  };
  reader.readAsText(file);
}

document.getElementById("export-presets-btn").addEventListener("click", exportPresets);
document.getElementById("import-presets-btn").addEventListener("click", () => {
  document.getElementById("import-file-input").value = "";
  document.getElementById("import-file-input").click();
});
document.getElementById("import-file-input").addEventListener("change", e => {
  if (e.target.files[0]) importPresets(e.target.files[0]);
});

// ── Preset form expand/collapse (mobile) ─────
function expandPresetForm() {
  document.getElementById("add-preset-form").classList.add("form-open");
  const btn = document.getElementById("form-toggle-btn");
  if (btn) btn.setAttribute("aria-expanded", "true");
}

document.getElementById("form-toggle-btn").addEventListener("click", () => {
  const form   = document.getElementById("add-preset-form");
  const isOpen = form.classList.toggle("form-open");
  document.getElementById("form-toggle-btn").setAttribute("aria-expanded", String(isOpen));
});

// ── Add user preset ───────────────────────────
document.getElementById("add-preset-btn").addEventListener("click", () => {
  const name         = document.getElementById("preset-name-input").value.trim();
  const antennaModel = document.getElementById("preset-antenna-input").value.trim();
  if (!name) {
    showToast("Enter a name for this preset", "error");
    return;
  }
  const preset = { name, antennaModel };
  tunerDB[currentModel].controls.forEach(ctrl => {
    preset[ctrl.id] = currentValues[ctrl.id];
  });
  const arr = loadCustom(currentModel);
  arr.push(preset);
  saveCustom(currentModel, arr);
  document.getElementById("preset-name-input").value    = "";
  document.getElementById("preset-antenna-input").value = "";
  renderUserPresets();
  showToast("Preset saved");
});
