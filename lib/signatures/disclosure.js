/**
 * APG Pattern: Disclosure (Show/Hide)
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * Design notes:
 * - Two implementation paths must both score well:
 *
 *   PATH A — Custom (ARIA):
 *     <button aria-expanded="false" aria-controls="sect1">Toggle</button>
 *     <div id="sect1" hidden>...</div>
 *     Signals: role-button, aria-expanded-present, aria-controls-present,
 *              activation-mutates aria-expanded, Enter/Space activate.
 *
 *   PATH B — Native:
 *     <details><summary>Toggle</summary>...</details>
 *     Signals: native-details-tag, activation-mutates parent 'open',
 *              Enter activates. No aria-expanded needed (browser manages it).
 *
 * - Neither path triggers ALL required signals; the scorer must not penalize
 *   a native <details> for lacking aria-expanded, and must not penalize a
 *   custom ARIA disclosure for not being a <details> element.
 *   Achieved by making the "path A OR path B" signals required:false but
 *   high weight, and keeping only universal signals as required:true.
 *
 * - Disclosure vs Accordion: a standalone disclosure has no APG-specified
 *   sibling relationship. Accordion is a group of disclosures with a
 *   coordinated open-one-at-a-time or multi-open convention. The scorer
 *   distinguishes them via the Accordion signature's peer-group-min signal.
 *   This signature does not penalize multiple siblings.
 *
 * - activation-mutates for native details targets 'parent' (the <details>
 *   element whose 'open' attribute is toggled by <summary> activation).
 *   'parent' is an extension to the spec'd target list; Phase 3 must
 *   implement it.
 */
export default {
  patternName: 'Disclosure',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',

  keyboardInteractions: [
    'Enter: Activates the disclosure button, toggling the visibility of the controlled section.',
    'Space: Activates the disclosure button (when focus is on a <button> element).',
  ],

  requiredRoles: ['button (the disclosure control)'],
  requiredAttributes: [
    'aria-expanded (on the button — false when hidden, true when visible)',
    'aria-controls (on the button — references the controlled section ID)',
  ],
  requiredStates: [
    'aria-expanded="false" when the controlled section is hidden',
    'aria-expanded="true" when the controlled section is visible',
  ],

  commonFailures: [
    'aria-expanded is absent on the control button — screen readers cannot announce the current show/hide state.',
    'The controlled section is hidden with CSS only (visibility:hidden or opacity:0) rather than display:none or hidden attribute — content is hidden visually but remains in the accessibility tree.',
    'aria-controls is missing — the button is not programmatically linked to the content it controls.',
  ],

  signals: [
    {
      id: 'in-tab-order',
      description: 'Control element is reachable by Tab key',
      weight: 5,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'enter-activates',
      description: 'Enter key toggles the controlled section',
      weight: 8,
      required: true,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    // ── Path A: ARIA custom disclosure ──────────────────────────────────────
    {
      id: 'role-button',
      description: 'Control has button role (required for ARIA path)',
      weight: 6,
      required: false,
      check: { kind: 'role-equals', role: 'button' },
    },
    {
      id: 'aria-expanded-present',
      description: 'aria-expanded attribute is present on the control',
      weight: 9,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'aria-controls-present',
      description: 'aria-controls links the button to its controlled section',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-controls' },
    },
    {
      id: 'activation-mutates-expanded',
      description: 'Activation toggles aria-expanded on the control (ARIA path)',
      weight: 9,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' },
    },
    {
      id: 'space-activates',
      description: 'Space key activates the control',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    // ── Path B: Native <details>/<summary> ──────────────────────────────────
    {
      id: 'native-details-tag',
      description: 'Uses native <details> or <summary> element',
      weight: 8,
      required: false,
      check: { kind: 'tag-in', tags: ['details', 'summary'] },
    },
    {
      id: 'activation-mutates-open',
      description: 'Activation toggles the "open" attribute on the parent <details> (native path)',
      weight: 9,
      required: false,
      check: { kind: 'activation-mutates', target: 'parent', attr: 'open' },
    },
  ],
};
