// Service worker — handles side panel activation, message routing, and Claude API calls

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'SCAN_PAGE':
      handleScanPage(msg.tabId, sendResponse);
      return true;
    case 'CLAUDE_APG_LOOKUP':
      handleClaudeLookup(msg.payload, sendResponse);
      return true;
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true;
    case 'SAVE_SETTINGS':
      handleSaveSettings(msg.payload, sendResponse);
      return true;
  }
});

// Called by the side panel to kick off a scan on the active tab
async function handleScanPage(tabId, sendResponse) {
  console.log('[APG] handleScanPage called, tabId:', tabId);
  if (!tabId) {
    console.error('[APG] No tabId provided');
    sendResponse({ error: 'No active tab' });
    return;
  }
  try {
    // Inject content script first (handles tabs opened before extension loaded)
    console.log('[APG] Injecting content.js into tab', tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    }).catch(() => {}); // ignore "already loaded" guard error

    console.log('[APG] Injecting axe.min.js into tab', tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['axe.min.js'],
    });

    console.log('[APG] Sending START_SCAN to content script');
    await chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' });
    console.log('[APG] START_SCAN sent');
    sendResponse({ ok: true });
  } catch (err) {
    console.error('[APG] Scan setup failed:', err.message);
    sendResponse({ error: err.message });
  }
}

// ── APG pattern slug → validated URL ────────────────────────────────────────
// All slugs verified against https://www.w3.org/WAI/ARIA/apg/patterns/

const APG_PATTERNS = {
  'accordion':         'accordion',
  'alert':             'alert',
  'alert-dialog':      'alertdialog',
  'breadcrumb':        'breadcrumb',
  'button':            'button',
  'carousel':          'carousel',
  'checkbox':          'checkbox',
  'combobox':          'combobox',
  'dialog':            'dialog-modal',
  'disclosure':        'disclosure',
  'feed':              'feed',
  'grid':              'grid',
  'link':              'link',
  'listbox':           'listbox',
  'menu-button':       'menu-button',
  'menubar':           'menubar',
  'meter':             'meter',
  'radio-group':       'radio',
  'slider':            'slider',
  'slider-multithumb': 'slider-multithumb',
  'spinbutton':        'spinbutton',
  'switch':            'switch',
  'table':             'table',
  'tabs':              'tabs',
  'toolbar':           'toolbar',
  'tooltip':           'tooltip',
  'tree-view':         'treeview',
  'treegrid':          'treegrid',
  'window-splitter':   'windowsplitter',
};

const APG_BASE = 'https://www.w3.org/WAI/ARIA/apg/patterns/';

function resolveApgUrl(slug) {
  if (!slug) return APG_BASE;
  const normalized = slug.toLowerCase().trim();
  // Direct match
  if (APG_PATTERNS[normalized]) return APG_BASE + APG_PATTERNS[normalized] + '/';
  // Fuzzy: find a key that contains the slug or vice versa
  const fuzzy = Object.entries(APG_PATTERNS).find(
    ([k]) => k.includes(normalized) || normalized.includes(k)
  );
  return fuzzy ? APG_BASE + fuzzy[1] + '/' : APG_BASE;
}

// ── Claude API ──────────────────────────────────────────────────────────────

async function handleClaudeLookup(payload, sendResponse) {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) { sendResponse({ error: 'No API key configured' }); return; }

  const { componentType, role, tagName, attributes, context } = payload;

  const slugList = Object.keys(APG_PATTERNS).join(', ');

  const prompt = `You are an accessibility expert specializing in the ARIA Authoring Practices Guide (APG).

A web component has been detected with the following characteristics:
- Tag: ${tagName}
- Detected type: ${componentType}
- ARIA role: ${role || 'none'}
- Key attributes: ${JSON.stringify(attributes)}
- Context: ${context || 'n/a'}

Valid APG pattern slugs (pick the closest match for "patternSlug"):
${slugList}

Respond with a JSON object (no markdown, no explanation, raw JSON only) with exactly these keys:
{
  "patternName": "<human-readable APG pattern name, e.g. 'Button', 'Modal Dialog', 'Tabs'>",
  "patternSlug": "<one slug from the list above — must match exactly>",
  "keyboardInteractions": ["<interaction 1>", "<interaction 2>", ...],
  "requiredRoles": ["<role>", ...],
  "requiredAttributes": ["<aria-* attribute>", ...],
  "requiredStates": ["<aria-* state>", ...],
  "commonFailures": ["<failure 1>", "<failure 2>", "<failure 3>"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      sendResponse({ error: `API error ${res.status}: ${errText}` });
      return;
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? '';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: 'Could not parse Claude response', raw };
    }
    // Always resolve URL from the slug — never trust a freehand URL from Claude
    if (parsed && !parsed.error) {
      parsed.patternUrl = resolveApgUrl(parsed.patternSlug);
    }
    sendResponse({ result: parsed });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

// ── Settings ────────────────────────────────────────────────────────────────

async function handleGetSettings(sendResponse) {
  const data = await chrome.storage.local.get(['apiKey', 'autoScan', 'theme']);
  sendResponse({ settings: data });
}

async function handleSaveSettings(payload, sendResponse) {
  await chrome.storage.local.set(payload);
  sendResponse({ ok: true });
}
