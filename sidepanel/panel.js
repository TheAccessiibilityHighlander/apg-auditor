// Panel script — all UI logic, state management, and chrome.runtime messaging

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  components: [],
  findings: [],
  scanMeta: { url: '', date: '' },
  settings: { apiKey: '', autoScan: false },
  axeFilter: null, // 'violations' | 'incomplete' | 'passes' | null
};

// ── WCAG Criteria Dataset ────────────────────────────────────────────────────

const WCAG_CRITERIA = [
  { code: '1.1.1', name: 'Non-text Content', level: 'A' },
  { code: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A' },
  { code: '1.2.2', name: 'Captions (Prerecorded)', level: 'A' },
  { code: '1.2.3', name: 'Audio Description or Media Alternative (Prerecorded)', level: 'A' },
  { code: '1.2.4', name: 'Captions (Live)', level: 'AA' },
  { code: '1.2.5', name: 'Audio Description (Prerecorded)', level: 'AA' },
  { code: '1.3.1', name: 'Info and Relationships', level: 'A' },
  { code: '1.3.2', name: 'Meaningful Sequence', level: 'A' },
  { code: '1.3.3', name: 'Sensory Characteristics', level: 'A' },
  { code: '1.3.4', name: 'Orientation', level: 'AA' },
  { code: '1.3.5', name: 'Identify Input Purpose', level: 'AA' },
  { code: '1.4.1', name: 'Use of Color', level: 'A' },
  { code: '1.4.2', name: 'Audio Control', level: 'A' },
  { code: '1.4.3', name: 'Contrast (Minimum)', level: 'AA' },
  { code: '1.4.4', name: 'Resize Text', level: 'AA' },
  { code: '1.4.5', name: 'Images of Text', level: 'AA' },
  { code: '1.4.6', name: 'Contrast (Enhanced)', level: 'AAA' },
  { code: '1.4.10', name: 'Reflow', level: 'AA' },
  { code: '1.4.11', name: 'Non-text Contrast', level: 'AA' },
  { code: '1.4.12', name: 'Text Spacing', level: 'AA' },
  { code: '1.4.13', name: 'Content on Hover or Focus', level: 'AA' },
  { code: '2.1.1', name: 'Keyboard', level: 'A' },
  { code: '2.1.2', name: 'No Keyboard Trap', level: 'A' },
  { code: '2.1.3', name: 'Keyboard (No Exception)', level: 'AAA' },
  { code: '2.1.4', name: 'Character Key Shortcuts', level: 'A' },
  { code: '2.2.1', name: 'Timing Adjustable', level: 'A' },
  { code: '2.2.2', name: 'Pause, Stop, Hide', level: 'A' },
  { code: '2.3.1', name: 'Three Flashes or Below Threshold', level: 'A' },
  { code: '2.4.1', name: 'Bypass Blocks', level: 'A' },
  { code: '2.4.2', name: 'Page Titled', level: 'A' },
  { code: '2.4.3', name: 'Focus Order', level: 'A' },
  { code: '2.4.4', name: 'Link Purpose (In Context)', level: 'A' },
  { code: '2.4.5', name: 'Multiple Ways', level: 'AA' },
  { code: '2.4.6', name: 'Headings and Labels', level: 'AA' },
  { code: '2.4.7', name: 'Focus Visible', level: 'AA' },
  { code: '2.4.11', name: 'Focus Appearance', level: 'AA' },
  { code: '2.5.1', name: 'Pointer Gestures', level: 'A' },
  { code: '2.5.2', name: 'Pointer Cancellation', level: 'A' },
  { code: '2.5.3', name: 'Label in Name', level: 'A' },
  { code: '2.5.4', name: 'Motion Actuation', level: 'A' },
  { code: '2.5.7', name: 'Dragging Movements', level: 'AA' },
  { code: '2.5.8', name: 'Target Size (Minimum)', level: 'AA' },
  { code: '3.1.1', name: 'Language of Page', level: 'A' },
  { code: '3.1.2', name: 'Language of Parts', level: 'AA' },
  { code: '3.2.1', name: 'On Focus', level: 'A' },
  { code: '3.2.2', name: 'On Input', level: 'A' },
  { code: '3.2.3', name: 'Consistent Navigation', level: 'AA' },
  { code: '3.2.4', name: 'Consistent Identification', level: 'AA' },
  { code: '3.3.1', name: 'Error Identification', level: 'A' },
  { code: '3.3.2', name: 'Labels or Instructions', level: 'A' },
  { code: '3.3.3', name: 'Error Suggestion', level: 'AA' },
  { code: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', level: 'AA' },
  { code: '4.1.1', name: 'Parsing', level: 'A' },
  { code: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  { code: '4.1.3', name: 'Status Messages', level: 'AA' },
];

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupSettings();
  setupFindingForm();
  setupExport();
  setupScan();
  setupMessageListener();
  await loadSettings();
  await loadFindings();
  updateFindingsBadge();
  updateExportCount();
});

// ── Message listener (from content script via service worker) ─────────────────

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((msg) => {
    console.log('[APG] Panel received message:', msg.type, msg);
    if (msg.source !== 'content') return;

    switch (msg.type) {
      case 'SCAN_STATUS':
        setScanStatus(msg.message, msg.status === 'running' ? 'running' : '');
        break;
      case 'SCAN_COMPLETE':
        handleScanComplete(msg);
        break;
      case 'SCAN_ERROR':
        setScanStatus(`Error: ${msg.message}`, 'error');
        document.getElementById('scanBtn').disabled = false;
        break;
    }
  });
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `view-${view}`);
      });
    });
  });
}

// ── Focus trap utility ────────────────────────────────────────────────────────

function openDialog(overlay, triggerEl) {
  overlay.classList.remove('hidden');
  const focusable = getFocusable(overlay);
  if (focusable.length) focusable[0].focus();
  overlay._trigger = triggerEl;

  function onKeydown(e) {
    if (e.key === 'Escape') { closeDialog(overlay); return; }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(overlay);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  overlay._keydownHandler = onKeydown;
  overlay.addEventListener('keydown', onKeydown);
}

function closeDialog(overlay) {
  overlay.classList.add('hidden');
  overlay.removeEventListener('keydown', overlay._keydownHandler);
  overlay._trigger?.focus();
}

function getFocusable(el) {
  return Array.from(el.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
}

// ── Settings ─────────────────────────────────────────────────────────────────

function setupSettings() {
  const overlay = document.getElementById('settingsOverlay');
  const btn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettingsBtn');
  const saveBtn = document.getElementById('saveSettingsBtn');
  const toggleBtn = document.getElementById('toggleApiKey');
  const input = document.getElementById('apiKeyInput');

  btn.addEventListener('click', () => openDialog(overlay, btn));
  closeBtn.addEventListener('click', () => closeDialog(overlay));

  toggleBtn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.textContent = 'Hide';
    } else {
      input.type = 'password';
      toggleBtn.textContent = 'Show';
    }
  });

  saveBtn.addEventListener('click', async () => {
    const apiKey = input.value.trim();
    const autoScan = document.getElementById('autoScanToggle').checked;
    const status = document.getElementById('saveStatus');

    chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      payload: { apiKey, autoScan },
    }, (res) => {
      if (res?.ok) {
        state.settings = { apiKey, autoScan };
        status.textContent = 'Saved!';
        status.className = 'save-status ok';
        setTimeout(() => { status.textContent = ''; status.className = 'save-status'; }, 2000);
      } else {
        status.textContent = 'Save failed';
        status.className = 'save-status err';
      }
    });
  });
}

async function loadSettings() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (res?.settings) {
        state.settings = res.settings;
        document.getElementById('apiKeyInput').value = res.settings.apiKey || '';
        document.getElementById('autoScanToggle').checked = !!res.settings.autoScan;
      }
      resolve();
    });
  });
}

// ── Scan ─────────────────────────────────────────────────────────────────────

function setupScan() {
  document.getElementById('scanBtn').addEventListener('click', startScan);
  document.getElementById('componentFilter').addEventListener('input', renderComponents);
  document.getElementById('categoryFilter').addEventListener('change', renderComponents);

  ['axeViolations', 'axeIncomplete', 'axePasses'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('click', () => {
      const key = id === 'axeViolations' ? 'violations' : id === 'axeIncomplete' ? 'incomplete' : 'passes';
      state.axeFilter = state.axeFilter === key ? null : key;
      updateAxeStatActiveState();
      renderComponents();
    });
  });
}

function updateAxeStatActiveState() {
  const map = { axeViolations: 'violations', axeIncomplete: 'incomplete', axePasses: 'passes' };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    const active = state.axeFilter === key;
    el.classList.toggle('active', active);
    el.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

async function startScan() {
  const btn = document.getElementById('scanBtn');
  btn.disabled = true;
  setScanStatus('Injecting scanner…', 'running');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setScanStatus('No active tab found', 'error');
    btn.disabled = false;
    return;
  }

  state.scanMeta.url = tab.url || '';
  state.scanMeta.date = new Date().toISOString();
  document.getElementById('metaUrl').textContent = state.scanMeta.url;
  document.getElementById('metaDate').textContent = new Date().toLocaleString();

  console.log('[APG] Sending SCAN_PAGE to background, tabId:', tab.id);

  // Route through background so axe.min.js is injected first
  chrome.runtime.sendMessage({ type: 'SCAN_PAGE', tabId: tab.id }, (res) => {
    console.log('[APG] SCAN_PAGE response from background:', res);
    if (chrome.runtime.lastError) {
      console.error('[APG] runtime.lastError:', chrome.runtime.lastError.message);
      setScanStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      btn.disabled = false;
      return;
    }
    if (res?.error) {
      setScanStatus(`Error: ${res.error}`, 'error');
      btn.disabled = false;
    }
  });
}

function handleScanComplete(msg) {
  state.components = msg.components || [];
  document.getElementById('scanBtn').disabled = false;
  setScanStatus(`Found ${state.components.length} components`, '');

  // Update axe summary
  const s = msg.axeSummary;
  if (s) {
    document.getElementById('axeSummary').classList.remove('hidden');
    document.getElementById('axeViolations').querySelector('.stat-num').textContent = s.violations;
    document.getElementById('axeIncomplete').querySelector('.stat-num').textContent = s.incomplete;
    document.getElementById('axePasses').querySelector('.stat-num').textContent = s.passes;
    state.axeFilter = null;
    updateAxeStatActiveState();
  }

  document.getElementById('filterBar').classList.remove('hidden');
  renderComponents();
}

function setScanStatus(text, cls) {
  const el = document.getElementById('scanStatus');
  el.textContent = text;
  el.className = 'scan-status' + (cls ? ` ${cls}` : '');
}

// ── Component list rendering ─────────────────────────────────────────────────

function renderComponents() {
  const filterText = document.getElementById('componentFilter').value.toLowerCase();
  const filterCat = document.getElementById('categoryFilter').value;
  const list = document.getElementById('componentList');
  const empty = document.getElementById('emptyState');

  const filtered = state.components.filter(c => {
    if (filterCat && c.category !== filterCat) return false;
    if (filterText) {
      const haystack = `${c.componentType} ${c.accessibleName} ${c.tagName} ${c.role || ''}`.toLowerCase();
      if (!haystack.includes(filterText)) return false;
    }
    if (state.axeFilter === 'violations' && !c.axeViolations?.length) return false;
    if (state.axeFilter === 'incomplete' && !c.axeIncomplete?.length) return false;
    if (state.axeFilter === 'passes' && (c.axeViolations?.length || c.axeIncomplete?.length)) return false;
    return true;
  });

  if (filtered.length === 0) {
    empty.style.display = 'flex';
    // Remove existing items
    list.querySelectorAll('.component-item').forEach(el => el.remove());
    return;
  }

  empty.style.display = 'none';

  // Remove existing items then re-render (simple approach for now)
  list.querySelectorAll('.component-item').forEach(el => el.remove());

  filtered.forEach(comp => {
    list.appendChild(buildComponentItem(comp));
  });
}

function buildComponentItem(comp) {
  const item = document.createElement('div');
  item.className = 'component-item';
  item.dataset.id = comp.id;

  const iconLabel = comp.tagName.substring(0, 3).toUpperCase();
  const hasViolations = comp.axeViolations?.length > 0;

  item.innerHTML = `
    <div class="component-header" role="button" tabindex="0" aria-expanded="false">
      <div class="component-icon cat-${comp.category}">${iconLabel}</div>
      <div class="component-info">
        <div class="component-type">${esc(comp.componentType)}</div>
        <div class="component-name">${esc(comp.accessibleName || comp.tagName)}</div>
      </div>
      <div class="component-actions">
        ${hasViolations ? '<div class="violation-dot" title="Has axe violations"></div>' : ''}
        <svg class="component-expand" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>
    <div class="component-detail">
      ${buildDetailHTML(comp)}
    </div>
  `;

  const header = item.querySelector('.component-header');
  header.addEventListener('click', () => toggleComponent(item, header));
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleComponent(item, header); }
  });

  // Wire up buttons inside detail
  item.querySelector('.btn-apg')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openApgOverlay(comp, e.currentTarget);
  });

  item.querySelector('.btn-log')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openFindingForm(
      { element: comp.componentType + (comp.accessibleName ? ` — "${comp.accessibleName}"` : '') },
      e.currentTarget
    );
  });

  return item;
}

function buildDetailHTML(comp) {
  const ariaEntries = Object.entries(comp.ariaAttrs || {});

  const renderViolations = (list) => list.map(v => `
    <div class="violation-item">
      <div class="violation-item-inner">
        <div class="violation-top">
          <span class="impact-badge impact-${v.impact}">${esc(v.impact)}</span>
          <span class="violation-rule">${esc(v.id)}</span>
          ${v.helpUrl ? `<a class="violation-link" href="${esc(v.helpUrl)}" target="_blank" rel="noopener" aria-label="axe docs for ${esc(v.id)}">docs ↗</a>` : ''}
        </div>
        <div class="violation-help">${esc(v.help)}</div>
        ${v.failureSummary ? `<div class="violation-summary">${esc(v.failureSummary.replace(/^Fix (any|all|one) of the following:\n?/i, '').trim())}</div>` : ''}
        ${v.html ? `<pre class="violation-html">${esc(v.html)}</pre>` : ''}
      </div>
    </div>`).join('');

  const violationsHTML = comp.axeViolations?.length > 0
    ? renderViolations(comp.axeViolations)
    : '<div style="color:var(--text2);font-size:12px">No axe violations detected</div>';

  return `
    <div class="detail-section">
      <div class="detail-title">Element</div>
      <div class="detail-row"><span class="detail-key">Tag</span><span class="detail-val">&lt;${esc(comp.tagName)}&gt;</span></div>
      <div class="detail-row"><span class="detail-key">Role</span><span class="detail-val">${esc(comp.role || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Accessible name</span><span class="detail-val">${esc(comp.accessibleName || '⚠ None')}</span></div>
    </div>
    ${ariaEntries.length > 0 ? `
    <div class="detail-section">
      <div class="detail-title">ARIA Attributes</div>
      <div class="attr-list">
        ${ariaEntries.map(([k, v]) => `<span class="attr-chip">${esc(k)}="${esc(v)}"</span>`).join('')}
      </div>
    </div>` : ''}
    <div class="detail-section">
      <div class="detail-title">axe-core Violations</div>
      <div class="violation-list">${violationsHTML}</div>
    </div>
    ${comp.axeIncomplete?.length ? `
    <div class="detail-section">
      <div class="detail-title">Needs Review</div>
      <div class="violation-list">${renderViolations(comp.axeIncomplete)}</div>
    </div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-ghost btn-sm btn-apg">APG Pattern ↗</button>
      <button class="btn btn-ghost btn-sm btn-log">Log Finding</button>
    </div>
  `;
}

function toggleComponent(item, header) {
  const isOpen = item.classList.toggle('open');
  header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// ── APG Overlay ───────────────────────────────────────────────────────────────

async function openApgOverlay(comp, triggerEl) {
  const overlay = document.getElementById('apgOverlay');
  const body = document.getElementById('apgBody');

  body.innerHTML = '<div class="spinner" aria-label="Loading APG data…"></div>';
  openDialog(overlay, triggerEl);

  if (!state.settings.apiKey) {
    body.innerHTML = `<div style="color:var(--yellow);font-size:13px">⚠ No API key configured. Open Settings to add your Claude API key.</div>`;
    return;
  }

  chrome.runtime.sendMessage({
    type: 'CLAUDE_APG_LOOKUP',
    payload: {
      componentType: comp.componentType,
      role: comp.role,
      tagName: comp.tagName,
      attributes: comp.ariaAttrs,
      context: comp.accessibleName,
    },
  }, (res) => {
    if (res?.error) {
      body.innerHTML = `<div style="color:var(--red);font-size:13px">Error: ${esc(res.error)}</div>`;
      return;
    }
    body.innerHTML = buildApgHTML(res.result);

    // Cache result on the component
    const idx = state.components.findIndex(c => c.id === comp.id);
    if (idx !== -1) state.components[idx].apgData = res.result;
  });

  document.getElementById('closeApgBtn').onclick = () => closeDialog(overlay);
}

function buildApgHTML(data) {
  if (!data || data.error) {
    return `<div style="color:var(--red)">Could not retrieve APG data: ${esc(data?.raw || data?.error || 'Unknown error')}</div>`;
  }

  const kb = (data.keyboardInteractions || []).map(k => `<li>${esc(k)}</li>`).join('');
  const roles = (data.requiredRoles || []).map(r => `<span class="apg-chip">${esc(r)}</span>`).join('');
  const attrs = (data.requiredAttributes || []).map(a => `<span class="apg-chip">${esc(a)}</span>`).join('');
  const states = (data.requiredStates || []).map(s => `<span class="apg-chip">${esc(s)}</span>`).join('');
  const failures = (data.commonFailures || []).map((f, i) => `
    <div class="failure-item">
      <span class="failure-num">${i + 1}</span>
      <span>${esc(f)}</span>
    </div>`).join('');

  return `
    <div class="apg-pattern-name">${esc(data.patternName || 'Unknown Pattern')}</div>
    <div class="apg-pattern-url">
      <a href="${esc(data.patternUrl || 'https://www.w3.org/WAI/ARIA/apg/')}" target="_blank" rel="noopener">
        View in APG ↗
      </a>
    </div>

    ${kb ? `
    <div class="apg-section">
      <div class="apg-section-header">Keyboard Interactions</div>
      <div class="apg-section-body"><ul class="apg-list">${kb}</ul></div>
    </div>` : ''}

    ${(roles || attrs || states) ? `
    <div class="apg-section">
      <div class="apg-section-header">Required ARIA</div>
      ${roles ? `<div style="padding:6px 12px 0;font-size:11px;color:var(--text3)">Roles</div><div class="apg-chips">${roles}</div>` : ''}
      ${attrs ? `<div style="padding:6px 12px 0;font-size:11px;color:var(--text3)">Attributes</div><div class="apg-chips">${attrs}</div>` : ''}
      ${states ? `<div style="padding:6px 12px 0;font-size:11px;color:var(--text3)">States</div><div class="apg-chips">${states}</div>` : ''}
    </div>` : ''}

    ${failures ? `
    <div class="apg-section">
      <div class="apg-section-header">Common Failures</div>
      ${failures}
    </div>` : ''}
  `;
}

// ── Finding Form ─────────────────────────────────────────────────────────────

function setupFindingForm() {
  document.getElementById('addFindingBtn').addEventListener('click', () => openFindingForm());
  document.getElementById('closeFindingBtn').addEventListener('click', closeFindingForm);
  document.getElementById('cancelFindingBtn').addEventListener('click', closeFindingForm);
  document.getElementById('findingOverlay').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFindingForm();
  });
  document.getElementById('saveFindingBtn').addEventListener('click', saveFinding);
  document.getElementById('findingFilter').addEventListener('input', renderFindings);

  // WCAG searchable dropdown
  const input = document.getElementById('findingWcag');
  const dropdown = document.getElementById('wcagDropdown');

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'wcagDropdown');

  input.addEventListener('focus', () => showWcagDropdown(input.value));
  input.addEventListener('input', () => showWcagDropdown(input.value));

  input.addEventListener('keydown', (e) => {
    const opts = [...dropdown.querySelectorAll('.wcag-option')];
    const cur = dropdown.querySelector('[aria-selected="true"]');
    const idx = opts.indexOf(cur);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = opts[idx + 1] || opts[0];
      setWcagActive(opts, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = opts[idx - 1] || opts[opts.length - 1];
      setWcagActive(opts, prev);
    } else if (e.key === 'Enter' && cur) {
      e.preventDefault();
      cur.click();
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.select-search-wrap')) {
      dropdown.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

function openFindingForm(prefill = {}, triggerEl = null) {
  const overlay = document.getElementById('findingOverlay');
  document.getElementById('findingId').value = prefill.id || '';
  document.getElementById('findingElement').value = prefill.element || '';
  document.getElementById('findingWcag').value = prefill.wcag || '';
  document.getElementById('findingWcagCode').value = prefill.wcagCode || '';
  document.getElementById('findingLevel').value = prefill.level || 'AA';
  document.getElementById('findingSeverity').value = prefill.severity || 'moderate';
  document.getElementById('findingStatus').value = prefill.status || 'fail';
  document.getElementById('findingFrequency').value = prefill.frequency || 1;
  document.getElementById('findingNotes').value = prefill.notes || '';
  openDialog(overlay, triggerEl || document.getElementById('addFindingBtn'));
}

function closeFindingForm() {
  closeDialog(document.getElementById('findingOverlay'));
}

function saveFinding() {
  const id = document.getElementById('findingId').value || `f-${Date.now()}`;
  const finding = {
    id,
    element: document.getElementById('findingElement').value.trim(),
    wcag: document.getElementById('findingWcag').value.trim(),
    wcagCode: document.getElementById('findingWcagCode').value,
    level: document.getElementById('findingLevel').value,
    severity: document.getElementById('findingSeverity').value,
    status: document.getElementById('findingStatus').value,
    frequency: parseInt(document.getElementById('findingFrequency').value) || 1,
    notes: document.getElementById('findingNotes').value.trim(),
    createdAt: new Date().toISOString(),
  };

  const existing = state.findings.findIndex(f => f.id === id);
  if (existing >= 0) {
    state.findings[existing] = finding;
  } else {
    state.findings.push(finding);
  }

  persistFindings();
  closeFindingForm();
  renderFindings();
  updateFindingsBadge();
  updateExportCount();
}

function deleteFinding(id) {
  state.findings = state.findings.filter(f => f.id !== id);
  persistFindings();
  renderFindings();
  updateFindingsBadge();
  updateExportCount();
}

// ── WCAG Dropdown ─────────────────────────────────────────────────────────────

function showWcagDropdown(query) {
  const input = document.getElementById('findingWcag');
  const dropdown = document.getElementById('wcagDropdown');
  const q = query.toLowerCase();

  const matches = q
    ? WCAG_CRITERIA.filter(c =>
        c.code.includes(q) || c.name.toLowerCase().includes(q) || c.level.toLowerCase() === q
      )
    : WCAG_CRITERIA;

  if (matches.length === 0) {
    dropdown.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    return;
  }

  dropdown.innerHTML = matches.slice(0, 20).map(c => `
    <div class="wcag-option" role="option" aria-selected="false" data-code="${c.code}" data-name="${esc(c.name)}" data-level="${c.level}">
      <span class="wcag-option-code">${c.code}</span>
      <span class="wcag-option-name">${esc(c.name)}</span>
      <span style="color:var(--text3);margin-left:4px;font-size:10px">${c.level}</span>
    </div>`).join('');

  dropdown.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');

  dropdown.querySelectorAll('.wcag-option').forEach(opt => {
    opt.addEventListener('click', () => selectWcagOption(opt));
  });
}

function setWcagActive(opts, target) {
  opts.forEach(o => o.setAttribute('aria-selected', 'false'));
  target.setAttribute('aria-selected', 'true');
  target.scrollIntoView({ block: 'nearest' });
  document.getElementById('findingWcag').setAttribute('aria-activedescendant', target.id || '');
}

function selectWcagOption(opt) {
  const input = document.getElementById('findingWcag');
  const dropdown = document.getElementById('wcagDropdown');
  input.value = `${opt.dataset.code} — ${opt.dataset.name}`;
  document.getElementById('findingWcagCode').value = opt.dataset.code;
  document.getElementById('findingLevel').value = opt.dataset.level;
  dropdown.classList.add('hidden');
  input.setAttribute('aria-expanded', 'false');
}

// ── Findings Rendering ───────────────────────────────────────────────────────

function renderFindings() {
  const list = document.getElementById('findingsList');
  const filterText = document.getElementById('findingFilter').value.toLowerCase();

  const filtered = filterText
    ? state.findings.filter(f =>
        `${f.element} ${f.wcag} ${f.notes} ${f.severity}`.toLowerCase().includes(filterText))
    : state.findings;

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>No findings logged yet</p>
      </div>`;
    return;
  }

  filtered.forEach(f => {
    const item = document.createElement('div');
    item.className = 'finding-item';
    item.innerHTML = `
      <div class="finding-top">
        <div class="finding-badges">
          <span class="severity-badge sev-${f.severity}">${f.severity}</span>
          <span class="status-badge status-${f.status}">${f.status}</span>
        </div>
        <div class="finding-element">${esc(f.element || 'Unnamed')}</div>
      </div>
      <div class="finding-meta">
        ${f.wcag ? `<span>${esc(f.wcag)}</span>` : ''}
        <span>Level ${esc(f.level)}</span>
        ${f.frequency > 1 ? `<span>×${f.frequency}</span>` : ''}
      </div>
      ${f.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:4px;line-height:1.4">${esc(f.notes)}</div>` : ''}
      <div class="finding-actions">
        <button class="btn btn-ghost btn-sm btn-edit" data-id="${f.id}">Edit</button>
        <button class="btn btn-danger btn-sm btn-delete" data-id="${f.id}">Delete</button>
      </div>
    `;

    item.querySelector('.btn-edit').addEventListener('click', () => {
      const finding = state.findings.find(fn => fn.id === f.id);
      if (finding) openFindingForm(finding);
    });

    item.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Delete finding: "${f.element}"?`)) deleteFinding(f.id);
    });

    list.appendChild(item);
  });
}

// ── Findings Persistence ──────────────────────────────────────────────────────

function persistFindings() {
  chrome.storage.local.set({ findings: state.findings });
}

async function loadFindings() {
  return new Promise(resolve => {
    chrome.storage.local.get('findings', (data) => {
      state.findings = data.findings || [];
      renderFindings();
      resolve();
    });
  });
}

function updateFindingsBadge() {
  const badge = document.getElementById('findingsBadge');
  const count = state.findings.length;
  badge.textContent = count;
  badge.hidden = count === 0;
}

// ── Export ────────────────────────────────────────────────────────────────────

function setupExport() {
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('exportJSON').addEventListener('click', exportJSON);
}

function updateExportCount() {
  document.getElementById('exportCount').textContent =
    `${state.findings.length} finding${state.findings.length !== 1 ? 's' : ''} logged`;
}

function getExportMeta() {
  return {
    url: state.scanMeta.url || document.getElementById('metaUrl').textContent,
    date: state.scanMeta.date || new Date().toISOString(),
    auditor: document.getElementById('metaAuditor').value.trim(),
  };
}

function exportCSV() {
  if (state.findings.length === 0) { alert('No findings to export.'); return; }

  const meta = getExportMeta();
  const headers = ['ID', 'Element', 'WCAG Criterion', 'WCAG Code', 'Level', 'Severity', 'Status', 'Frequency', 'Notes', 'Created At'];
  const rows = state.findings.map(f => [
    f.id, f.element, f.wcag, f.wcagCode, f.level, f.severity, f.status,
    f.frequency, f.notes, f.createdAt,
  ].map(csvCell));

  const metaRows = [
    ['Page URL', meta.url],
    ['Scan Date', meta.date],
    ['Auditor', meta.auditor],
    [],
  ].map(r => r.map(csvCell));

  const csv = [...metaRows, headers.map(csvCell), ...rows].map(r => r.join(',')).join('\n');
  downloadFile('apg-audit.csv', csv, 'text/csv');
}

function exportJSON() {
  if (state.findings.length === 0) { alert('No findings to export.'); return; }

  const meta = getExportMeta();
  const payload = { meta, findings: state.findings };
  downloadFile('apg-audit.json', JSON.stringify(payload, null, 2), 'application/json');
}

function csvCell(val) {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
