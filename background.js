// Service worker — handles side panel activation, message routing, and APG pattern scoring

import { SIGNATURES } from './lib/signatures/index.js';
import { scoreAll }   from './lib/scorer.js';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'SCAN_PAGE':
      handleScanPage(msg.tabId, sendResponse);
      return true;
    case 'APG_SCORE':
      handleApgScore(msg.tabId, msg.xpath, sendResponse);
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

// ── APG Pattern Scoring ──────────────────────────────────────────────────────

async function handleApgScore(tabId, xpath, sendResponse) {
  if (!tabId || !xpath) { sendResponse({ error: 'Missing tabId or xpath' }); return; }

  // Ensure content script is loaded (page may have reloaded since last scan)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  }).catch(() => {}); // ignore "already loaded" guard error

  let serialized;
  try {
    serialized = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'FINGERPRINT_ELEMENT', xpath }, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (res?.error)          reject(new Error(res.error));
        else                          resolve(res);
      });
    });
  } catch (err) {
    sendResponse({ error: err.message });
    return;
  }

  const fingerprint = deserializeFingerprint(serialized);
  const allResults  = scoreAll(SIGNATURES, fingerprint);
  const results     = buildScoreResponse(allResults);

  // Phase 5: AI disambiguation — Haiku tiebreaker when confidence is low or close
  const { apiKey } = await chrome.storage.local.get('apiKey');
  const disambiguation = await maybeDisambiguate(results, apiKey);

  sendResponse({ results, disambiguation });
}

function deserializeFingerprint(data) {
  const passive = {
    ...data.passive,
    attrs:             new Set(data.passive.attrs),
    attrValues:        new Map(data.passive.attrValues),
    descendantsByRole: new Map(data.passive.descendantsByRole),
    peersByRole:       new Map(data.passive.peersByRole),
  };

  let active = null;
  if (data.active) {
    active = {
      keyProbes: new Map(
        data.active.keyProbes.map(([key, probe]) => [
          key, { ...probe, attrMutations: new Map(probe.attrMutations) },
        ])
      ),
      activationMutations: {
        self:   new Map(data.active.activationMutations.self),
        parent: new Map(data.active.activationMutations.parent),
      },
    };
  }

  return { passive, active };
}

function buildScoreResponse(allResults) {
  return allResults.slice(0, 3).map(result => {
    const sig = SIGNATURES.get(result.patternName);
    return {
      ...result,
      keyboardInteractions: sig?.keyboardInteractions ?? [],
      requiredRoles:        sig?.requiredRoles        ?? [],
      requiredAttributes:   sig?.requiredAttributes   ?? [],
      requiredStates:       sig?.requiredStates        ?? [],
      commonFailures:       sig?.commonFailures        ?? [],
    };
  });
}

// ── AI Disambiguation (Phase 5) ──────────────────────────────────────────────

/**
 * Call Claude Haiku to pick the best match when the scorer is not confident.
 * Trigger conditions:
 *   - top confidence < 0.60  (weak scorer result)
 *   - OR gap between top-1 and top-2 < 0.15 and both >= 0.30  (genuine tie)
 * Skipped when top confidence >= 0.85 (strong match — AI adds nothing).
 * Silent fail: returns null if the API call fails.
 *
 * @param {object[]} results — top 3 ScoreResults from buildScoreResponse
 * @param {string}   apiKey
 * @returns {Promise<{selectedPattern:string, reason:string}|null>}
 */
async function maybeDisambiguate(results, apiKey) {
  if (!apiKey || !results.length) return null;

  const top       = results[0];
  const runnerUp  = results[1];

  if (top.confidence >= 0.85) return null;

  const lowConfidence = top.confidence < 0.60;
  const tooClose      = runnerUp
    && runnerUp.confidence >= 0.30
    && (top.confidence - runnerUp.confidence) < 0.15;

  if (!lowConfidence && !tooClose) return null;

  const prompt = buildDisambiguationPrompt(results);

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw  = data.content?.[0]?.text ?? '';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*?\}/);
      parsed  = m ? JSON.parse(m[0]) : null;
    }
    return parsed?.selectedPattern ? { selectedPattern: parsed.selectedPattern, reason: parsed.reason ?? '' } : null;
  } catch {
    return null; // silent fail — scorer result is still shown
  }
}

function buildDisambiguationPrompt(results) {
  const candidates = results.map((r, i) => {
    const passed  = r.signals.filter(s =>  s.passed && !s.skipped).map(s => s.id).join(', ') || 'none';
    const failed  = r.signals.filter(s => !s.passed && !s.skipped && s.required).map(s => s.id).join(', ') || 'none';
    const skipped = r.signals.filter(s =>  s.skipped && s.required).map(s => s.id).join(', ') || 'none';
    return `${i + 1}. ${r.patternName} — ${Math.round(r.confidence * 100)}% scorer confidence
   Passed signals:      ${passed}
   Required failures:   ${failed}
   Unchecked required:  ${skipped}`;
  }).join('\n\n');

  return `You are an accessibility expert reviewing ARIA behavioral pattern analysis.

The scorer identified these APG pattern candidates based on DOM inspection and keyboard probing:

${candidates}

Pick the single most likely APG pattern. Respond with JSON only (no markdown, no explanation outside the JSON):
{"selectedPattern": "<exact name from list above>", "reason": "<one concise sentence explaining why>"}`;
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
