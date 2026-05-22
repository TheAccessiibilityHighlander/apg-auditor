/**
 * lib/scorer.js
 *
 * Pure scoring function — takes a signature and a fingerprint, returns a
 * confidence score with per-signal detail.
 *
 * No DOM access. No side effects. Fully unit-testable in Node.
 *
 * score(signature, fingerprint)     → ScoreResult
 * scoreAll(signatures, fingerprint) → ScoreResult[] sorted by confidence desc
 */

// ─── Native auto-pass rules ───────────────────────────────────────────────────
// Synthetic KeyboardEvents don't fire native activation on these elements.
// The Phase 3 scorer auto-passes responds-to-key activation checks for them.

const NATIVE_ENTER_TAGS = new Set(['button', 'a', 'area', 'summary']);
const NATIVE_SPACE_TAGS = new Set(['button', 'summary']);

function isNativeActivation(check, passive) {
  if (check.kind !== 'responds-to-key' || check.expect !== 'activation') return false;
  // <input> only gets auto-pass when it has button role (type=button/submit/reset/image).
  // Text, email, search, etc. inputs do not natively "activate" on Enter/Space.
  const tag = passive.tag === 'input'
    ? (passive.role === 'button' ? 'button' : null)
    : passive.tag;
  if (tag === null) return false;
  if (check.key === 'Enter') return NATIVE_ENTER_TAGS.has(tag);
  if (check.key === 'Space') return NATIVE_SPACE_TAGS.has(tag);
  return false;
}

// ─── Check evaluators ─────────────────────────────────────────────────────────

/**
 * @typedef {{ passed: boolean, reason: string, skipped?: boolean }} CheckResult
 */

/**
 * Evaluate one signal check against a fingerprint.
 *
 * @param {object} check       — signal.check from a signature
 * @param {object} passive     — PassiveFingerprint
 * @param {object|null} active — ActiveFingerprint or null
 * @returns {CheckResult}
 */
function evaluateCheck(check, passive, active) {
  switch (check.kind) {

    case 'role-equals':
      return {
        passed: passive.role === check.role,
        reason: passive.role === check.role
          ? `role is "${check.role}"`
          : `role is "${passive.role ?? 'none'}", expected "${check.role}"`,
      };

    case 'role-in': {
      const hit = check.roles.includes(passive.role);
      return {
        passed: hit,
        reason: hit
          ? `role "${passive.role}" is in [${check.roles.join(', ')}]`
          : `role "${passive.role ?? 'none'}" not in [${check.roles.join(', ')}]`,
      };
    }

    case 'tag-in': {
      const hit = check.tags.includes(passive.tag);
      return {
        passed: hit,
        reason: hit
          ? `tag <${passive.tag}> matches`
          : `tag <${passive.tag}> not in [${check.tags.join(', ')}]`,
      };
    }

    case 'attr-present': {
      const hit = passive.attrs.has(check.attr);
      return {
        passed: hit,
        reason: hit ? `${check.attr} is present` : `${check.attr} is absent`,
      };
    }

    case 'attr-absent': {
      const hit = !passive.attrs.has(check.attr);
      return {
        passed: hit,
        reason: hit ? `${check.attr} is absent` : `${check.attr} is present (should be absent)`,
      };
    }

    case 'has-descendant-role': {
      const count = passive.descendantsByRole.get(check.role) ?? 0;
      return {
        passed: count > 0,
        reason: count > 0
          ? `${count} descendant(s) with role="${check.role}"`
          : `no descendants with role="${check.role}"`,
      };
    }

    case 'roving-tabindex':
      return {
        passed: passive.rovingTabindex,
        reason: passive.rovingTabindex
          ? 'roving tabindex pattern detected'
          : 'no roving tabindex pattern found',
      };

    case 'in-tab-order':
      return {
        passed: passive.inTabOrder,
        reason: passive.inTabOrder
          ? 'element is in the tab order'
          : 'element is not reachable by Tab',
      };

    case 'peer-group-min': {
      const selfContributes = passive.role === check.role ? 1 : 0;
      const peerCount = passive.peersByRole.get(check.role) ?? 0;
      const total = selfContributes + peerCount;
      return {
        passed: total >= check.min,
        reason: `${total} of ${check.min} required element(s) with role="${check.role}"`,
      };
    }

    case 'computed-style': {
      const actual = passive.computedStyle?.[check.property];
      const hit = actual === check.value;
      return {
        passed: hit,
        reason: hit
          ? `${check.property}: ${check.value}`
          : `${check.property} is "${actual ?? 'unknown'}", expected "${check.value}"`,
      };
    }

    case 'responds-to-key': {
      if (!active) {
        return { passed: false, skipped: true, reason: 'no active fingerprint available' };
      }
      const probe = active.keyProbes.get(check.key);
      if (!probe) {
        return { passed: false, skipped: true, reason: `key "${check.key}" was not probed` };
      }
      switch (check.expect) {
        case 'focus-move':
          return {
            passed: probe.focusMoved,
            reason: probe.focusMoved
              ? `${check.key} moved focus`
              : `${check.key} did not move focus`,
          };
        case 'activation':
          return {
            passed: probe.activated,
            reason: probe.activated
              ? `${check.key} triggered activation`
              : `${check.key} did not trigger activation`,
          };
        case 'close':
          return {
            passed: probe.closed,
            reason: probe.closed
              ? `${check.key} closed/hid the element`
              : `${check.key} did not close the element`,
          };
        case 'value-change':
          return {
            passed: probe.valueChanged,
            reason: probe.valueChanged
              ? `${check.key} changed a value attribute`
              : `${check.key} did not change a value attribute`,
          };
        default:
          return { passed: false, skipped: true, reason: `unknown expect "${check.expect}"` };
      }
    }

    case 'activation-mutates': {
      if (!active) {
        return { passed: false, skipped: true, reason: 'no active fingerprint available' };
      }
      const mutations = check.target === 'parent'
        ? active.activationMutations.parent
        : active.activationMutations.self;
      const hit = mutations.has(check.attr);
      return {
        passed: hit,
        reason: hit
          ? `activation changed ${check.attr} on ${check.target}`
          : `activation did not change ${check.attr} on ${check.target}`,
      };
    }

    default:
      return { passed: false, skipped: true, reason: `unknown check kind "${check.kind}"` };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @typedef {object} SignalResult
 * @property {string}  id
 * @property {string}  description
 * @property {number}  weight
 * @property {boolean} required
 * @property {boolean} passed
 * @property {boolean} skipped
 * @property {string}  reason
 */

/**
 * @typedef {object} ScoreResult
 * @property {string}         patternName
 * @property {string}         patternUrl
 * @property {number}         confidence   — 0.0–1.0
 * @property {number}         rawScore
 * @property {number}         maxScore
 * @property {boolean}        hardFailed   — true if any required signal failed
 * @property {string[]}       requiredFailed — ids of failed required signals
 * @property {SignalResult[]} signals
 */

/**
 * Score one signature against a fingerprint.
 *
 * @param {object} signature
 * @param {{ passive: object, active: object|null }} fingerprint
 * @returns {ScoreResult}
 */
export function score(signature, fingerprint) {
  const { passive, active } = fingerprint;
  const signalResults = [];
  let rawScore = 0;
  let maxScore = 0;
  const requiredFailed = [];

  const requiredSkipped = [];

  for (const signal of signature.signals) {
    // Auto-pass native activation (synthetic events can't trigger native behavior)
    const autoPass = isNativeActivation(signal.check, passive);

    const checkResult = autoPass
      ? { passed: true, reason: `auto-pass: native <${passive.tag}> handles ${signal.check.key}` }
      : evaluateCheck(signal.check, passive, active);

    const passed  = checkResult.passed;
    const skipped = checkResult.skipped ?? false;

    // Skipped signals are excluded from both rawScore and maxScore so that
    // passive-only fingerprinting gives a fair confidence over what was checked.
    if (!skipped) {
      maxScore += signal.weight;
      if (passed) rawScore += signal.weight;
    }

    if (signal.required && !passed && !skipped) requiredFailed.push(signal.id);
    if (signal.required && skipped)             requiredSkipped.push(signal.id);

    signalResults.push({
      id:          signal.id,
      description: signal.description,
      weight:      signal.weight,
      required:    signal.required,
      passed,
      skipped,
      reason:      checkResult.reason,
    });
  }

  // hardFailed only fires for checks that ran and failed — not for skipped checks.
  const hardFailed = requiredFailed.length > 0;
  let confidence = maxScore > 0 ? rawScore / maxScore : 0;

  // Required signal failures cap confidence at 0.4
  if (hardFailed) confidence = Math.min(confidence, 0.4);

  return {
    patternName:     signature.patternName,
    patternUrl:      signature.patternUrl,
    confidence:      Math.round(confidence * 1000) / 1000, // 3 decimal places
    rawScore,
    maxScore,
    hardFailed,
    requiredFailed,   // signals that ran and failed (required:true)
    requiredSkipped,  // signals that couldn't run (required:true, no active fingerprint)
    signals:          signalResults,
  };
}

/**
 * Score all signatures and return results sorted by confidence descending.
 *
 * @param {Map<string, object>} signatures — from lib/signatures/index.js
 * @param {{ passive: object, active: object|null }} fingerprint
 * @returns {ScoreResult[]}
 */
export function scoreAll(signatures, fingerprint) {
  const results = [];
  for (const sig of signatures.values()) {
    results.push(score(sig, fingerprint));
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}
