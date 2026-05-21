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

// ── Claude API ──────────────────────────────────────────────────────────────

async function handleClaudeLookup(payload, sendResponse) {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) { sendResponse({ error: 'No API key configured' }); return; }

  const { componentType, role, tagName, attributes, context } = payload;

  const prompt = `You are an accessibility expert specializing in the ARIA Authoring Practices Guide (APG).

A web component has been detected with the following characteristics:
- Tag: ${tagName}
- Detected type: ${componentType}
- ARIA role: ${role || 'none'}
- Key attributes: ${JSON.stringify(attributes)}
- Context: ${context || 'n/a'}

Respond with a JSON object (no markdown, no explanation, raw JSON only) with exactly these keys:
{
  "patternName": "<APG pattern name, e.g. 'Button', 'Dialog', 'Tabs'>",
  "patternUrl": "<APG docs URL>",
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
      // Try extracting JSON from within the response
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: 'Could not parse Claude response', raw };
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
