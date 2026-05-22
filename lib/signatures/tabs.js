/**
 * APG Pattern: Tabs
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Design notes:
 * - The fingerprint target may be the tablist container OR an individual tab.
 *   Signals are written to score well from either entry point:
 *   - From tablist: has-descendant-role:tab and has-descendant-role:tabpanel
 *     are direct checks. roving-tabindex is observed on children.
 *   - From tab: role-tab fires. peer-group-min checks sibling tabs.
 *     aria-selected is an attr-present check on self.
 * - roving-tabindex is required: APG mandates that only the active tab
 *   is in the tab sequence (tabindex="0"), all others are tabindex="-1".
 *   If arrow keys don't move focus between tabs, this is a hard failure.
 * - Arrow key direction: horizontal tabs use Left/Right; vertical use Up/Down.
 *   Both are included; the scorer awards either pair.
 * - Automatic vs manual activation: APG allows both. The scorer does not
 *   distinguish — either pattern is valid.
 */
export default {
  patternName: 'Tabs',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',

  keyboardInteractions: [
    'Tab: Moves focus into the tab list; from the active tab, Tab moves focus to the associated tabpanel.',
    'ArrowRight / ArrowDown: Moves focus to next tab; wraps from last to first.',
    'ArrowLeft / ArrowUp: Moves focus to previous tab; wraps from first to last.',
    'Home: Moves focus to first tab.',
    'End: Moves focus to last tab.',
    'Space / Enter (manual activation): Activates the focused tab.',
  ],

  requiredRoles: [
    'tablist (container for all tabs)',
    'tab (each tab control)',
    'tabpanel (content panel associated with each tab)',
  ],
  requiredAttributes: [
    'aria-selected (on each tab — true for active, false for inactive)',
    'aria-controls (on each tab — references its tabpanel ID)',
    'aria-labelledby (on each tabpanel — references its tab ID)',
  ],
  requiredStates: [
    'aria-selected="true" on the currently active tab',
    'aria-selected="false" on all inactive tabs',
    'tabindex="0" on active tab; tabindex="-1" on inactive tabs (roving tabindex)',
  ],

  commonFailures: [
    'Arrow key navigation between tabs is not implemented — Tab key is used instead, forcing keyboard users to tab through every tab to reach the panel.',
    'aria-selected is absent on tab elements — screen readers cannot announce which tab is currently active.',
    'tabpanel elements are missing role="tabpanel" and/or aria-labelledby — the content region is not programmatically associated with its tab.',
  ],

  signals: [
    {
      id: 'role-tablist',
      description: 'Container has role="tablist" or element is inside a tablist',
      weight: 8,
      required: false,
      check: { kind: 'role-equals', role: 'tablist' },
    },
    {
      id: 'role-tab',
      description: 'Element or its children have role="tab"',
      weight: 8,
      required: true,
      check: { kind: 'has-descendant-role', role: 'tab' },
    },
    {
      id: 'has-tabpanel',
      description: 'Associated tabpanel elements exist in the document',
      weight: 7,
      required: true,
      check: { kind: 'has-descendant-role', role: 'tabpanel' },
    },
    {
      id: 'aria-selected-present',
      description: 'Tab elements carry aria-selected',
      weight: 8,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-selected' },
    },
    {
      id: 'roving-tabindex',
      description: 'Uses roving tabindex (active tab: 0, inactive: -1)',
      weight: 8,
      required: true,
      check: { kind: 'roving-tabindex' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to next tab',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'arrow-left-moves-focus',
      description: 'ArrowLeft moves focus to previous tab',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'focus-move' },
    },
    {
      id: 'home-moves-focus',
      description: 'Home key moves focus to first tab',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'Home', expect: 'focus-move' },
    },
    {
      id: 'end-moves-focus',
      description: 'End key moves focus to last tab',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'End', expect: 'focus-move' },
    },
    {
      id: 'peer-group-tabs',
      description: 'At least 2 sibling tab elements exist',
      weight: 4,
      required: false,
      check: { kind: 'peer-group-min', role: 'tab', min: 2 },
    },
  ],
};
